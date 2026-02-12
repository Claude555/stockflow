"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingCart, Package, TrendingUp, BarChart3 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface DashboardStats {
  totalRevenue: number
  totalSales: number
  totalProducts: number
  lowStockItems: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalSales: 0,
    totalProducts: 0,
    lowStockItems: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      // Fetch sales
      const salesResponse = await fetch("/api/sales")
      const salesData = await salesResponse.json()
      
      // Fetch products
      const productsResponse = await fetch("/api/products")
      const productsData = await productsResponse.json()

      // Calculate stats
      const completedSales = salesData.filter(
        (sale: any) => sale.paymentStatus === "COMPLETED"
      )
      
      const totalRevenue = completedSales.reduce(
        (sum: number, sale: any) => sum + sale.total,
        0
      )

      const lowStock = productsData.filter(
        (product: any) => product.stockQuantity <= product.minStockLevel
      )

      setStats({
        totalRevenue,
        totalSales: completedSales.length,
        totalProducts: productsData.length,
        lowStockItems: lowStock.length,
      })
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Welcome back! Here's your business overview.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              KES {stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.totalSales}</div>
            <p className="text-xs text-muted-foreground">Transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">In inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-orange-600">
              {stats.lowStockItems}
            </div>
            <p className="text-xs text-muted-foreground">Items</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Link href="/pos" className="block">
              <Button className="w-full h-16 sm:h-20 flex flex-col gap-2 text-sm">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>New Sale</span>
              </Button>
            </Link>
            
            <Link href="/inventory" className="block">
              <Button variant="outline" className="w-full h-16 sm:h-20 flex flex-col gap-2 text-sm">
                <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>Add Product</span>
              </Button>
            </Link>
            
            <Link href="/sales/dashboard" className="block">
              <Button variant="outline" className="w-full h-16 sm:h-20 flex flex-col gap-2 text-sm">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>View Sales</span>
              </Button>
            </Link>
            
            <Link href="/analytics" className="block">
              <Button variant="outline" className="w-full h-16 sm:h-20 flex flex-col gap-2 text-sm">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>Analytics</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Section */}
      {stats.lowStockItems > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg text-orange-600">
              ⚠️ Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You have {stats.lowStockItems} product{stats.lowStockItems !== 1 ? 's' : ''} running low on stock.
            </p>
            <Link href="/inventory">
              <Button variant="outline" className="mt-3">
                View Inventory
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}