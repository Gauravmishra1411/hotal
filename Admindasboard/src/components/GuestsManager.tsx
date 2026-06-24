import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, setDoc, doc, updateDoc, serverTimestamp, getDoc, addDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, secondaryAuth } from '../firebase';
import { Search, User, Mail, DollarSign, Calendar, MapPin, Plus, X, Loader2, Send, FileImage, Eye } from 'lucide-react';

export default function GuestsManager() {
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGuestPhone, setNewGuestPhone] = useState('');
  const [newGuestBookingId, setNewGuestBookingId] = useState('');
  const [newGuestHotel, setNewGuestHotel] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Selected Guest Modal
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [guestDocs, setGuestDocs] = useState<any>(null);
  const [docsLoading, setDocsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageLoading, setMessageLoading] = useState(false);

  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');

    try {
      const email = `${newGuestPhone.replace(/\D/g, '')}@guest.luxestay.com`;
      const password = newGuestBookingId;

      // 1. Create auth user using secondary app
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const userId = userCredential.user.uid;

      // 2. Add to users collection
      await setDoc(doc(db, 'users', userId), {
        phone: newGuestPhone,
        bookingId: newGuestBookingId,
        hotelId: newGuestHotel,
        profileCompleted: false,
        createdAt: serverTimestamp()
      });

      // 3. Add to bookings collection to show in guest list
      await setDoc(doc(db, 'bookings', newGuestBookingId), {
        userId,
        userName: `Guest (${newGuestPhone})`,
        phone: newGuestPhone,
        bookingId: newGuestBookingId,
        hotelName: newGuestHotel,
        totalAmount: 0,
        createdAt: serverTimestamp()
      });

      setIsCreateModalOpen(false);
      setNewGuestPhone('');
      setNewGuestBookingId('');
      setNewGuestHotel('');
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create guest credential');
    } finally {
      setCreateLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    let usersData: Record<string, any> = {};
    let bookingsData: any[] = [];
    let initialLoad = { users: false, bookings: false };

    const updateGuests = () => {
      if (!initialLoad.users || !initialLoad.bookings) return;

      const guestMap: Record<string, any> = {};

      Object.keys(usersData).forEach(userId => {
        const u = usersData[userId];
        guestMap[userId] = {
          id: userId,
          name: u.name || `Guest (${u.phone || 'Unknown'})`,
          phone: u.phone || '',
          email: `${userId.slice(0, 10)}@luxestay-user.com`,
          totalSpent: 0,
          bookingCount: 0,
          lastBookingDate: null,
          hotels: {} as Record<string, number>,
          profileCompleted: !!u.profileCompleted,
          isActive: u.isActive !== false // Default true
        };
      });

      bookingsData.forEach((booking) => {
        const userId = booking.userId;
        if (!userId) return;

        if (!guestMap[userId]) {
          guestMap[userId] = {
            id: userId,
            name: booking.userName || 'Unknown Guest',
            phone: booking.phone || '',
            email: `${userId.slice(0, 10)}@luxestay-user.com`,
            totalSpent: 0,
            bookingCount: 0,
            lastBookingDate: null,
            hotels: {} as Record<string, number>,
            profileCompleted: false,
            isActive: true
          };
        }

        const guest = guestMap[userId];
        guest.bookingCount += 1;
        guest.totalSpent += Number(booking.totalAmount) || 0;

        const bookingDate = booking.createdAt?.toDate ? booking.createdAt.toDate() : new Date();
        if (!guest.lastBookingDate || bookingDate > guest.lastBookingDate) {
          guest.lastBookingDate = bookingDate;
        }

        const hotelName = booking.hotelName || 'Unknown Hotel';
        guest.hotels[hotelName] = (guest.hotels[hotelName] || 0) + 1;
      });

      const guestsArray = Object.keys(guestMap).map((key) => {
        const guest = guestMap[key];
        let preferredHotel = 'None';
        let maxBookings = 0;
        Object.entries(guest.hotels).forEach(([hotel, count]) => {
          const countNum = Number(count);
          if (countNum > maxBookings) {
            maxBookings = countNum;
            preferredHotel = hotel;
          }
        });

        return { ...guest, preferredHotel };
      });

      guestsArray.sort((a, b) => b.totalSpent - a.totalSpent);
      setGuests(guestsArray);
      setLoading(false);
    };

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      usersData = {};
      snapshot.forEach(doc => { usersData[doc.id] = doc.data(); });
      initialLoad.users = true;
      updateGuests();
    });

    const unsubBookings = onSnapshot(collection(db, 'bookings'), (snapshot) => {
      bookingsData = [];
      snapshot.forEach(doc => { bookingsData.push(doc.data()); });
      initialLoad.bookings = true;
      updateGuests();
    });

    return () => {
      unsubUsers();
      unsubBookings();
    };
  }, []);

  const filteredGuests = guests.filter(guest => {
    const searchLower = searchTerm.toLowerCase();
    return (
      guest.name.toLowerCase().includes(searchLower) ||
      guest.id.toLowerCase().includes(searchLower) ||
      guest.preferredHotel.toLowerCase().includes(searchLower)
    );
  });

  const openGuestDetails = async (guest: any) => {
    setSelectedGuest(guest);
    setDocsLoading(true);
    setGuestDocs(null);
    try {
      const docRef = doc(db, 'userDocuments', guest.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setGuestDocs(docSnap.data());
      }
    } catch (err) {
      console.error("Error fetching guest docs:", err);
    } finally {
      setDocsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedGuest) return;
    setMessageLoading(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: selectedGuest.id, // Only for this guest
        title: 'Message from Hotel Admin',
        message: message,
        isRead: false,
        createdAt: serverTimestamp(),
        type: 'admin_message'
      });
      setMessage('');
      alert('Message sent to guest!');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setMessageLoading(false);
    }
  };

  const toggleGuestActive = async (guest: any) => {
    try {
      const newStatus = !guest.isActive;
      await updateDoc(doc(db, 'users', guest.id), {
        isActive: newStatus
      });
      // the snapshot listener will auto-update the UI
    } catch (err) {
      console.error('Error toggling guest status:', err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-gray-50 h-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Guest Profiles</h2>
          <p className="text-gray-500 mt-1">View history, preferences, and details of all booking customers.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors shadow-sm font-medium"
        >
          <Plus className="h-5 w-5" />
          Create Guest Credential
        </button>
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex items-center justify-between">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search guest name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all"
          />
        </div>
        <div className="text-sm text-gray-500 font-medium">
          Unique Guests: {filteredGuests.length}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : filteredGuests.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No guests registered yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 text-xs uppercase tracking-wider text-gray-400 border-b border-gray-150">
                  <th className="px-6 py-4 font-semibold">Guest Name</th>
                  <th className="px-6 py-4 font-semibold">User ID</th>
                  <th className="px-6 py-4 font-semibold">Bookings</th>
                  <th className="px-6 py-4 font-semibold">Preferred Resort</th>
                  <th className="px-6 py-4 font-semibold">Total Revenue</th>
                  <th className="px-6 py-4 font-semibold">Last Reservation</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 text-green-800 flex items-center justify-center font-bold text-sm uppercase">
                          {guest.name.slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{guest.name}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-gray-400" /> {guest.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                        {guest.id.slice(0, 16)}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                        {guest.bookingCount} stay(s)
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-900">
                        <MapPin className="w-4 h-4 text-red-400" />
                        <span className="font-medium">{guest.preferredHotel}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-black text-green-600 flex items-center">
                        <DollarSign className="w-4 h-4" />
                        {guest.totalSpent.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {guest.lastBooking ? guest.lastBooking.toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleGuestActive(guest)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${guest.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${guest.isActive ? 'translate-x-4' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => openGuestDetails(guest)}
                        className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Create Guest Credential</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {createError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateGuest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={newGuestPhone}
                  onChange={(e) => setNewGuestPhone(e.target.value)}
                  placeholder="e.g., +1234567890"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Booking ID (used as Password)</label>
                <input
                  type="text"
                  required
                  value={newGuestBookingId}
                  onChange={(e) => setNewGuestBookingId(e.target.value)}
                  placeholder="e.g., BK12345"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hotel</label>
                <input
                  type="text"
                  required
                  value={newGuestHotel}
                  onChange={(e) => setNewGuestHotel(e.target.value)}
                  placeholder="e.g., LuxeStay Downtown"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={createLoading}
                  className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex justify-center items-center"
                >
                  {createLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Guest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{selectedGuest.name}</h3>
                <p className="text-gray-500 text-sm">User ID: {selectedGuest.id}</p>
              </div>
              <button onClick={() => setSelectedGuest(null)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Docs */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                  <FileImage className="w-5 h-5 text-green-600" />
                  ID Documents
                </h4>
                {docsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                  </div>
                ) : guestDocs ? (
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-3 rounded-lg border">
                      <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Primary ID</span>
                      <p className="font-medium text-gray-900">{guestDocs.idType || 'Document provided'}</p>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-semibold text-gray-700 mb-2">Primary ID</h5>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-xs text-gray-500 mb-1 block">Front</span>
                          <a href={guestDocs.frontImage} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-lg border border-gray-200">
                            <img src={guestDocs.frontImage} alt="ID Front" className="w-full h-24 object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye className="w-6 h-6 text-white" />
                            </div>
                          </a>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 mb-1 block">Back</span>
                          <a href={guestDocs.backImage} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-lg border border-gray-200">
                            <img src={guestDocs.backImage} alt="ID Back" className="w-full h-24 object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye className="w-6 h-6 text-white" />
                            </div>
                          </a>
                        </div>
                      </div>
                    </div>

                    {guestDocs.secondaryIdFront && (
                      <div className="pt-4 border-t">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">Secondary ID</h5>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-xs text-gray-500 mb-1 block">Front</span>
                            <a href={guestDocs.secondaryIdFront} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-lg border border-gray-200">
                              <img src={guestDocs.secondaryIdFront} alt="Secondary ID Front" className="w-full h-24 object-cover" />
                            </a>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 mb-1 block">Back</span>
                            <a href={guestDocs.secondaryIdBack} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-lg border border-gray-200">
                              <img src={guestDocs.secondaryIdBack} alt="Secondary ID Back" className="w-full h-24 object-cover" />
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {(guestDocs.livePhoto || guestDocs.fingerprint) && (
                      <div className="pt-4 border-t">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">Biometrics</h5>
                        <div className="grid grid-cols-2 gap-2">
                          {guestDocs.livePhoto && (
                            <div>
                              <span className="text-xs text-gray-500 mb-1 block">Live Photo</span>
                              <a href={guestDocs.livePhoto} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-lg border border-gray-200">
                                <img src={guestDocs.livePhoto} alt="Live Photo" className="w-full h-24 object-cover" />
                              </a>
                            </div>
                          )}
                          {guestDocs.fingerprint && (
                            <div>
                              <span className="text-xs text-gray-500 mb-1 block">Fingerprint Scan</span>
                              <a href={guestDocs.fingerprint} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-lg border border-gray-200 bg-white">
                                <img src={guestDocs.fingerprint} alt="Fingerprint" className="w-full h-24 object-contain p-2" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {guestDocs.signature && (
                      <div className="pt-4 border-t">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">Digital Signature</h5>
                        <div className="border border-gray-200 bg-white rounded-lg p-2 flex justify-center">
                          <img src={guestDocs.signature} alt="Signature" className="max-h-24 object-contain" />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed">
                    Guest has not completed profile
                  </div>
                )}
              </div>

              {/* Right Column: Send Message */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                  <Send className="w-5 h-5 text-blue-600" />
                  Send Message
                </h4>
                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message Content</label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a notification to send to this guest..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={messageLoading || !message.trim()}
                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {messageLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Send className="w-4 h-4" /> Send to Guest</>}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
