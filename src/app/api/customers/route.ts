import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { z } from "zod"

const customerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const customers = await db.customer.findMany({
    include: {
      _count: {
        select: {
          sales: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Calculate total spent per customer
  const customersWithStats = await Promise.all(
    customers.map(async (customer) => {
      const sales = await db.sale.findMany({
        where: { customerId: customer.id, paymentStatus: "COMPLETED" },
      })
      const totalSpent = sales.reduce((sum, sale) => sum + sale.total, 0)
      return {
        ...customer,
        totalSpent,
      }
    })
  )

  return NextResponse.json(customersWithStats)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const validatedData = customerSchema.parse(body)

    const customer = await db.customer.create({
      data: {
        name: validatedData.name,
        phone: validatedData.phone,
        email: validatedData.email || null,
        address: validatedData.address,
      },
    })

    return NextResponse.json(customer)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    )
  }
}