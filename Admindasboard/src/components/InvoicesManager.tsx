import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2, Receipt, Download, Hash, User } from 'lucide-react';

export default function InvoicesManager() {
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'serviceRequests'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: any[] = [];
      snapshot.forEach((d) => data.push({ id: d.id, ...d.data() }));
      setAllRequests(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Group by Booking ID
  const groupedMap = allRequests.reduce((acc, curr) => {
    const key = curr.bookingId || 'Unknown';
    if (!acc[key]) {
      acc[key] = {
        bookingId: key,
        guestName: curr.guestName || 'Guest',
        createdAt: curr.createdAt,
        requests: [],
        totalBilled: 0
      };
    }
    acc[key].requests.push(curr);
    acc[key].totalBilled += Number(curr.totalPrice) || 0;
    
    // Fallback if totalPrice is not fully updated, calculate from serviceDetails
    if (!curr.totalPrice) {
       const details = curr.serviceDetails || {};
       let calculatedTotal = 0;
       Object.values(details).forEach((val: any) => {
         calculatedTotal += Number(val.price) || 0;
       });
       acc[key].totalBilled += calculatedTotal;
    }
    
    return acc;
  }, {} as Record<string, any>);

  const invoices = Object.values(groupedMap).sort((a: any, b: any) => {
    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return timeB - timeA;
  });

  const handleDownload = (invoice: any) => {
    // A simple approach for downloading invoice: Open a new window and print
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const printContent = `
      <html>
        <head>
          <title>Invoice - ${invoice.bookingId}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 40px; }
            .header h1 { margin: 0; color: #166534; font-size: 28px; }
            .details { margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #eee; }
            .details p { margin: 5px 0; font-size: 14px; }
            table { w-full; border-collapse: collapse; margin-bottom: 30px; width: 100%; }
            th, td { text-align: left; padding: 12px; border-bottom: 1px solid #eee; }
            th { font-weight: 600; color: #666; background: #f9fafb; }
            .total { text-align: right; font-size: 20px; font-weight: bold; color: #166534; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>AURORA HAVEN</h1>
            <p>Invoice / Receipt</p>
          </div>
          <div class="details">
            <p><strong>Guest Name:</strong> ${invoice.guestName}</p>
            <p><strong>Booking ID:</strong> ${invoice.bookingId}</p>
            <p><strong>Date Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Service Ordered</th>
                <th>Date</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.requests.map((req: any) => {
                const dateStr = req.createdAt?.toDate ? req.createdAt.toDate().toLocaleDateString() : 'N/A';
                const services = req.services || [];
                return services.map((svc: string) => {
                  const price = (req.serviceDetails && req.serviceDetails[svc] && req.serviceDetails[svc].price) 
                                 ? Number(req.serviceDetails[svc].price) : 0;
                  return `
                    <tr>
                      <td>${svc}</td>
                      <td>${dateStr}</td>
                      <td>$${price.toFixed(2)}</td>
                    </tr>
                  `;
                }).join('');
              }).join('')}
            </tbody>
          </table>
          <div class="total">
            Total Amount: $${invoice.totalBilled.toFixed(2)}
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-gray-50 h-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Invoices</h2>
          <p className="text-gray-500 mt-1 text-lg">Manage and download billing statements for services.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-10 w-10 animate-spin text-green-600" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Receipt className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-xl font-medium">No invoices available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                  <th className="px-6 py-4 font-semibold">Guest & Booking</th>
                  <th className="px-6 py-4 font-semibold">Total Services</th>
                  <th className="px-6 py-4 font-semibold">Total Amount</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((invoice: any) => {
                  const totalServices = invoice.requests.reduce((sum: number, req: any) => sum + (req.services?.length || 0), 0);
                  
                  return (
                    <tr key={invoice.bookingId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                            {(invoice.guestName || 'G').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-gray-400" />
                              {invoice.guestName}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                              <Hash className="w-3.5 h-3.5 text-gray-400" />
                              {invoice.bookingId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold">
                            {totalServices} {totalServices === 1 ? 'Service' : 'Services'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-lg font-bold text-green-700 bg-green-50 px-3 py-1 rounded-xl border border-green-100 shadow-sm">
                          ${invoice.totalBilled.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDownload(invoice)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-green-300 hover:bg-green-50 text-gray-700 hover:text-green-700 rounded-xl transition-all font-medium text-sm shadow-sm"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
