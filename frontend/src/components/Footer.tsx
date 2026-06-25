import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Shield, CreditCard, Clock, Globe } from 'lucide-react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface FooterProps {
  onNavigate: (slug: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const [siteSettings, setSiteSettings] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, 'site_settings'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setSiteSettings(snapshot.docs[0].data());
      }
    });
    return () => unsubscribe();
  }, []);

  const handleNav = (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(slug);
    }
  };

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 transition-colors duration-300 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          
          {/* Brand & About */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                {siteSettings?.siteName || "LuxeStay"}
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              Experience the world's most luxurious accommodations. We provide premium hotel bookings with exclusive deals, price match guarantees, and 24/7 concierge support.
            </p>
            <div className="flex gap-4">
              <a href={siteSettings?.facebookUrl || "#"} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-500 transition-all">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
              </a>
              <a href={siteSettings?.twitterUrl || "#"} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-500 transition-all">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </a>
              <a href={siteSettings?.instagramUrl || "#"} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-500 transition-all">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href={siteSettings?.linkedinUrl || "#"} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-500 transition-all">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-bold mb-6 text-lg">Quick Links</h3>
            <ul className="space-y-4 text-sm font-medium text-gray-500 dark:text-gray-400">
              <li><a href="#" onClick={(e) => handleNav(e, 'browse-hotels')} className="hover:text-green-600 dark:hover:text-green-400 transition-colors inline-block transform hover:translate-x-1 duration-200">Browse Hotels</a></li>
              <li><a href="#" onClick={(e) => handleNav(e, 'special-offers')} className="hover:text-green-600 dark:hover:text-green-400 transition-colors inline-block transform hover:translate-x-1 duration-200">Special Offers</a></li>
              <li><a href="#" onClick={(e) => handleNav(e, 'packages')} className="hover:text-green-600 dark:hover:text-green-400 transition-colors inline-block transform hover:translate-x-1 duration-200">Flight & Hotel Packages</a></li>
              <li><a href="#" onClick={(e) => handleNav(e, 'corporate')} className="hover:text-green-600 dark:hover:text-green-400 transition-colors inline-block transform hover:translate-x-1 duration-200">Corporate Travel</a></li>
              <li><a href="#" onClick={(e) => handleNav(e, 'blog')} className="hover:text-green-600 dark:hover:text-green-400 transition-colors inline-block transform hover:translate-x-1 duration-200">Travel Blog</a></li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-bold mb-6 text-lg">Customer Support</h3>
            <ul className="space-y-4 text-sm font-medium text-gray-500 dark:text-gray-400">
              <li><a href="#" onClick={(e) => handleNav(e, 'faq')} className="hover:text-green-600 dark:hover:text-green-400 transition-colors inline-block transform hover:translate-x-1 duration-200">Help Center / FAQs</a></li>
              <li><a href="#" onClick={(e) => handleNav(e, 'manage-booking')} className="hover:text-green-600 dark:hover:text-green-400 transition-colors inline-block transform hover:translate-x-1 duration-200">Manage your Booking</a></li>
              <li><a href="#" onClick={(e) => handleNav(e, 'cancellation')} className="hover:text-green-600 dark:hover:text-green-400 transition-colors inline-block transform hover:translate-x-1 duration-200">Cancellation Policy</a></li>
              <li><Link to="/privacy-policy" className="hover:text-green-600 dark:hover:text-green-400 transition-colors inline-block transform hover:translate-x-1 duration-200">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-green-600 dark:hover:text-green-400 transition-colors inline-block transform hover:translate-x-1 duration-200">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact & Trust */}
          <div className="space-y-6">
            <h3 className="text-gray-900 dark:text-white font-bold mb-2 text-lg">Contact Us</h3>
            <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
                <span>{siteSettings?.contactAddress || "123 Luxury Avenue, Suite 500, San Francisco, CA 94103"}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0" />
                <span>{siteSettings?.contactPhone || "+1 (800) 123-4567"}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0" />
                <span>{siteSettings?.contactEmail || "support@luxestay.com"}</span>
              </li>
            </ul>
            
            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-3 uppercase tracking-wider">Trusted & Secure</p>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>Secure SSL</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4 text-green-500" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center md:text-left">
            &copy; {new Date().getFullYear()} {siteSettings?.siteName || "LuxeStay"} Technologies Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-gray-400 dark:text-gray-500">
            <CreditCard className="w-6 h-6 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
            <svg viewBox="0 0 38 24" className="w-8 h-auto opacity-70 hover:opacity-100 transition-opacity"><path fill="#006CFF" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.3 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.3-3-3-3z"/><path fill="#FFF" d="M12.2 11.2c-.4-1.2-1.6-1.5-2.6-1.5-1.9 0-3.3 1.1-3.3 3.1 0 1.9 1.4 3 3.3 3 1.2 0 2.2-.4 2.8-1.5.3-.5.4-1.2.3-2-.1-1-.5-1.5-1.2-1.6-.7-.1-1.2.1-1.6.4-.3.2-.5.5-.6.9-.1.4 0 .9.2 1.3.3.6.9 1 1.6 1 .7 0 1.3-.3 1.6-.9l1.4.6c-.5 1-1.4 1.7-2.9 1.7-2.3 0-4.1-1.4-4.1-3.8 0-2.4 1.8-3.8 4-3.8 1.4 0 2.5.6 3 1.7l-1.4.6zm6.3-2.6h1.5v6.9h-1.5v-6.9zm-4.3 0h1.5v5.3c0 .5.3.8.8.8.5 0 .8-.3.8-.8v-5.3h1.5v5.3c0 1.3-1 2.2-2.3 2.2-1.3 0-2.3-.9-2.3-2.2v-5.3zm13.1 3.5c0 .6-.1 1.2-.4 1.8l1.3.5c.3-.7.5-1.5.5-2.3 0-2.3-1.8-4-4.1-4-2.3 0-4.1 1.7-4.1 4s1.8 4 4.1 4c1.1 0 2.2-.4 2.9-1.1l-1-1c-.5.5-1.2.8-1.9.8-1.5 0-2.6-1.1-2.6-2.6 0-1.5 1.1-2.6 2.6-2.6 1.4 0 2.5 1.1 2.7 2.5zm-5.4 0c.1-1.1 1-1.9 2.1-1.9 1.1 0 2 .8 2.1 1.9h-4.2z"/></svg>
            <svg viewBox="0 0 38 24" className="w-8 h-auto opacity-70 hover:opacity-100 transition-opacity"><path fill="#FF5F00" d="M22.6 12a5.8 5.8 0 100-11.6 5.8 5.8 0 000 11.6z"/><path fill="#EB001B" d="M15.4 12a5.8 5.8 0 100-11.6 5.8 5.8 0 000 11.6z"/><path fill="#F79E1B" d="M19 10.3a5.8 5.8 0 010-8.6 5.8 5.8 0 010 8.6z"/></svg>
          </div>
        </div>
      </div>
    </footer>
  );
}
