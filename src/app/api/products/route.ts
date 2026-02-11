import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { z } from "zod"

const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  categoryId: z.string(),
  costPrice: z.number().positive(),
  sellingPrice: z.number().positive(),
  stockQuantity: z.number().int().min(0),
  minStockLevel: z.number().int().min(0).default(10),
  unit: z.string().default("pcs"),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search")

  const products = await db.product.findMany({
    where: {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      category: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(products)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const validatedData = productSchema.parse(body)

    const profitMargin =
      ((validatedData.sellingPrice - validatedData.costPrice) /
        validatedData.costPrice) * 100

    const product = await db.product.create({
      data: {
        ...validatedData,
        profitMargin,
        createdById: session.user.id,
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    )
  }
}