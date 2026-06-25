import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Bell, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const revenueData = [
  { name: 'Mon', revenue: 1200 },
  { name: 'Tue', revenue: 1900 },
  { name: 'Wed', revenue: 1500 },
  { name: 'Thu', revenue: 2200 },
  { name: 'Fri', revenue: 1800 },
  { name: 'Sat', revenue: 2800 },
  { name: 'Sun', revenue: 2400 },
];

export default function DashboardOverview() {
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [stats, setStats] = useState({ revenue: 0, activeBookings: 0, totalGuests: 0, availableRooms: 156 });
  const [liveNotification, setLiveNotification] = useState<any | null>(null);

  useEffect(() => {
    // Fetch initial stats and bookings
    const fetchDashboardData = async () => {
      try {
        const bookingsQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(10));
        const bookingDocs = await getDocs(bookingsQuery);
        
        let revenue = 0;
        let active = 0;
        let guests = 0;
        const bookingsData: any[] = [];
        
        bookingDocs.forEach(doc => {
          const data = doc.data();
          bookingsData.push({ id: doc.id, ...data });
          revenue += Number(data.totalAmount) || 0;
          active += 1;
          guests += Number(data.guests) || 0;
        });
        
        setRecentBookings(bookingsData);
        setStats(prev => ({ ...prev, revenue, activeBookings: active, totalGuests: guests }));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };
    
    fetchDashboardData();

    // Listen for new notifications
    let isInitialLoad = true;
    const notificationsQuery = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(1));
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          if (!isInitialLoad) {
            const data = change.doc.data();
            setLiveNotification({ id: change.doc.id, ...data });
            
            // Hide notification after 5 seconds
            setTimeout(() => setLiveNotification(null), 5000);
            
            // Also refresh bookings list
            fetchDashboardData();
          }
        }
      });
      isInitialLoad = false;
    }, (error) => {
      console.error("Notification listener error:", error);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-8 relative">
      {/* Live Notification Toast */}
      {liveNotification && (
        <div className="absolute top-4 right-8 bg-white border-l-4 border-green-500 shadow-xl rounded-lg p-4 w-80 animate-in slide-in-from-right fade-in duration-300 z-50">
          <div className="flex justify-between items-start">
            <div className="flex gap-3">
              <div className="bg-green-100 p-2 rounded-full h-fit">
                <Bell className="w-5 h-5 text-green-600 animate-bounce" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{liveNotification.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{liveNotification.message}</p>
                <span className="text-xs text-gray-400 mt-2 block">Just now</span>
              </div>
            </div>
            <button onClick={() => setLiveNotification(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Overview</h2>
        <p className="text-gray-500 mt-1">Here's what's happening with your properties today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { title: 'Total Revenue', value: `₹${stats.revenue.toLocaleString()}`, icon: '💰', trend: '+12.5%', color: 'bg-blue-500' },
          { title: 'Active Bookings', value: stats.activeBookings.toString(), icon: '📅', trend: '+5.2%', color: 'bg-green-500' },
          { title: 'Total Guests', value: stats.totalGuests.toString(), icon: '👥', trend: '+18.1%', color: 'bg-purple-500' },
          { title: 'Available Rooms', value: stats.availableRooms.toString(), icon: '🛏️', trend: '-2.4%', color: 'bg-orange-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group cursor-pointer relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
                <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <span className="text-xl">{stat.icon}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className={`font-medium ${stat.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{stat.trend}</span>
              <span className="text-gray-400 ml-2">vs last month</span>
            </div>
            <div className={`absolute -bottom-6 -right-6 w-24 h-24 ${stat.color} opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`}></div>
          </div>
        ))}
      </div>

      {/* Revenue Graph */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-10">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Revenue Trend</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dx={-10} tickFormatter={(value) => `₹${value}`} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#1f2937', fontWeight: 600 }}
                formatter={(value: any) => [`₹${value}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" animationDuration={1500} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-800">Recent Bookings</h3>
          <button className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Booking ID</th>
                <th className="px-6 py-4 font-medium">Guest</th>
                <th className="px-6 py-4 font-medium">Hotel</th>
                <th className="px-6 py-4 font-medium">Check In</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentBookings.length > 0 ? recentBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">#{booking.id.slice(0, 8)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{booking.userName || 'Guest'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{booking.hotelName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{booking.checkInDate || booking.checkIn}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">₹{(Number(booking.totalAmount) || Number(booking.totalPrice) || 0).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                      {booking.bookingStatus || booking.status || 'Confirmed'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No recent bookings found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

