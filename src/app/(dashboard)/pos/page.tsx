"use client"

import { useState, useEffect } from "react"
import { useCartStore } from "@/stores/cart-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { downloadReceipt } from "@/lib/pdf-receipt"
import { useStore } from "@/contexts/store-context"
import { format } from "date-fns"
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  DollarSign,
  Download,
  Smartphone,
  CheckCircle,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function POSPage() {
  const [products, setProducts] = useState([])
  const storeSettings = useStore()
  const [search, setSearch] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
const [mpesaProcessing, setMpesaProcessing] = useState(false)
  const [paymentDialog, setPaymentDialog] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH")
  const [processing, setProcessing] = useState(false)
  const [successDialog, setSuccessDialog] = useState(false)
  const [lastSale, setLastSale] = useState<any>(null)

  const { items, addItem, removeItem, updateQuantity, clearCart, getTotal } =
    useCartStore()

  useEffect(() => {
    fetchProducts()
  }, [search])

  async function fetchProducts() {
    const response = await fetch(`/api/products?search=${search}`)
    const data = await response.json()
    setProducts(data)
  }

  async function handleCheckout() {
  if (items.length === 0) {
    toast.error("Cart is empty")
    return
  }

  // Validate phone for M-Pesa
  if (paymentMethod === "MPESA" && !customerPhone) {
    toast.error("Please enter M-Pesa phone number")
    return
  }

  setProcessing(true)

  const saleData = {
    items: items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.price,
    })),
    paymentMethod,
    discount: 0,
  }

  try {
    // Create sale first
    const response = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(saleData),
    })

    const sale = await response.json()

    if (response.ok) {
      // If M-Pesa, initiate payment
      if (paymentMethod === "MPESA") {
        setMpesaProcessing(true)
        
        const mpesaResponse = await fetch("/api/mpesa/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            saleId: sale.id,
            phoneNumber: customerPhone,
          }),
        })

        const mpesaData = await mpesaResponse.json()

        if (mpesaResponse.ok) {
          toast.success("Payment request sent! Check your phone.")
          setLastSale(sale)
          clearCart()
          setPaymentDialog(false)
          setSuccessDialog(true)
          setCustomerPhone("")
        } else {
          toast.error(mpesaData.error || "Failed to initiate M-Pesa payment")
        }
        
        setMpesaProcessing(false)
      } else {
        // Cash or Bank transfer
        setLastSale(sale)
        clearCart()
        setPaymentDialog(false)
        setSuccessDialog(true)
        toast.success("Sale completed successfully!")
      }
      
      fetchProducts()
    } else {
      toast.error(sale.error || "Failed to complete sale")
    }
  } catch (error) {
    console.error("Sale error:", error)
    toast.error("An error occurred. Please try again.")
  } finally {
    setProcessing(false)
    setMpesaProcessing(false)
  }
}

  const total = getTotal()

  return (
    <div className="grid grid-cols-3 gap-6 p-6 h-[calc(100vh-4rem)]">
      {/* Products Section */}
      <div className="col-span-2 space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Point of Sale
          </h1>
          <p className="text-muted-foreground">
            Select products to add to cart
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products by name, SKU, or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-3 gap-4 overflow-y-auto h-[calc(100vh-16rem)]">
  {products.map((product: any) => (
    <Card
      key={product.id}
      className={`relative group cursor-pointer transition-all hover:shadow-lg overflow-hidden aspect-square ${
        product.stockQuantity === 0
          ? "opacity-50 cursor-not-allowed"
          : "hover:border-indigo-600"
      }`}
      onClick={() => {
        if (product.stockQuantity > 0) {
          addItem({
            productId: product.id,
            name: product.name,
            price: product.sellingPrice,
            stock: product.stockQuantity,
            sku: product.sku,
          })
        }
      }}
    >
      {/* Container to handle padding and flex layout within the square */}
      <div className="p-4 flex flex-col h-full w-full justify-between">
        
        {/* Top: Header Info */}
        <div className="space-y-1">
          <h3 className="font-semibold text-sm line-clamp-2 leading-tight">
            {product.name}
          </h3>
          <p className="text-[10px] text-muted-foreground uppercase">
            {product.sku}
          </p>
        </div>

        {/* Bottom: Pricing and Stock */}
        <div className="space-y-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground">Price</span>
            <span className="text-base font-bold text-indigo-600">
              KES {product.sellingPrice.toLocaleString()}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <Badge
              variant={
                product.stockQuantity === 0
                  ? "destructive"
                  : product.stockQuantity <= product.minStockLevel
                  ? "secondary"
                  : "outline"
              }
              className="text-[10px] px-2 py-0"
            >
              {product.stockQuantity} {product.unit || 'pcs'}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  ))}
</div>
      </div>

      {/* Cart Section */}
      <div className="bg-white border rounded-lg p-6 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Cart ({items.length})
          </h2>
          {items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCart}>
              Clear
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Cart is empty
                <br />
                <span className="text-sm">Click products to add</span>
              </p>
            </div>
          ) : (
            items.map((item) => (
              <Card key={item.productId} className="p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium line-clamp-1">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      KES {item.price.toLocaleString()} each
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.productId)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity - 1)
                      }
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-12 text-center font-semibold">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity + 1)
                      }
                      disabled={item.quantity >= item.stock}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="font-bold">
                    KES {(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="mt-6 space-y-4 border-t pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>KES {total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax:</span>
                <span>KES 0</span>
              </div>
              <div className="flex justify-between text-2xl font-bold border-t pt-2">
                <span>Total:</span>
                <span>KES {total.toLocaleString()}</span>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => setPaymentDialog(true)}
            >
              Proceed to Payment
            </Button>
          </div>
        )}
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Total Amount</Label>
              <div className="text-3xl font-bold mt-1">
                KES {total.toLocaleString()}
              </div>
            </div>

            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Cash
                    </div>
                  </SelectItem>
                  <SelectItem value="MPESA">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      M-Pesa
                    </div>
                  </SelectItem>
                  <SelectItem value="BANK_TRANSFER">
                    Bank Transfer
                  </SelectItem>
                  <SelectItem value="CREDIT">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === "MPESA" && (
            <div>
                <Label htmlFor="phone">M-Pesa Phone Number</Label>
                <Input
                id="phone"
                type="tel"
                placeholder="0712345678"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
                />
                <p className="text-sm text-muted-foreground mt-1">
                Customer will receive STK push on this number
                </p>
            </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setPaymentDialog(false)}
                className="flex-1"
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCheckout}
                disabled={processing}
                className="flex-1"
              >
                {processing ? "Processing..." : "Complete Sale"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successDialog} onOpenChange={setSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Sale Completed!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {lastSale && (
              <>
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">Sale Number</p>
                  <p className="text-2xl font-bold">{lastSale.saleNumber}</p>
                </div>

                <div className="space-y-2 border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-bold">
                      KES {lastSale.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment:</span>
                    <span className="font-medium">
                      {lastSale.paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge
                      variant={
                        lastSale.paymentStatus === "COMPLETED"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {lastSale.paymentStatus}
                    </Badge>
                  </div>
                  <div className="flex gap-3">
        <Button
        variant="outline"
        className="flex-1"
        onClick={() => {
            if (lastSale) {
            downloadReceipt(
                {
                saleNumber: lastSale.saleNumber,
                date: format(new Date(lastSale.createdAt), "PPpp"),
                items: lastSale.items.map((item: any) => ({
                    name: item.product.name,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    subtotal: item.subtotal,
                })),
                subtotal: lastSale.total,
                discount: 0,
                total: lastSale.total,
                paymentMethod: lastSale.paymentMethod,
                paymentStatus: lastSale.paymentStatus,
                mpesaCode: lastSale.mpesaCode,
                soldBy: lastSale.soldBy.name,
                },
                {
                storeName: storeSettings.storeName,
                storePhone: storeSettings.storePhone,
                storeAddress: storeSettings.storeAddress,
                receiptFooter: storeSettings.receiptFooter,
                }
            )
            toast.success("Receipt downloaded!")
            }
        }}
        >
        <Download className="mr-2 h-4 w-4" />
        Download Receipt
        </Button>
  <Button
    className="flex-1"
    onClick={() => {
      setSuccessDialog(false)
      setLastSale(null)
    }}
  >
    New Sale
  </Button>
</div>
                </div>
              </>
            )}

            <Button
              className="w-full"
              onClick={() => {
                setSuccessDialog(false)
                setLastSale(null)
              }}
            >
              New Sale
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}