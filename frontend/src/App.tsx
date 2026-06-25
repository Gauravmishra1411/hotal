import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';

import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import ProfileModal from './components/ProfileModal';
import DynamicPage from './components/DynamicPage';
import Footer from './components/Footer';
import GuestDashboard from './components/GuestDashboard';
import ProfileCompletionModal from './components/ProfileCompletionModal';
import LinkBookingModal from './components/LinkBookingModal';
import AIConcierge from './components/AIConcierge';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';
import Amenities from './pages/Amenities';
import BookingEngine from './pages/BookingEngine';
import Gallery from './pages/Gallery';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLinkBookingOpen, setIsLinkBookingOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activePageSlug, setActivePageSlug] = useState<string | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showProfileCompletion, setShowProfileCompletion] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserData(null);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
      }
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);



  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-amber-50/60 dark:bg-amber-950/20 transition-colors duration-300">
        <Navbar 
        user={user} 
        userData={userData}
        showNavLinks={!showDashboard && !activePageSlug}
        onOpenLogin={() => setIsLoginOpen(true)} 
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenLinkBooking={() => setIsLinkBookingOpen(true)}
        onOpenDashboard={() => setShowDashboard(true)}
        onHome={() => { setShowDashboard(false); setActivePageSlug(null); }}
        onSignOut={handleSignOut} 
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
      />
      
      {/* Main Content Area */}
      {showDashboard && user && userData?.profileCompleted ? (
        <GuestDashboard user={user} userData={userData} />
      ) : activePageSlug ? (
        <DynamicPage slug={activePageSlug} onBack={() => setActivePageSlug(null)} />
      ) : (
        <Routes>
          <Route path="/" element={<Home user={user} onOpenLogin={() => setIsLoginOpen(true)} />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/amenities" element={<Amenities />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/booking" element={<BookingEngine />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
        </Routes>
      )}

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} user={user} />
        {user && (
          <LinkBookingModal 
            isOpen={isLinkBookingOpen} 
            onClose={() => setIsLinkBookingOpen(false)} 
            userId={user.uid} 
            onSuccess={() => setShowDashboard(true)}
          />
        )}
        {user && userData && !userData.profileCompleted && showProfileCompletion && (
          <ProfileCompletionModal 
            isOpen={true} 
            userId={user.uid}
            onComplete={() => console.log('Profile completed')}
            onClose={() => setShowProfileCompletion(false)}
          />
        )}
        
        <Footer onNavigate={(slug: string) => {
          setActivePageSlug(slug);
          window.scrollTo(0, 0);
        }} />

        {/* AI Concierge Chat Widget */}
        <AIConcierge user={user} userData={userData} />
      </div>
    </Router>
  )
}

export default App;