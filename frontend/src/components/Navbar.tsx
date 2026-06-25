import { useState, useEffect } from 'react';
import { type User } from 'firebase/auth';
import { Sun, Moon, Bell } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import logoImg from '../assets/logo.png';
import { Link } from 'react-router-dom';

interface NavbarProps {
  user: User | null;
  userData?: any;
  showNavLinks?: boolean;
  onOpenLogin: () => void;
  onOpenProfile: () => void;
  onOpenLinkBooking: () => void;
  onOpenDashboard?: () => void;
  onHome?: () => void;
  onSignOut: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Navbar = ({ user, userData, showNavLinks = true, onOpenLogin, onOpenProfile, onOpenLinkBooking, onOpenDashboard, onHome, onSignOut, darkMode, toggleDarkMode }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

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
      where('userId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const allNotifs: any[] = [];
      snapshot.forEach(doc => {
        allNotifs.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort locally by createdAt desc to avoid requiring a composite index in Firebase Free Tier
      allNotifs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setNotifications(allNotifs);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.notification-container')) {
        setIsNotificationOpen(false);
      }
      if (!target.closest('.user-dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Extract Initials function
  const getInitials = () => {
    if (user?.displayName) {
      return user.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <nav className="fixed w-full z-50 top-0 transition-all duration-300 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-2 relative">
          {/* Logo Section */}
          <div onClick={() => onHome && onHome()} className="flex-shrink-0 flex items-center cursor-pointer">
            <div className="h-12 w-20 md:w-32 flex-shrink-0 relative">
              <img src={logoImg} alt="Logo" className="absolute top-[-10px] md:top-[-14px] left-[-5px] md:left-8 h-20 md:h-32 w-auto object-contain z-50 max-w-none" />
            </div>
            <span className="font-bold text-lg md:text-xl tracking-tight text-gray-900 dark:text-white flex items-center pl-1 md:pl-8">
              AURORA <span className="text-blue-600 ml-1">HAVEN</span>
            </span>
          </div>

          {/* Navigation Links */}
          {showNavLinks && (
            <div className="hidden md:flex items-center space-x-8 font-medium text-gray-600 dark:text-gray-300">
              <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">Home</Link>
              <Link to="/about" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">About</Link>
              <Link to="/services" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">Services</Link>
              <Link to="/gallery" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">Gallery</Link>
              <Link to="/amenities" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">Amenities</Link>
              <Link to="/contact" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">Contact</Link>
              <Link to="/booking" className="bg-[#d4af37] text-white px-5 py-2 rounded-full font-medium hover:bg-yellow-600 transition-colors shadow-md">Book Now</Link>
            </div>
          )}

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            
            {/* Notification Bell */}
            {user && (
              <div className="relative notification-container">
                <button
                  onClick={() => {
                    setHasNewNotification(false);
                    setIsNotificationOpen(!isNotificationOpen);
                    setIsDropdownOpen(false); // Close user dropdown if open
                  }}
                  className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors focus:outline-none"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {hasNewNotification && (
                    <span className="absolute top-1 right-1.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {isNotificationOpen && (
                  <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg py-2 border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                      <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                      <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded-full">{notifications.length}</span>
                    </div>
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                        {notifications.map((notif) => (
                          <div key={notif.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{notif.title}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleString() : 'Just now'}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No new notifications</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Dark Mode Toggle */}
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors focus:outline-none"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {user ? (
              <div className="relative user-dropdown-container">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform hover:scale-105"
                >
                  {getInitials()}
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg py-1 border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm text-gray-900 dark:text-white font-medium truncate">{user.displayName || 'Guest User'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    </div>
                    <button 
                      onClick={() => { onOpenProfile(); setIsDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium border-b border-gray-100 dark:border-gray-700"
                    >
                      My Profile
                    </button>
                    {userData?.profileCompleted && (
                      <button 
                        onClick={() => { onOpenDashboard && onOpenDashboard(); setIsDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium border-b border-gray-100 dark:border-gray-700"
                      >
                        My Services
                      </button>
                    )}
                    {(!userData || !userData.profileCompleted) && (
                      <button 
                        onClick={() => { onOpenLinkBooking(); setIsDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium border-b border-gray-100 dark:border-gray-700"
                      >
                        Link Booking
                      </button>
                    )}
                    <button 
                      onClick={() => { onSignOut(); setIsDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={onOpenLogin}
                className="bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-black px-6 py-2.5 rounded-full font-medium transition-all shadow-md"
              >
                Sign in
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {user && (
              <div className="relative notification-container">
                <button
                  onClick={() => {
                    setHasNewNotification(false);
                    setIsNotificationOpen(!isNotificationOpen);
                  }}
                  className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors focus:outline-none"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {hasNewNotification && (
                    <span className="absolute top-1 right-1.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                  )}
                </button>
                {/* Mobile Notification Dropdown */}
                {isNotificationOpen && (
                  <div className="absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl py-2 border border-gray-100 dark:border-gray-700 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                      <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                    </div>
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                        {notifications.map((notif) => (
                          <div key={notif.id} className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{notif.title}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{notif.message}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                        <p className="text-sm">No new notifications</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none p-2"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[500px] border-b border-gray-200/50 dark:border-gray-800' : 'max-h-0'
        }`}
      >
        <div className="px-4 pt-2 pb-4 space-y-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
          {showNavLinks && (
            <div className="flex flex-col space-y-1 pb-2">
              <Link to="/" onClick={() => setIsOpen(false)} className="px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Home</Link>
              <Link to="/about" onClick={() => setIsOpen(false)} className="px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">About</Link>
              <Link to="/services" onClick={() => setIsOpen(false)} className="px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Services</Link>
              <Link to="/gallery" onClick={() => setIsOpen(false)} className="px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Gallery</Link>
              <Link to="/amenities" onClick={() => setIsOpen(false)} className="px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Amenities</Link>
              <Link to="/contact" onClick={() => setIsOpen(false)} className="px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Contact</Link>
              <Link to="/booking" onClick={() => setIsOpen(false)} className="px-3 py-2 rounded-md text-base font-bold text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400 mt-2">Book Now</Link>
            </div>
          )}
          
          <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-2">
            {user ? (
              <div className="space-y-3 px-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
                    {getInitials()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.displayName || 'Guest User'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { onOpenProfile(); setIsOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  My Profile
                </button>
                {userData?.profileCompleted && (
                  <button 
                    onClick={() => { onOpenDashboard && onOpenDashboard(); setIsOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    My Services
                  </button>
                )}
                {(!userData || !userData.profileCompleted) && (
                  <button 
                    onClick={() => { onOpenLinkBooking(); setIsOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Link Booking
                  </button>
                )}
                <button 
                  onClick={() => { onSignOut(); setIsOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button 
                onClick={() => { onOpenLogin(); setIsOpen(false); }}
                className="w-full text-center bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-black px-6 py-2.5 rounded-full font-medium transition-all shadow-md mt-2"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
