import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { subDays, startOfDay } from "date-fns"

type DailySale = {
  date: string
  revenue: number
  count: number
}

type ProductSalesEntry = {
  product: {
    id: string
    name: string
    costPrice: number
  }
  quantity: number
  revenue: number
}

type PaymentMethodStats = {
  count: number
  total: number
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const period = searchParams.get("period") ?? "7days"

  const endDate = new Date()
  let startDate: Date

  switch (period) {
    case "30days":
      startDate = subDays(endDate, 30)
      break
    case "90days":
      startDate = subDays(endDate, 90)
      break
    default:
      startDate = subDays(endDate, 7)
  }

  /* ================= SALES ================= */

  const sales = await db.sale.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      paymentStatus: "COMPLETED",
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  })

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0)

  /* ================= PROFIT ================= */

  let totalProfit = 0
  for (const sale of sales) {
    for (const item of sale.items) {
      totalProfit +=
        (item.unitPrice - item.product.costPrice) * item.quantity
    }
  }

  /* ================= DAILY SALES ================= */

  const dailySales: Record<string, DailySale> = {}

  for (const sale of sales) {
    const dateKey = startOfDay(sale.createdAt).toISOString()

    if (!dailySales[dateKey]) {
      dailySales[dateKey] = {
        date: dateKey,
        revenue: 0,
        count: 0,
      }
    }

    dailySales[dateKey].revenue += sale.total
    dailySales[dateKey].count += 1
  }

  const dailySalesArray = Object.values(dailySales).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  /* ================= BEST SELLERS ================= */

  const productSales: Record<string, ProductSalesEntry> = {}

  for (const sale of sales) {
    for (const item of sale.items) {
      if (!productSales[item.productId]) {
        productSales[item.productId] = {
          product: item.product,
          quantity: 0,
          revenue: 0,
        }
      }

      productSales[item.productId].quantity += item.quantity
      productSales[item.productId].revenue += item.subtotal
    }
  }

  const bestSellers = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  /* ================= PAYMENT METHODS ================= */

  const paymentMethods = sales.reduce<Record<string, PaymentMethodStats>>(
    (acc, sale) => {
      if (!acc[sale.paymentMethod]) {
        acc[sale.paymentMethod] = { count: 0, total: 0 }
      }

      acc[sale.paymentMethod].count += 1
      acc[sale.paymentMethod].total += sale.total
      return acc
    },
    {}
  )

  /* ================= LOW STOCK ================= */

  const lowStock = await db.product.findMany({
    where: {
      isActive: true,
      stockQuantity: {
        lte: 10, // ✅ must be a literal or computed value
      },
    },
    include: {
      category: true,
    },
    orderBy: {
      stockQuantity: "asc",
    },
    take: 10,
  })

  /* ================= RESPONSE ================= */

  return NextResponse.json({
    summary: {
      totalRevenue,
      totalProfit,
      totalTransactions: sales.length,
      averageOrderValue:
        sales.length > 0 ? totalRevenue / sales.length : 0,
      profitMargin:
        totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
    },
    dailySales: dailySalesArray,
    bestSellers,
    paymentMethods,
    lowStock,
  })
}