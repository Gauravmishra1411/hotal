export interface InvoiceItem {
  name: string;
  category: string;
  price: number;
}

export function generateInvoicePDF(bookingId: string, guestName: string, requests: any[]) {
  // Aggregate all items
  const items: InvoiceItem[] = [];
  let grandTotal = 0;

  requests.forEach((req) => {
    const services: string[] = req.services || [];
    const details = req.serviceDetails || {};
    
    services.forEach((svc) => {
      // Split sub-items (e.g. "In-Room Dining - Continental Breakfast")
      const isSubItem = svc.includes(" - ");
      const [category, name] = isSubItem ? svc.split(" - ") : ["Service", svc];
      
      const itemPrice = details[svc]?.price || req.totalPrice || 0;
      items.push({
        name: name || category,
        category: category,
        price: Number(itemPrice) || 0
      });
      grandTotal += Number(itemPrice) || 0;
    });
  });

  const invoiceNo = `INV-${bookingId.substring(0, 8).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    alert("Please allow popups to download/print the invoice.");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - ${invoiceNo}</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @media print {
          body {
            background-color: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body class="bg-gray-50 text-gray-800 font-sans min-h-screen flex flex-col justify-between">
      <div class="max-w-3xl mx-auto my-8 p-8 bg-white rounded-2xl shadow-lg border border-gray-100 flex-1 w-full">
        <!-- Print Header / Actions -->
        <div class="flex justify-between items-center pb-6 mb-8 border-b border-gray-100 no-print">
          <span class="text-sm font-semibold text-gray-400">Invoice Review</span>
          <button onclick="window.print()" class="bg-[#00381A] hover:bg-[#002a14] text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md flex items-center gap-2 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / Save to PDF
          </button>
        </div>

        <!-- Invoice Details -->
        <div class="flex justify-between items-start mb-12">
          <div>
            <h1 class="text-3xl font-extrabold text-[#00381A] tracking-tight">AURORA HAVEN</h1>
            <p class="text-xs text-gray-400 uppercase font-semibold mt-1 tracking-wider">Luxury Hotel & Spa</p>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold text-gray-800">INVOICE</div>
            <div class="text-sm font-mono text-gray-400 mt-1">${invoiceNo}</div>
          </div>
        </div>

        <!-- Info Grid -->
        <div class="grid grid-cols-2 gap-8 mb-12 pb-8 border-b border-gray-100">
          <div>
            <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Billed To</div>
            <div class="text-sm font-bold text-gray-800">${guestName}</div>
            <div class="text-xs text-gray-500 mt-1">Booking Ref: #${bookingId}</div>
          </div>
          <div class="text-right">
            <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Invoice Date</div>
            <div class="text-sm font-bold text-gray-800">${dateStr}</div>
          </div>
        </div>

        <!-- Table -->
        <table class="w-full text-left border-collapse mb-12">
          <thead>
            <tr class="border-b border-gray-200 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <th class="pb-3 font-semibold">Service Description</th>
              <th class="pb-3 font-semibold">Category</th>
              <th class="pb-3 text-right font-semibold">Price</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            ${items.map((item, _idx) => `
              <tr class="text-sm">
                <td class="py-4 font-bold text-gray-800">${item.name}</td>
                <td class="py-4 text-gray-500">${item.category}</td>
                <td class="py-4 text-right font-semibold text-gray-900">$${item.price.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Totals -->
        <div class="flex justify-end mb-16">
          <div class="w-64 space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-400 font-medium">Subtotal</span>
              <span class="text-gray-800 font-semibold">$${grandTotal.toFixed(2)}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-400 font-medium">Tax (0%)</span>
              <span class="text-gray-800 font-semibold">$0.00</span>
            </div>
            <div class="flex justify-between pt-3 border-t border-gray-200 text-lg font-bold text-gray-900">
              <span>Total Due</span>
              <span class="text-[#00381A]">$${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="text-center pt-8 border-t border-gray-100 text-xs text-gray-400">
          <p class="font-medium">Thank you for choosing Aurora Haven.</p>
          <p class="mt-1">For any queries regarding this statement, please contact Guest Services.</p>
        </div>
      </div>
    </body>
    </html>
  `);

  printWindow.document.close();
}
