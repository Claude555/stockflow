"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Package, Edit, Trash2 } from "lucide-react"

export default function InventoryPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [search])

  async function fetchProducts() {
    const response = await fetch(`/api/products?search=${search}`)
    const data = await response.json()
    setProducts(data)
  }

  async function fetchCategories() {
    const response = await fetch("/api/categories")
    const data = await response.json()
    setCategories(data)
  }

  async function handleAddProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const productData = {
      name: formData.get("name") as string,
      sku: formData.get("sku") as string,
      categoryId: formData.get("categoryId") as string,
      costPrice: parseFloat(formData.get("costPrice") as string),
      sellingPrice: parseFloat(formData.get("sellingPrice") as string),
      stockQuantity: parseInt(formData.get("stockQuantity") as string),
      minStockLevel: parseInt(formData.get("minStockLevel") as string),
      unit: formData.get("unit") as string,
    }

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      })

      if (response.ok) {
        setIsAddDialogOpen(false)
        fetchProducts()
        toast.success("Product added successfully!")
        ;(e.target as HTMLFormElement).reset()
      } else {
        toast.error("Failed to add product")
      }
    } catch (error) {
      console.error("Failed to add product:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleEditProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const productData = {
      name: formData.get("name") as string,
      sku: formData.get("sku") as string,
      categoryId: formData.get("categoryId") as string,
      costPrice: parseFloat(formData.get("costPrice") as string),
      sellingPrice: parseFloat(formData.get("sellingPrice") as string),
      stockQuantity: parseInt(formData.get("stockQuantity") as string),
      minStockLevel: parseInt(formData.get("minStockLevel") as string),
      unit: formData.get("unit") as string,
    }

    try {
      const response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      })

      if (response.ok) {
        setIsEditDialogOpen(false)
        setSelectedProduct(null)
        fetchProducts()
        toast.success("Product updated successfully!")
      } else {
        toast.error("Failed to update product")
      }
    } catch (error) {
      console.error("Failed to update product:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteProduct() {
    if (!deleteProductId) return

    try {
      const response = await fetch(`/api/products/${deleteProductId}`, {
        method: "DELETE",
      })

      if (response.ok) {
          setDeleteProductId(null)
          fetchProducts()
          toast.success("Product deleted successfully!")
        } else {
          toast.error("Failed to delete product")
        }
    } catch (error) {
      console.error("Failed to delete product:", error)
    }
  }

  function openEditDialog(product: any) {
    setSelectedProduct(product)
    setIsEditDialogOpen(true)
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Inventory</h1>
      <p className="text-sm sm:text-base text-muted-foreground">Manage your products and stock</p>
    </div>

    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <ProductForm
              categories={categories}
              onSubmit={handleAddProduct}
              loading={loading}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

  {products.length === 0 ? (
    <Card className="p-8 sm:p-12">
      <div className="text-center">
        <Package className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
        <h3 className="mt-4 text-base sm:text-lg font-semibold">No products found</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Add your first product to get started
        </p>
      </div>
    </Card>
  ) : (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product: any) => (
            <Card key={product.id} className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      SKU: {product.sku}
                    </p>
                  </div>
                  <Badge
                    variant={
                      product.stockQuantity === 0
                        ? "destructive"
                        : product.stockQuantity <= product.minStockLevel
                        ? "secondary"
                        : "default"
                    }
                  >
                    {product.stockQuantity} {product.unit}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-medium">{product.category.name}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-bold">
                    KES {product.sellingPrice.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Profit:</span>
                  <span className="font-medium text-green-600">
                    {product.profitMargin.toFixed(1)}%
                  </span>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(product)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 hover:text-red-700"
                    onClick={() => setDeleteProductId(product.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <ProductForm
              categories={categories}
              onSubmit={handleEditProduct}
              loading={loading}
              defaultValues={selectedProduct}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteProductId}
        onOpenChange={() => setDeleteProductId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this product. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ProductForm({
  categories,
  onSubmit,
  loading,
  defaultValues,
}: {
  categories: any[]
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  loading: boolean
  defaultValues?: any
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={defaultValues?.name}
            required
          />
        </div>
        <div>
          <Label htmlFor="sku">SKU *</Label>
          <Input id="sku" name="sku" defaultValue={defaultValues?.sku} required />
        </div>
      </div>

      <div>
        <Label htmlFor="categoryId">Category *</Label>
        <Select
          name="categoryId"
          defaultValue={defaultValues?.categoryId}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat: any) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="costPrice">Cost Price (KES) *</Label>
          <Input
            id="costPrice"
            name="costPrice"
            type="number"
            step="0.01"
            defaultValue={defaultValues?.costPrice}
            required
          />
        </div>
        <div>
          <Label htmlFor="sellingPrice">Selling Price (KES) *</Label>
          <Input
            id="sellingPrice"
            name="sellingPrice"
            type="number"
            step="0.01"
            defaultValue={defaultValues?.sellingPrice}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="stockQuantity">Stock Quantity *</Label>
          <Input
            id="stockQuantity"
            name="stockQuantity"
            type="number"
            defaultValue={defaultValues?.stockQuantity || 0}
            required
          />
        </div>
        <div>
          <Label htmlFor="minStockLevel">Min Stock *</Label>
          <Input
            id="minStockLevel"
            name="minStockLevel"
            type="number"
            defaultValue={defaultValues?.minStockLevel || 10}
            required
          />
        </div>
        <div>
          <Label htmlFor="unit">Unit</Label>
          <Input
            id="unit"
            name="unit"
            defaultValue={defaultValues?.unit || "pcs"}
            required
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Saving..." : defaultValues ? "Update" : "Add Product"}
        </Button>
      </div>
    </form>
  )
}