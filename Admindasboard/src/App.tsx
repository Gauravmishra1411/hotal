import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth, db } from './firebase';
import { collection, query, orderBy, limit, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import AdminLogin from './AdminLogin';
import DashboardOverview from './components/DashboardOverview';
import HotelsManager from './components/HotelsManager';
import ContentManager from './components/ContentManager';
import BookingsManager from './components/BookingsManager';
import GuestsManager from './components/GuestsManager';
import ServiceRequestsManager from './components/ServiceRequestsManager';
import ServicesManager from './components/ServicesManager';
import InvoicesManager from './components/InvoicesManager';
import { 
  LayoutDashboard, 
  BedDouble, 
  Users, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  CalendarCheck,
  Building,
  FileText,
  Clock,
  Briefcase,
  Receipt
} from 'lucide-react';
import logoImg from './assets/logo.png';

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.notification-container')) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playNote = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime + startTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime + startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + startTime + duration);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start(audioCtx.currentTime + startTime);
        oscillator.stop(audioCtx.currentTime + startTime + duration);
      };
      // "fa fa" -> playing two F notes
      playNote(349.23, 0, 0.15); // Fa
      playNote(349.23, 0.2, 0.15); // Fa
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  useEffect(() => {
    if (!user) return;
    let isInitialLoad = true;
    const notificationsQuery = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const allNotifs: any[] = [];
      snapshot.forEach(doc => {
        allNotifs.push({ id: doc.id, ...doc.data() });
      });
      setNotifications(allNotifs);

      // Check if any notifications are unread to display badge
      const unread = allNotifs.some(n => !n.isRead);
      setHasNewNotification(unread);

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          if (!isInitialLoad) {
            setHasNewNotification(true);
            playNotificationSound();
          }
        }
      });
      isInitialLoad = false;
    }, (error) => {
      console.error("Notification listener error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter(n => !n.isRead);
      await Promise.all(unreadNotifs.map(notif => 
        updateDoc(doc(db, 'notifications', notif.id), { isRead: true })
      ));
      setHasNewNotification(false);
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AdminLogin />;
  }

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Bookings', icon: CalendarCheck },
    { name: 'Hotels & Rooms', icon: BedDouble },
    { name: 'Guests', icon: Users },
    { name: 'Service Requests', icon: Clock },
    { name: 'Manage Services', icon: Briefcase },
    { name: 'Invoices', icon: Receipt },
    { name: 'Content Management', icon: FileText },
    { name: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-6 flex flex-col items-center gap-3 mt-4">
          <img src={logoImg} alt="Logo" className="h-20 w-auto object-contain rounded-xl shadow-md" />
          <span className="text-xl font-bold tracking-wider mt-2">AURORA HAVEN</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === item.name 
                  ? 'bg-green-600 text-white shadow-lg shadow-green-900/50' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800 mb-4">
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-10">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search bookings, guests..." 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-transparent rounded-full focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
            />
          </div>
          
          <div className="flex items-center gap-6">
            {/* Notification Bell */}
            <div className="relative notification-container">
              <button 
                onClick={() => {
                  setHasNewNotification(false);
                  setIsNotificationOpen(!isNotificationOpen);
                  if (!isNotificationOpen) {
                    handleMarkAllAsRead();
                  }
                }}
                className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                aria-label="Notifications"
              >
                <Bell className="h-6 w-6" />
                {hasNewNotification && (
                  <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-xl shadow-lg py-2 border border-gray-100 animate-in fade-in slide-in-from-top-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">Notifications</h3>
                    <span className="text-xs bg-green-150 text-green-800 px-2 py-0.5 rounded-full">{notifications.length}</span>
                  </div>
                  {notifications.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                      {notifications.map((notif) => (
                        <div key={notif.id} className="px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                          <p className="text-sm font-semibold text-gray-900">{notif.title}</p>
                          <p className="text-sm text-gray-600 mt-0.5">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleString() : 'Just now'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-450">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-20 text-gray-400" />
                      <p className="text-sm">No new notifications</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-green-400 to-green-600 flex items-center justify-center text-white font-bold shadow-md uppercase">
                {user.email ? user.email.substring(0, 2) : 'AD'}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 truncate max-w-[120px]" title={user.email || ''}>
                  {user.email}
                </p>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'Dashboard' && <DashboardOverview />}
          {activeTab === 'Bookings' && <BookingsManager />}
          {activeTab === 'Hotels & Rooms' && <HotelsManager />}
          {activeTab === 'Guests' && <GuestsManager />}
          {activeTab === 'Content Management' && <ContentManager />}
          { activeTab === 'Service Requests' && <ServiceRequestsManager /> }
          { activeTab === 'Manage Services' && <ServicesManager /> }
          { activeTab === 'Invoices' && <InvoicesManager /> }
          {activeTab !== 'Dashboard' && activeTab !== 'Bookings' && activeTab !== 'Hotels & Rooms' && activeTab !== 'Guests' && activeTab !== 'Content Management' && activeTab !== 'Service Requests' && activeTab !== 'Manage Services' && activeTab !== 'Invoices' && (
            <div className="p-8 text-gray-500">Content for {activeTab} will be added soon.</div>
          )}
        </div>
      </main>
    </div>
  );
}
