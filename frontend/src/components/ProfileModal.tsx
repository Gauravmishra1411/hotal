  import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User as UserIcon, Phone, MapPin, AlignLeft, Save } from "lucide-react";
import { db } from '../firebase';
import { type User, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';


interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function ProfileModal({ isOpen, onClose, user }: ProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');
  
  // Document State removed

  // Fetch data on open
  useEffect(() => {
    if (isOpen && user) {
      setDisplayName(user.displayName || '');
      fetchUserProfile(user.uid);
    }
  }, [isOpen, user]);

  const fetchUserProfile = async (uid: string) => {
    try {
      setFetching(true);
      setError('');
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.displayName) setDisplayName(data.displayName);
        else if (data.name) setDisplayName(data.name); // from Guest Auth
        if (data.phoneNumber) setPhoneNumber(data.phoneNumber);
        else if (data.phone) setPhoneNumber(data.phone);
        if (data.address) setAddress(data.address);
        if (data.bio) setBio(data.bio);
      }

      // Document fetch removed
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      // We don't necessarily show an error if they just don't have a profile yet
    } finally {
      setFetching(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // 1. Update core Firebase Auth displayName (for the Navbar initials)
      if (displayName.trim() && displayName !== user.displayName) {
        await updateProfile(user, { displayName: displayName.trim() });
      }

      // 2. Save detailed data to Firestore
      const userRef = doc(db, 'users', user.uid);
      
      const payload: any = {
        uid: user.uid,
        displayName: displayName.trim(),
        name: displayName.trim(),
        phoneNumber: phoneNumber.trim(),
        phone: phoneNumber.trim(),
        address: address.trim(),
        bio: bio.trim(),
        profileCompleted: true,
        updatedAt: serverTimestamp()
      };
      
      if (user.email) {
        payload.email = user.email;
      }
      
      await setDoc(userRef, payload, { merge: true });

      // 3. Document save removed

      setSuccess('Profile updated successfully!');
      
      // Auto close after 2 seconds
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 2000);

    } catch (err: any) {
      console.error("Error saving profile:", err);
      if (err.code === 'permission-denied') {
        setError('Permission denied. Make sure your Firestore rules allow users to write to their own profile.');
      } else {
        setError(err.message || 'Failed to save profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      {/* Top-right notification popup */}
      {(error || success) && (
        <div className="fixed top-6 right-6 z-[200] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border ${success ? 'bg-green-600 border-green-500 text-white shadow-green-900/20' : 'bg-red-600 border-red-500 text-white shadow-red-900/20'}`}>
            {success ? (
               <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            ) : (
               <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            )}
            <span className="font-semibold text-[15px] tracking-wide">{success || error}</span>
            <button type="button" onClick={() => { setSuccess(''); setError(''); }} className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-[500px] max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        <div className="mb-6 mt-2 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-500/30 mb-4">
            {displayName ? displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-[28px] font-bold leading-tight text-gray-900 tracking-tight">
            My Profile
          </h2>
          <p className="text-gray-500 text-sm mt-1">{user.email}</p>
        </div>



        {fetching ? (
          <div className="flex justify-center items-center py-12">
             <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="space-y-5">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-gray-400" /> Full Name
              </label>
              <input 
                type="text" 
                placeholder="Gaurav Kumar"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" /> Phone Number
              </label>
              <input 
                type="tel" 
                placeholder="+91 98765 43210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" /> Address
              </label>
              <input 
                type="text" 
                placeholder="City, Country"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <AlignLeft className="w-4 h-4 text-gray-400" /> Short Bio / Preferences
              </label>
              <textarea 
                placeholder="Frequent traveler, prefers non-smoking rooms..."
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors resize-none"
              />
            </div>



            <button 
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-black py-3.5 font-semibold text-white transition-all hover:bg-gray-800 disabled:opacity-50 mt-4 flex items-center justify-center gap-2 shadow-md"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-5 h-5" /> Save Profile
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
