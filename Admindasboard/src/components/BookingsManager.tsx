import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, Trash2, Edit2, X, Calendar } from 'lucide-react';

export default function BookingsManager() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit modal state
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingsData: any[] = [];
      snapshot.forEach((doc) => {
        bookingsData.push({ id: doc.id, ...doc.data() });
      });
      setBookings(bookingsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching bookings:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenEdit = (booking: any) => {
    setSelectedBooking(booking);
    setNewStatus(booking.bookingStatus || 'Confirmed');
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    try {
      const bookingRef = doc(db, 'bookings', selectedBooking.id);
      await updateDoc(bookingRef, {
        bookingStatus: newStatus
      });
      setIsModalOpen(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error("Error updating booking status:", error);
      alert("Failed to update status");
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this booking record?")) {
      try {
        await deleteDoc(doc(db, 'bookings', id));
      } catch (error) {
        console.error("Error deleting booking:", error);
        alert("Failed to delete booking");
      }
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (booking.userName || '').toLowerCase().includes(searchLower) ||
      (booking.hotelName || '').toLowerCase().includes(searchLower) ||
      booking.id.toLowerCase().includes(searchLower) ||
      (booking.couponCode || '').toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-gray-50 h-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Booking Management</h2>
          <p className="text-gray-500 mt-1">Monitor, modify, or cancel customer hotel reservations.</p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex items-center justify-between">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search guest, hotel, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all"
          />
        </div>
        <div className="text-sm text-gray-500 font-medium">
          Total Bookings: {filteredBookings.length}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No bookings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 text-xs uppercase tracking-wider text-gray-400 border-b border-gray-150">
                  <th className="px-6 py-4 font-semibold">Booking Info</th>
                  <th className="px-6 py-4 font-semibold">Guest</th>
                  <th className="px-6 py-4 font-semibold">Hotel</th>
                  <th className="px-6 py-4 font-semibold">Stay Dates</th>
                  <th className="px-6 py-4 font-semibold">Details</th>
                  <th className="px-6 py-4 font-semibold">Total Price</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">#{booking.id.slice(0, 8)}</div>
                      <span className="text-xs text-gray-400">
                        {booking.createdAt?.toDate ? booking.createdAt.toDate().toLocaleDateString() : 'Just now'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-50 text-green-700 flex items-center justify-center font-bold text-xs uppercase">
                          {booking.userName ? booking.userName.slice(0, 2) : 'G'}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{booking.userName || 'Guest'}</div>
                          <div className="text-xs text-gray-400 truncate max-w-[150px]">{booking.userId || 'No ID'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">{booking.hotelName}</div>
                      <span className="text-xs text-gray-400">ID: {booking.hotelId?.slice(0, 8)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{booking.checkInDate || booking.checkIn}</div>
                      <div className="text-xs text-gray-500">to {booking.checkOutDate || booking.checkOut}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{booking.rooms} Room(s)</div>
                      <div className="text-xs text-gray-500">{booking.guests} Guest(s)</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">
                        ₹{(Number(booking.totalAmount) || 0).toLocaleString()}
                      </div>
                      {booking.couponCode && (
                        <div className="text-[10px] text-green-600 bg-green-50 rounded px-1.5 py-0.5 mt-0.5 inline-block font-medium">
                          Saved ₹{(Number(booking.discountAmount) || 0).toLocaleString()} via {booking.couponCode}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        booking.bookingStatus === 'Confirmed' ? 'bg-green-50 text-green-700 border-green-200' :
                        booking.bookingStatus === 'Checked In' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        booking.bookingStatus === 'Completed' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {booking.bookingStatus || 'Confirmed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleOpenEdit(booking)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Booking Status"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBooking(booking.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Booking Status Modal */}
      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Update Booking Status</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateStatus} className="p-6">
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-500 mb-1">Booking ID</p>
                <p className="text-base font-bold text-gray-900">#{selectedBooking.id}</p>
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium text-gray-500 mb-1">Guest / Hotel</p>
                <p className="text-sm text-gray-800 font-semibold">{selectedBooking.userName || 'Guest'}</p>
                <p className="text-xs text-gray-500">{selectedBooking.hotelName}</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Booking Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border rounded-lg p-2.5 bg-white outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                >
                  <option value="Confirmed">Confirmed</option>
                  <option value="Checked In">Checked In</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-green-600 text-white font-semibold hover:bg-green-700 rounded-lg transition-colors shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
