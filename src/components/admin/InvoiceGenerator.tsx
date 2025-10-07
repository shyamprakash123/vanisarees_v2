import { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface InvoiceGeneratorProps {
  orderId: string;
  orderNumber: string;
  onGenerated?: () => void;
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  orderNumber: string;
  items: Array<{
    title: string;
    quantity: number;
    price: number;
    hsn?: string;
    taxRate: number;
  }>;
  subtotal: number;
  taxes: number;
  total: number;
  billingAddress: any;
  shippingAddress: any;
  gstin?: string;
}

export function InvoiceGenerator({ orderId, orderNumber, onGenerated }: InvoiceGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const generateInvoice = async () => {
    setIsGenerating(true);
    setError('');

    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*, items, user:users(name, email, gstin)')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        throw new Error('Order not found');
      }

      const invoiceNumber = `INV-${Date.now()}-${orderNumber}`;

      const invoiceData: InvoiceData = {
        invoiceNumber,
        date: new Date().toISOString(),
        orderNumber,
        items: order.items || [],
        subtotal: order.subtotal || 0,
        taxes: order.taxes || 0,
        total: order.total || 0,
        billingAddress: order.shipping_address,
        shippingAddress: order.shipping_address,
        gstin: order.user?.gstin
      };

      const gstBreakdown = calculateGSTBreakdown(invoiceData.items, invoiceData.taxes);

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          order_id: orderId,
          invoice_number: invoiceNumber,
          gst_breakdown: gstBreakdown,
          pdf_storage_key: null
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      await supabase
        .from('orders')
        .update({
          invoiced: true,
          invoice_id: invoice.id
        })
        .eq('id', orderId);

      if (onGenerated) {
        onGenerated();
      }

      alert(`Invoice ${invoiceNumber} generated successfully`);
    } catch (err: any) {
      console.error('Invoice generation error:', err);
      setError(err.message || 'Failed to generate invoice');
    } finally {
      setIsGenerating(false);
    }
  };

  const calculateGSTBreakdown = (items: any[], totalTax: number) => {
    const breakdown: any = {
      cgst: 0,
      sgst: 0,
      igst: 0,
      items: []
    };

    items.forEach(item => {
      const itemTax = (item.price * item.quantity * (item.taxRate || 18)) / 100;
      breakdown.items.push({
        title: item.title,
        taxableValue: item.price * item.quantity,
        taxRate: item.taxRate || 18,
        cgst: itemTax / 2,
        sgst: itemTax / 2
      });
    });

    breakdown.cgst = totalTax / 2;
    breakdown.sgst = totalTax / 2;

    return breakdown;
  };

  const downloadInvoice = async () => {
    try {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const htmlContent = generateInvoiceHTML(invoice);

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoice_number}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Download error:', err);
      setError('Failed to download invoice');
    }
  };

  const generateInvoiceHTML = (invoice: any) => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoice_number}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    .invoice-details { margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .total { font-weight: bold; text-align: right; }
  </style>
</head>
<body>
  <div class="header">
    <h1>TAX INVOICE</h1>
    <h2>VaniSarees</h2>
    <p>vanisarees.in</p>
  </div>
  <div class="invoice-details">
    <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
    <p><strong>Date:</strong> ${new Date(invoice.created_at).toLocaleDateString()}</p>
    <p><strong>Order Number:</strong> ${orderNumber}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>HSN</th>
        <th>Qty</th>
        <th>Rate</th>
        <th>Tax</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.gst_breakdown?.items?.map((item: any) => `
        <tr>
          <td>${item.title}</td>
          <td>${item.hsn || 'N/A'}</td>
          <td>${item.quantity || 1}</td>
          <td>₹${item.taxableValue?.toFixed(2)}</td>
          <td>${item.taxRate}%</td>
          <td>₹${((item.taxableValue || 0) * (1 + (item.taxRate || 0) / 100)).toFixed(2)}</td>
        </tr>
      `).join('') || '<tr><td colspan="6">No items</td></tr>'}
    </tbody>
  </table>
  <div class="total">
    <p>CGST: ₹${(invoice.gst_breakdown?.cgst || 0).toFixed(2)}</p>
    <p>SGST: ₹${(invoice.gst_breakdown?.sgst || 0).toFixed(2)}</p>
    <p><strong>Total: ₹${((invoice.gst_breakdown?.cgst || 0) + (invoice.gst_breakdown?.sgst || 0) + (invoice.gst_breakdown?.items?.reduce((sum: number, item: any) => sum + (item.taxableValue || 0), 0) || 0)).toFixed(2)}</strong></p>
  </div>
</body>
</html>
    `;
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={generateInvoice}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FileText className="h-4 w-4" />
          {isGenerating ? 'Generating...' : 'Generate Invoice'}
        </button>

        <button
          onClick={downloadInvoice}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          Download Invoice
        </button>
      </div>
    </div>
  );
}
