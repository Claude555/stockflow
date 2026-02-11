import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("M-Pesa Callback:", JSON.stringify(body, null, 2))

    const { Body } = body

    if (!Body?.stkCallback) {
      return NextResponse.json({ error: "Invalid callback" }, { status: 400 })
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = Body.stkCallback

    // Find sale by merchant request ID or checkout request ID
    // You'll need to store these IDs when initiating payment
    const sale = await db.sale.findFirst({
      where: {
        OR: [
          { mpesaCode: MerchantRequestID },
          { mpesaCode: CheckoutRequestID },
        ],
      },
    })

    if (!sale) {
      console.log("Sale not found for callback")
      return NextResponse.json({ success: true })
    }

    // Payment successful
    if (ResultCode === 0) {
      const metadata = CallbackMetadata?.Item || []
      const mpesaReceiptNumber = metadata.find(
        (item: any) => item.Name === "MpesaReceiptNumber"
      )?.Value

      await db.sale.update({
        where: { id: sale.id },
        data: {
          paymentStatus: "COMPLETED",
          mpesaCode: mpesaReceiptNumber || CheckoutRequestID,
        },
      })

      console.log("Payment completed:", mpesaReceiptNumber)
    } else {
      // Payment failed
      await db.sale.update({
        where: { id: sale.id },
        data: {
          paymentStatus: "FAILED",
        },
      })

      console.log("Payment failed:", ResultDesc)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Callback error:", error)
    return NextResponse.json({ success: true }) // Always return success to M-Pesa
  }
}