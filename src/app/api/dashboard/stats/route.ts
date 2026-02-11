import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { subDays } from "date-fns"

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const today = new Date()
  const sevenDaysAgo = subDays(today, 7)

  // Total products
  const totalProducts = await db.product.count({
    where: { isActive: true },
  })

  // Low stock products
  const lowStockProducts = await db.product.count({
    where: {
      isActive: true,
      stockQuantity: {
        lte: db.product.fields.minStockLevel,
      },
    },
  })

  // Sales last 7 days
  const recentSales = await db.sale.findMany({
    where: {
      createdAt: { gte: sevenDaysAgo },
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

  // Calculate revenue and profit
  let totalRevenue = 0
  let totalProfit = 0

  recentSales.forEach((sale) => {
    totalRevenue += sale.total
    sale.items.forEach((item) => {
      const profit = (item.unitPrice - item.product.costPrice) * item.quantity
      totalProfit += profit
    })
  })

  // Recent 5 sales for display
  const latestSales = await db.sale.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      soldBy: {
        select: { name: true },
      },
    },
  })

  // Unread alerts
  const unreadAlerts = await db.alert.count({
    where: { isRead: false },
  })

  return NextResponse.json({
    totalProducts,
    lowStockProducts,
    totalRevenue,
    totalProfit,
    totalTransactions: recentSales.length,
    latestSales,
    unreadAlerts,
  })
}