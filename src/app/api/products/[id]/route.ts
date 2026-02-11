import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
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

/* UPDATE PRODUCT */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const validatedData = productSchema.parse(body)

    const profitMargin =
      ((validatedData.sellingPrice - validatedData.costPrice) /
        validatedData.costPrice) *
      100

    const product = await db.product.update({
      where: { id },
      data: {
        ...validatedData,
        profitMargin,
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
      { error: "Failed to update product" },
      { status: 500 }
    )
  }
}

/* SOFT DELETE PRODUCT */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params

    await db.product.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    )
  }
}