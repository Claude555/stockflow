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
    try {
      const response = await fetch(`/api/products?search=${search}`)
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error("Failed to fetch products:", error)
      toast.error("Failed to load products")
    }
  }

  async function handleCheckout() {
    if (items.length === 0) {
      toast.error("Checkout is empty")
      return
    }

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
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleData),
      })

      const sale = await response.json()

      if (response.ok) {
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
    <>
      {/* Mobile: Stack layout with fixed cart at bottom */}
      <div className="lg:hidden flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
        {/* Products Section - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 pb-[45vh]">
          <div className="mb-4">
            <h1 className="text-2xl font-bold tracking-tight mb-1">
              Point of Sale
            </h1>
            <p className="text-sm text-muted-foreground">
              Select products to add to checkout
            </p>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {products.map((product: any) => (
              <Card
                key={product.id}
                className={`p-3 cursor-pointer transition-all hover:shadow-lg ${
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
                    toast.success("Added to checkout")
                  } else {
                    toast.error("Out of stock")
                  }
                }}
              >
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm line-clamp-2 leading-tight">
                    {product.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {product.sku}
                  </p>
                  <div className="flex justify-between items-end">
                    <span className="text-base font-bold text-indigo-600">
                      KES {product.sellingPrice.toLocaleString()}
                    </span>
                    <Badge
                      variant={
                        product.stockQuantity === 0
                          ? "destructive"
                          : product.stockQuantity <= product.minStockLevel
                          ? "secondary"
                          : "outline"
                      }
                      className="text-xs"
                    >
                      {product.stockQuantity}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart Section - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
          <div className="p-4 max-h-[45vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Checkout ({items.length})
              </h2>
              {items.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    clearCart()
                    toast.info("Checkout cleared")
                  }}
                >
                  Clear
                </Button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="text-center py-4">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Checkout is empty</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-3 max-h-[20vh] overflow-y-auto">
                  {items.map((item) => (
                    <Card key={item.productId} className="p-2">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-1">
                            {item.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            KES {item.price.toLocaleString()} each
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            removeItem(item.productId)
                            toast.info("Item removed")
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-10 text-center font-semibold text-sm">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="font-bold text-sm">
                          KES {(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>KES {total.toLocaleString()}</span>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => setPaymentDialog(true)}
                  >
                    Proceed to Payment
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Desktop: Side-by-side layout */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6 p-6 h-[calc(100vh)]">
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
                className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
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
                    toast.success(`${product.name} added to cart`)
                  } else {
                    toast.error("Out of stock")
                  }
                }}
              >
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm line-clamp-2 leading-tight">
                    {product.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {product.sku}
                  </p>
                  <div className="flex flex-col space-y-2">
                    <span className="text-lg font-bold text-indigo-600">
                      KES {product.sellingPrice.toLocaleString()}
                    </span>
                    <Badge
                      variant={
                        product.stockQuantity === 0
                          ? "destructive"
                          : product.stockQuantity <= product.minStockLevel
                          ? "secondary"
                          : "outline"
                      }
                      className="text-xs w-fit"
                    >
                      {product.stockQuantity} {product.unit || 'pcs'}
                    </Badge>
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
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  clearCart()
                  toast.info("Cart cleared")
                }}
              >
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
                      onClick={() => {
                        removeItem(item.productId)
                        toast.info(`${item.name} removed from cart`)
                      }}
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
                <div className="flex justify-between text-2xl font-bold">
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
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Total Amount</Label>
              <div className="text-2xl sm:text-3xl font-bold mt-1">
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
        <DialogContent className="max-w-[95vw] sm:max-w-md">
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
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-bold">
                      KES {lastSale.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payment:</span>
                    <span className="font-medium">
                      {lastSale.paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
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
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
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
                    Receipt
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
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}