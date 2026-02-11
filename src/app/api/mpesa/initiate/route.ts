import { auth } from "@/lib/auth"
import { initiateMpesaPayment } from "@/lib/mpesa"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { z } from "zod"

const mpesaSchema = z.object({
  saleId: z.string(),
  phoneNumber: z.string().min(10),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { saleId, phoneNumber } = mpesaSchema.parse(body)

    // Get sale details
    const sale = await db.sale.findUnique({
      where: { id: saleId },
    })

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    // Initiate M-Pesa payment
    const response = await initiateMpesaPayment(
      phoneNumber,
      sale.total,
      sale.saleNumber,
      `Payment for ${sale.saleNumber}`
    )

    // Update sale with checkout request ID
    await db.sale.update({
      where: { id: saleId },
      data: {
        mpesaCode: response.CheckoutRequestID,
      },
    })

    return NextResponse.json({
      success: true,
      checkoutRequestId: response.CheckoutRequestID,
      message: response.CustomerMessage,
    })
  } catch (error) {
    console.error("M-Pesa initiation error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to initiate payment",
      },
      { status: 500 }
    )
  }
}