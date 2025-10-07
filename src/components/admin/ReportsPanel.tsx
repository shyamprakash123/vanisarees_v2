import { useState } from 'react';
import { Download, FileText, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type ReportType = 'sales' | 'gst' | 'wallet' | 'sellers';
type ExportFormat = 'csv' | 'pdf';

interface ReportsPanelProps {
  onReportGenerated?: (report: any) => void;
}

export function ReportsPanel({ onReportGenerated }: ReportsPanelProps) {
  const [selectedReport, setSelectedReport] = useState<ReportType>('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const reportTypes = [
    { id: 'sales' as ReportType, label: 'Sales Report', description: 'Orders and revenue by period' },
    { id: 'gst' as ReportType, label: 'GST Report', description: 'Tax breakdown by slab' },
    { id: 'wallet' as ReportType, label: 'Wallet Ledger', description: 'Wallet transactions' },
    { id: 'sellers' as ReportType, label: 'Seller Payouts', description: 'Pending seller payments' }
  ];

  const generateReport = async (format: ExportFormat) => {
    if (!startDate || !endDate) {
      setError('Please select start and end dates');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      let reportData: any;

      switch (selectedReport) {
        case 'sales':
          reportData = await generateSalesReport();
          break;
        case 'gst':
          reportData = await generateGSTReport();
          break;
        case 'wallet':
          reportData = await generateWalletReport();
          break;
        case 'sellers':
          reportData = await generateSellerPayoutReport();
          break;
      }

      if (format === 'csv') {
        downloadCSV(reportData);
      } else {
        downloadPDF(reportData);
      }

      if (onReportGenerated) {
        onReportGenerated(reportData);
      }
    } catch (err: any) {
      console.error('Report generation error:', err);
      setError(err.message || 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSalesReport = async () => {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, user:users(name, email)')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .neq('status', 'draft');

    if (error) throw error;

    return {
      type: 'sales',
      period: { start: startDate, end: endDate },
      orders: orders || [],
      summary: {
        totalOrders: orders?.length || 0,
        totalRevenue: orders?.reduce((sum, o) => sum + o.total, 0) || 0,
        averageOrderValue: orders?.length ? (orders.reduce((sum, o) => sum + o.total, 0) / orders.length) : 0
      }
    };
  };

  const generateGSTReport = async () => {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('taxes, items, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .neq('status', 'draft');

    if (error) throw error;

    const gstBreakdown: any = {
      '5%': { taxable: 0, cgst: 0, sgst: 0, total: 0 },
      '12%': { taxable: 0, cgst: 0, sgst: 0, total: 0 },
      '18%': { taxable: 0, cgst: 0, sgst: 0, total: 0 },
      '28%': { taxable: 0, cgst: 0, sgst: 0, total: 0 }
    };

    orders?.forEach(order => {
      const taxRate = 18;
      const slab = `${taxRate}%`;
      if (gstBreakdown[slab]) {
        const taxableAmount = (order.taxes / taxRate) * 100;
        gstBreakdown[slab].taxable += taxableAmount;
        gstBreakdown[slab].cgst += order.taxes / 2;
        gstBreakdown[slab].sgst += order.taxes / 2;
        gstBreakdown[slab].total += order.taxes;
      }
    });

    return {
      type: 'gst',
      period: { start: startDate, end: endDate },
      breakdown: gstBreakdown,
      totalTax: orders?.reduce((sum, o) => sum + (o.taxes || 0), 0) || 0
    };
  };

  const generateWalletReport = async () => {
    const { data: transactions, error } = await supabase
      .from('wallet_transactions')
      .select('*, user:users(name, email)')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      type: 'wallet',
      period: { start: startDate, end: endDate },
      transactions: transactions || [],
      summary: {
        totalCredits: transactions?.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0) || 0,
        totalDebits: transactions?.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0) || 0
      }
    };
  };

  const generateSellerPayoutReport = async () => {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, seller:sellers(id, shop_name), user:users(name)')
      .not('seller_id', 'is', null)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .eq('status', 'delivered');

    if (error) throw error;

    const sellerPayouts: any = {};

    orders?.forEach(order => {
      const sellerId = order.seller_id;
      if (!sellerPayouts[sellerId]) {
        sellerPayouts[sellerId] = {
          seller: order.seller,
          totalOrders: 0,
          totalAmount: 0,
          commission: 0
        };
      }
      sellerPayouts[sellerId].totalOrders++;
      sellerPayouts[sellerId].totalAmount += order.total;
      sellerPayouts[sellerId].commission += order.total * 0.1;
    });

    return {
      type: 'sellers',
      period: { start: startDate, end: endDate },
      payouts: Object.values(sellerPayouts)
    };
  };

  const downloadCSV = (reportData: any) => {
    let csvContent = '';

    if (reportData.type === 'sales') {
      csvContent = 'Order Number,Date,Customer,Amount,Status\n';
      reportData.orders.forEach((order: any) => {
        csvContent += `${order.order_number},${order.created_at},${order.user?.name || 'N/A'},${order.total},${order.status}\n`;
      });
    } else if (reportData.type === 'gst') {
      csvContent = 'Tax Slab,Taxable Amount,CGST,SGST,Total Tax\n';
      Object.entries(reportData.breakdown).forEach(([slab, data]: [string, any]) => {
        csvContent += `${slab},${data.taxable.toFixed(2)},${data.cgst.toFixed(2)},${data.sgst.toFixed(2)},${data.total.toFixed(2)}\n`;
      });
    } else if (reportData.type === 'wallet') {
      csvContent = 'Date,User,Type,Amount\n';
      reportData.transactions.forEach((txn: any) => {
        csvContent += `${txn.created_at},${txn.user?.name || 'N/A'},${txn.type},${txn.amount}\n`;
      });
    } else if (reportData.type === 'sellers') {
      csvContent = 'Seller,Orders,Total Amount,Commission,Payout\n';
      reportData.payouts.forEach((payout: any) => {
        csvContent += `${payout.seller?.shop_name || 'N/A'},${payout.totalOrders},${payout.totalAmount.toFixed(2)},${payout.commission.toFixed(2)},${(payout.totalAmount - payout.commission).toFixed(2)}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportData.type}_report_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = (reportData: any) => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${reportData.type.toUpperCase()} Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    h1 { text-align: center; color: #b91c1c; }
    .period { text-align: center; margin-bottom: 30px; color: #666; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #b91c1c; color: white; }
    .summary { background-color: #f9f9f9; padding: 20px; margin-top: 30px; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>${reportData.type.toUpperCase()} Report</h1>
  <div class="period">Period: ${startDate} to ${endDate}</div>
  ${generatePDFContent(reportData)}
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportData.type}_report_${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generatePDFContent = (reportData: any) => {
    if (reportData.type === 'sales') {
      return `
        <table>
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.orders.map((order: any) => `
              <tr>
                <td>${order.order_number}</td>
                <td>${new Date(order.created_at).toLocaleDateString()}</td>
                <td>${order.user?.name || 'N/A'}</td>
                <td>₹${order.total.toFixed(2)}</td>
                <td>${order.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="summary">
          <h3>Summary</h3>
          <p>Total Orders: ${reportData.summary.totalOrders}</p>
          <p>Total Revenue: ₹${reportData.summary.totalRevenue.toFixed(2)}</p>
          <p>Average Order Value: ₹${reportData.summary.averageOrderValue.toFixed(2)}</p>
        </div>
      `;
    }
    return '<p>Report content</p>';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Generate Reports</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Report Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reportTypes.map(report => (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  selectedReport === report.id
                    ? 'border-red-800 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{report.label}</div>
                <div className="text-sm text-gray-500 mt-1">{report.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => generateReport('csv')}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-3 bg-red-800 text-white rounded-lg hover:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-5 w-5" />
            {isGenerating ? 'Generating...' : 'Export as CSV'}
          </button>

          <button
            onClick={() => generateReport('pdf')}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FileText className="h-5 w-5" />
            {isGenerating ? 'Generating...' : 'Export as PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
