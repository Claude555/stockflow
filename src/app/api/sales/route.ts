import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { z } from "zod"

const saleItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
})

const saleSchema = z.object({
  items: z.array(saleItemSchema).min(1),
  paymentMethod: z.enum(["CASH", "MPESA", "BANK_TRANSFER"]),
  discount: z.number().min(0).default(0),
  notes: z.string().optional(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    console.log("Received sale data:", body)

    const validatedData = saleSchema.parse(body)

    // Calculate totals
    const subtotal = validatedData.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    )
    const total = Math.max(subtotal - validatedData.discount, 0)

    // Generate sale number
    const count = await db.sale.count()
    const saleNumber = `SL${String(count + 1).padStart(6, "0")}`

    // Start transaction
    const sale = await db.$transaction(async (tx) => {
      // Check stock availability
      for (const item of validatedData.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        })

        if (!product || product.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for ${product?.name || "product"}`)
        }
      }

      // Create sale
      const newSale = await tx.sale.create({
  data: {
    saleNumber,
    subtotal, // ✅ ADD THIS
    total,
    paymentMethod: validatedData.paymentMethod,
    paymentStatus:
      validatedData.paymentMethod === "MPESA" ? "PENDING" : "COMPLETED",
    soldById: session.user.id,

    items: {
      create: validatedData.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.unitPrice * item.quantity,
      })),
    },
  },
  include: {
    items: {
      include: {
        product: true,
      },
    },
    soldBy: {
      select: {
        name: true,
        email: true,
      },
    },
  },
})

      // Update stock
      for (const item of validatedData.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        })
      }

      return newSale
    })

    console.log("Sale created successfully:", sale)
    return NextResponse.json(sale)
  } catch (error) {
    console.error("Sale creation error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data format", details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create sale" },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get("limit") || "100")

  const sales = await db.sale.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      soldBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  return NextResponse.json(sales)
}