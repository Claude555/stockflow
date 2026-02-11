import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { z } from "zod"

const storeSettingsSchema = z.object({
  storeName: z.string().min(1),
  storeEmail: z.string().email().optional().or(z.literal("")),
  storePhone: z.string().optional(),
  storeAddress: z.string().optional(),
  currency: z.string().default("KES"),
  taxRate: z.number().min(0).max(100).default(0),
  receiptFooter: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let settings = await db.storeSettings.findFirst()

  // Create default settings if none exist
  if (!settings) {
    settings = await db.storeSettings.create({
      data: {
        storeName: "StockFlow",
        currency: "KES",
      },
    })
  }

  return NextResponse.json(settings)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Only admin can update store settings
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const validatedData = storeSettingsSchema.parse(body)

    let settings = await db.storeSettings.findFirst()

    if (settings) {
      settings = await db.storeSettings.update({
        where: { id: settings.id },
        data: validatedData,
      })
    } else {
      settings = await db.storeSettings.create({
        data: validatedData,
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    )
  }
}