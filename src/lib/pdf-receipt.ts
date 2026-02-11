import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export interface ReceiptData {
  saleNumber: string
  date: string
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
    subtotal: number
  }>
  subtotal: number
  discount: number
  total: number
  paymentMethod: string
  paymentStatus: string
  mpesaCode?: string
  soldBy: string
}

export interface StoreSettings {
  storeName: string
  storePhone?: string
  storeAddress?: string
  receiptFooter?: string
}

export function generateReceipt(
  data: ReceiptData,
  storeSettings?: StoreSettings
): jsPDF {
  const doc = new jsPDF()

  const storeName = storeSettings?.storeName || "StockFlow"
  const storePhone = storeSettings?.storePhone || "+254 700 000 000"
  const storeAddress = storeSettings?.storeAddress || "Nairobi, Kenya"
  const footerText =
    storeSettings?.receiptFooter || "Thank you for your business!"

  // Header
  doc.setFontSize(24)
  doc.setFont("helvetica", "bold")
  doc.text(storeName.toUpperCase(), 105, 20, { align: "center" })

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text("Inventory Management System", 105, 27, { align: "center" })
  doc.text(storeAddress, 105, 32, { align: "center" })
  doc.text(`Tel: ${storePhone}`, 105, 37, { align: "center" })

  // Line separator
  doc.setLineWidth(0.5)
  doc.line(20, 42, 190, 42)

  // Receipt details
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("SALES RECEIPT", 105, 50, { align: "center" })

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Receipt No: ${data.saleNumber}`, 20, 60)
  doc.text(`Date: ${data.date}`, 20, 66)
  doc.text(`Cashier: ${data.soldBy}`, 20, 72)
  doc.text(`Payment: ${data.paymentMethod}`, 20, 78)

  let currentY = 78

  if (data.mpesaCode) {
    currentY += 6
    doc.text(`M-Pesa Code: ${data.mpesaCode}`, 20, currentY)
  }

  // Items table
  const tableData = data.items.map((item) => [
    item.name,
    item.quantity.toString(),
    `KES ${item.unitPrice.toLocaleString()}`,
    `KES ${item.subtotal.toLocaleString()}`,
  ])

  autoTable(doc, {
    startY: currentY + 6,
    head: [["Item", "Qty", "Price", "Total"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [79, 70, 229], // Indigo
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 10,
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: "center" },
      2: { cellWidth: 40, halign: "right" },
      3: { cellWidth: 40, halign: "right" },
    },
  })

  // Get final Y position after table
  const finalY = (doc as any).lastAutoTable.finalY || 150

  // Totals
  doc.setFont("helvetica", "normal")
  doc.text("Subtotal:", 130, finalY + 10)
  doc.text(`KES ${data.subtotal.toLocaleString()}`, 170, finalY + 10, {
    align: "right",
  })

  if (data.discount > 0) {
    doc.text("Discount:", 130, finalY + 16)
    doc.text(`-KES ${data.discount.toLocaleString()}`, 170, finalY + 16, {
      align: "right",
    })
  }

  // Line separator
  doc.setLineWidth(0.5)
  doc.line(130, finalY + 20, 190, finalY + 20)

  // Total
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("TOTAL:", 130, finalY + 28)
  doc.text(`KES ${data.total.toLocaleString()}`, 170, finalY + 28, {
    align: "right",
  })

  // Footer
  const footerY = finalY + 40
  doc.setFontSize(9)
  doc.setFont("helvetica", "italic")
  doc.text(footerText, 105, footerY, { align: "center" })
  doc.text("Goods once sold are not returnable", 105, footerY + 5, {
    align: "center",
  })

  // Status badge
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  const statusColor =
    data.paymentStatus === "COMPLETED" ? [34, 197, 94] : [251, 191, 36]
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2])
  doc.text(`Status: ${data.paymentStatus}`, 105, footerY + 12, {
    align: "center",
  })

  return doc
}

export function downloadReceipt(data: ReceiptData, storeSettings?: StoreSettings) {
  const doc = generateReceipt(data, storeSettings)
  doc.save(`receipt-${data.saleNumber}.pdf`)
}

export function printReceipt(data: ReceiptData, storeSettings?: StoreSettings) {
  const doc = generateReceipt(data, storeSettings)
  doc.autoPrint()
  window.open(doc.output("bloburl"), "_blank")
}