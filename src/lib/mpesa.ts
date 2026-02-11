import axios from "axios"

const MPESA_BASE_URL =
  process.env.MPESA_ENVIRONMENT === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke"

// Generate OAuth token
export async function getMpesaToken() {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString("base64")

  try {
    const response = await axios.get(
      `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    )

    return response.data.access_token
  } catch (error) {
    console.error("M-Pesa token error:", error)
    throw new Error("Failed to get M-Pesa token")
  }
}

// Format phone number to 254XXXXXXXXX
export function formatPhoneNumber(phone: string): string {
  // Remove any spaces, dashes, or plus signs
  let cleaned = phone.replace(/[\s\-\+]/g, "")

  // If starts with 0, replace with 254
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.slice(1)
  }

  // If starts with 7 or 1, add 254
  if (cleaned.startsWith("7") || cleaned.startsWith("1")) {
    cleaned = "254" + cleaned
  }

  return cleaned
}

// Initiate STK Push
export async function initiateMpesaPayment(
  phoneNumber: string,
  amount: number,
  accountReference: string,
  transactionDesc: string
) {
  const token = await getMpesaToken()
  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14)

  const shortcode = process.env.MPESA_SHORTCODE || "174379"
  const passkey = process.env.MPESA_PASSKEY || ""

  // Generate password
  const password = Buffer.from(shortcode + passkey + timestamp).toString(
    "base64"
  )

  const formattedPhone = formatPhoneNumber(phoneNumber)

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.round(amount),
    PartyA: formattedPhone,
    PartyB: shortcode,
    PhoneNumber: formattedPhone,
    CallBackURL: process.env.MPESA_CALLBACK_URL,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc,
  }

  try {
    const response = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    return response.data
  } catch (error: any) {
    console.error("M-Pesa STK Push error:", error.response?.data || error)
    throw new Error(
      error.response?.data?.errorMessage || "Failed to initiate M-Pesa payment"
    )
  }
}

// Query STK Push status
export async function queryMpesaPayment(checkoutRequestId: string) {
  const token = await getMpesaToken()
  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14)

  const shortcode = process.env.MPESA_SHORTCODE || "174379"
  const passkey = process.env.MPESA_PASSKEY || ""

  const password = Buffer.from(shortcode + passkey + timestamp).toString(
    "base64"
  )

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId,
  }

  try {
    const response = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    return response.data
  } catch (error: any) {
    console.error("M-Pesa query error:", error.response?.data || error)
    throw new Error("Failed to query M-Pesa payment")
  }
}