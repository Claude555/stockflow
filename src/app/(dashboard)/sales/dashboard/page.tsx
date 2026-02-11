"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DollarSign, ShoppingCart, TrendingUp, Calendar } from "lucide-react"
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"

export default function SalesDashboardPage() {
  const [sales, setSales] = useState([])
  const [period, setPeriod] = useState("today")
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalProfit: 0,
    averageOrderValue: 0,
  })

  useEffect(() => {
    fetchSales()
  }, [period])

  async function fetchSales() {
    const response = await fetch("/api/sales")
    const allSales = await response.json()
    
    // Filter by period
    const now = new Date()
    let filteredSales = allSales

    if (period === "today") {
      const todayStart = startOfDay(now)
      const todayEnd = endOfDay(now)
      filteredSales = allSales.filter((sale: any) => {
        const saleDate = new Date(sale.createdAt)
        return saleDate >= todayStart && saleDate <= todayEnd
      })
    } else if (period === "week") {
      const weekStart = startOfWeek(now)
      const weekEnd = endOfWeek(now)
      filteredSales = allSales.filter((sale: any) => {
        const saleDate = new Date(sale.createdAt)
        return saleDate >= weekStart && saleDate <= weekEnd
      })
    } else if (period === "month") {
      const monthStart = startOfMonth(now)
      const monthEnd = endOfMonth(now)
      filteredSales = allSales.filter((sale: any) => {
        const saleDate = new Date(sale.createdAt)
        return saleDate >= monthStart && saleDate <= monthEnd
      })
    }

    setSales(filteredSales)
    calculateStats(filteredSales)
  }

  function calculateStats(salesData: any[]) {
    const completedSales = salesData.filter(
      (sale: any) => sale.paymentStatus === "COMPLETED"
    )

    const totalRevenue = completedSales.reduce(
      (sum: number, sale: any) => sum + sale.total,
      0
    )

    let totalProfit = 0
    completedSales.forEach((sale: any) => {
      sale.items.forEach((item: any) => {
        const profit = (item.unitPrice - item.product.costPrice) * item.quantity
        totalProfit += profit
      })
    })

    setStats({
      totalSales: completedSales.length,
      totalRevenue,
      totalProfit,
      averageOrderValue:
        completedSales.length > 0 ? totalRevenue / completedSales.length : 0,
    })
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales Dashboard</h1>
          <p className="text-muted-foreground">Track your daily, weekly, and monthly sales</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
            <p className="text-xs text-muted-foreground">Transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              KES {stats.totalProfit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalRevenue > 0
                ? ((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1)
                : 0}
              % margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Order</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {stats.averageOrderValue.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No sales found for this period
            </div>
          ) : (
            <div className="space-y-3">
              {sales.slice(0, 20).map((sale: any) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{sale.saleNumber}</p>
                      <Badge
                        variant={
                          sale.paymentStatus === "COMPLETED"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {sale.paymentStatus}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(sale.createdAt), "PPp")} • {sale.items.length} item(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      KES {sale.total.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {sale.paymentMethod}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}