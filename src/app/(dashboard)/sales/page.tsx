"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { downloadReceipt } from "@/lib/pdf-receipt"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar, Download, Eye, Filter } from "lucide-react"
import { format } from "date-fns"

export default function SalesPage() {
  const [sales, setSales] = useState([])
  const [filteredSales, setFilteredSales] = useState([])
  const [selectedSale, setSelectedSale] = useState<any>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [filterPeriod, setFilterPeriod] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchSales()
  }, [])

  useEffect(() => {
    filterSales()
  }, [sales, filterPeriod, searchTerm])

  async function fetchSales() {
    const response = await fetch("/api/sales")
    const data = await response.json()
    setSales(data)
  }

  function filterSales() {
    let filtered = [...sales]

    // Filter by period
    if (filterPeriod !== "all") {
      const now = new Date()
      const startDate = new Date()

      if (filterPeriod === "today") {
        startDate.setHours(0, 0, 0, 0)
      } else if (filterPeriod === "week") {
        startDate.setDate(now.getDate() - 7)
      } else if (filterPeriod === "month") {
        startDate.setMonth(now.getMonth() - 1)
      }

      filtered = filtered.filter(
        (sale: any) => new Date(sale.createdAt) >= startDate
      )
    }

    // Search
    if (searchTerm) {
      filtered = filtered.filter((sale: any) =>
        sale.saleNumber.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredSales(filtered)
  }

  function viewDetails(sale: any) {
    setSelectedSale(sale)
    setDetailsOpen(true)
  }

  const totalRevenue = filteredSales.reduce(
    (sum: number, sale: any) => sum + sale.total,
    0
  )

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales History</h1>
          <p className="text-muted-foreground">
            View and manage all sales transactions
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredSales.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {totalRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Average Sale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES{" "}
              {filteredSales.length > 0
                ? (totalRevenue / filteredSales.length).toFixed(0)
                : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by sale number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterPeriod} onValueChange={setFilterPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sales List */}
      <div className="space-y-3">
        {filteredSales.length === 0 ? (
          <Card className="p-12">
            <div className="text-center text-muted-foreground">
              No sales found
            </div>
          </Card>
        ) : (
          filteredSales.map((sale: any) => (
            <Card key={sale.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">
                        {sale.saleNumber}
                      </h3>
                      <Badge
                        variant={
                          sale.paymentStatus === "COMPLETED"
                            ? "default"
                            : sale.paymentStatus === "PENDING"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {sale.paymentStatus}
                      </Badge>
                      <Badge variant="outline">{sale.paymentMethod}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(sale.createdAt), "PPpp")} • Sold by{" "}
                      {sale.soldBy.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {sale.items.length} item(s)
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        KES {sale.total.toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewDetails(sale)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Sale Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
          </DialogHeader>

          {selectedSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Sale Number</p>
                  <p className="font-semibold">{selectedSale.saleNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-semibold">
                    {format(new Date(selectedSale.createdAt), "PPpp")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Method</p>
                  <p className="font-semibold">{selectedSale.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge
                    variant={
                      selectedSale.paymentStatus === "COMPLETED"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedSale.paymentStatus}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Sold By</p>
                  <p className="font-semibold">{selectedSale.soldBy.name}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Items</h4>
                <div className="space-y-2">
                  {selectedSale.items.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-sm p-2 bg-muted rounded"
                    >
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-muted-foreground">
                          {item.quantity} × KES {item.unitPrice.toLocaleString()}
                        </p>
                      </div>
                      <p className="font-semibold">
                        KES {item.subtotal.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>KES {selectedSale.total.toLocaleString()}</span>
                </div>
              </div>

              <Button
  className="w-full"
  onClick={() => {
    downloadReceipt({
      saleNumber: selectedSale.saleNumber,
      date: format(new Date(selectedSale.createdAt), "PPpp"),
      items: selectedSale.items.map((item: any) => ({
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      })),
      subtotal: selectedSale.total,
      discount: 0,
      total: selectedSale.total,
      paymentMethod: selectedSale.paymentMethod,
      paymentStatus: selectedSale.paymentStatus,
      mpesaCode: selectedSale.mpesaCode,
      soldBy: selectedSale.soldBy.name,
    })
    toast.success("Receipt downloaded!")
  }}
>
  <Download className="mr-2 h-4 w-4" />
  Download Receipt
</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}