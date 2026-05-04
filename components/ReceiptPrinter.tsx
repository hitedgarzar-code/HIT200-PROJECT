import React from 'react'
import { Button } from '@/components/ui/button'
import { Printer, Download } from 'lucide-react'

interface ReceiptProps {
  receiptNumber: string
  orderId: string
  orderDate: string
  items: any[]
  subtotal: number
  shipping: number
  tax: number
  total: number
  customer: {
    name: string
    email: string
    phone: string
    address: string
    city: string
    zipCode: string
  }
  paymentMethod: string
  paymentReference?: string
}

export default function ReceiptPrinter({
  receiptNumber,
  orderId,
  orderDate,
  items,
  subtotal,
  shipping,
  tax,
  total,
  customer,
  paymentMethod,
  paymentReference,
}: ReceiptProps) {
  const handlePrint = () => {
    const printContent = document.getElementById('receipt-content')
    if (!printContent) return

    const printWindow = window.open('', '', 'width=800,height=600')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt ${receiptNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .receipt { max-width: 600px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .receipt-number { font-size: 14px; color: #666; }
          .order-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
          .section { margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .total-section { text-align: right; margin-top: 20px; }
          .total-row { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const handleDownloadPDF = async () => {
    const element = document.getElementById('receipt-content')
    if (!element) return

    // Simple PDF download using browser print-to-PDF
    const printWindow = window.open('', '', 'width=800,height=600')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt ${receiptNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .receipt { max-width: 600px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        </style>
      </head>
      <body>
        ${element.innerHTML}
        <script>window.print();</script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="space-y-6">
      {/* Receipt Display */}
      <div
        id="receipt-content"
        className="bg-white border-2 border-neutral-300 rounded-lg p-8 max-w-2xl mx-auto shadow-lg"
      >
        {/* Header */}
        <div className="text-center border-b-2 border-neutral-300 pb-6 mb-6">
          <h1 className="text-4xl font-bold text-primary mb-2">
            edg<span className="text-accent">AR</span>s
          </h1>
          <p className="text-muted-foreground">Fashion Store Receipt</p>
        </div>

        {/* Receipt Number and Date */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p className="text-muted-foreground font-semibold">Receipt Number</p>
            <p className="text-lg font-bold text-primary">{receiptNumber}</p>
          </div>
          <div>
            <p className="text-muted-foreground font-semibold">Date</p>
            <p className="text-lg">{new Date(orderDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground font-semibold">Order ID</p>
            <p className="text-sm font-mono">{orderId}</p>
          </div>
          <div>
            <p className="text-muted-foreground font-semibold">Payment Method</p>
            <p className="text-sm">{paymentMethod}</p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-neutral-50 p-4 rounded-lg mb-6">
          <h3 className="font-bold text-primary mb-3">Customer Information</h3>
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-semibold">Name:</span> {customer.name}
            </p>
            <p>
              <span className="font-semibold">Email:</span> {customer.email}
            </p>
            <p>
              <span className="font-semibold">Phone:</span> {customer.phone}
            </p>
            <p>
              <span className="font-semibold">Address:</span> {customer.address}, {customer.city} {customer.zipCode}
            </p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-6">
          <thead>
            <tr className="border-b-2 border-neutral-300">
              <th className="text-left py-3 font-bold text-primary">Item</th>
              <th className="text-center py-3 font-bold text-primary">Size</th>
              <th className="text-right py-3 font-bold text-primary">Qty</th>
              <th className="text-right py-3 font-bold text-primary">Price</th>
              <th className="text-right py-3 font-bold text-primary">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-neutral-200">
                <td className="py-3">{item.name}</td>
                <td className="text-center py-3">{item.size}</td>
                <td className="text-right py-3">{item.quantity}</td>
                <td className="text-right py-3">ZWL {item.price.toFixed(2)}</td>
                <td className="text-right py-3 font-semibold">
                  ZWL {(item.price * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="space-y-2 mb-6 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>ZWL {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping:</span>
            <span>{shipping === 0 ? 'FREE' : `ZWL ${shipping.toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax (10%):</span>
            <span>ZWL {tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-primary border-t-2 border-neutral-300 pt-3 mt-3">
            <span>Total Amount:</span>
            <span>ZWL {total.toFixed(2)}</span>
          </div>
        </div>

        {paymentReference && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6 text-sm">
            <p className="font-semibold text-green-700">Payment Reference</p>
            <p className="font-mono text-green-600">{paymentReference}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center border-t-2 border-neutral-300 pt-6 text-xs text-muted-foreground">
          <p>Thank you for your purchase!</p>
          <p>Visit us at edgars.com for more amazing fashion</p>
          <p className="mt-2">
            Receipt printed on {new Date().toLocaleString()}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center flex-wrap">
        <Button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white"
        >
          <Printer className="w-4 h-4" />
          Print Receipt
        </Button>
        <Button
          onClick={handleDownloadPDF}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Save as PDF
        </Button>
      </div>
    </div>
  )
}
