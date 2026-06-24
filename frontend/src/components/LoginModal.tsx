import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Eye, EyeOff } from "lucide-react";
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [phone, setPhone] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [showBookingId, setShowBookingId] = useState(false);
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setPhone('');
      setBookingId('');
      setShowBookingId(false);
      setName('');
      setEmail('');
      setPassword('');
      setShowPassword(false);
      setIsSignUp(false);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      
      if (isSignUp) {
        if (!name.trim() || !email.trim() || !password.trim()) return;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name,
          email,
          role: 'guest',
          createdAt: new Date(),
          profileCompleted: false
        });
        onClose();
      } else {
        if (!phone.trim() || !bookingId.trim()) return;
        const authEmail = `${phone.replace(/\D/g, '')}@guest.luxestay.com`;
        await signInWithEmailAndPassword(auth, authEmail, bookingId);
        onClose();
      }
    } catch (err: any) {
      console.log(err.code);
      if (err.code === 'auth/invalid-credential') {
        setError('Invalid credentials. Please try again.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else {
        setError(err.message || 'Failed to authenticate');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate with Google');
    }
  };



  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-[420px] max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        <div className="mb-8 mt-2">
          {/* TripAdvisor Owl Logo Approximation */}
          <svg viewBox="0 0 100 60" className="h-10 w-auto mb-6 text-[#00381A]">
            <g fill="currentColor">
              <path d="M 28 10 C 16.954 10 8 18.954 8 30 C 8 41.046 16.954 50 28 50 C 39.046 50 48 41.046 48 30 C 48 18.954 39.046 10 28 10 Z M 28 43 C 20.82 43 15 37.18 15 30 C 15 22.82 20.82 17 28 17 C 35.18 17 41 22.82 41 30 C 41 37.18 35.18 43 28 43 Z" />
              <circle cx="28" cy="30" r="7" />
              
              <path d="M 72 10 C 60.954 10 52 18.954 52 30 C 52 41.046 60.954 50 72 50 C 83.046 50 92 41.046 92 30 C 92 18.954 83.046 10 72 10 Z M 72 43 C 64.82 43 59 37.18 59 30 C 59 22.82 64.82 17 72 17 C 79.18 17 85 22.82 85 30 C 85 37.18 79.18 43 72 43 Z" />
              <circle cx="72" cy="30" r="7" />
              
              <path d="M 50 35 L 43 20 L 57 20 Z" />
              <path d="M 12 12 Q 28 -2 43 12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <path d="M 57 12 Q 72 -2 88 12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </g>
          </svg>
          
          <h2 className="text-[28px] font-bold leading-tight text-[#00381A] tracking-tight">
            {isSignUp ? 'Create an Account' : 'Guest Sign In'}
          </h2>
          <p className="text-gray-500 mt-2 text-sm">
            {isSignUp 
              ? 'Sign up to manage your bookings and profile.' 
              : 'Enter your Phone Number and Booking ID to access your profile and hotel services.'}
          </p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-200">{error}</div>}

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. John Doe"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="e.g. john@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Create a password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 pl-4 pr-12 py-3 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[34px] p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. +1234567890"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Booking ID</label>
                  <input 
                    type={showBookingId ? "text" : "password"} 
                    placeholder="e.g. BK12345"
                    required
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 pl-4 pr-12 py-3 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowBookingId(!showBookingId)}
                    className="absolute right-3 top-[34px] p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showBookingId ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </>
            )}
            
            <button 
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-green-600 py-3 font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50 mt-4"
            >
              {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In as Guest')}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-sm font-medium text-green-600 hover:text-green-700 focus:outline-none"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGoogleSignIn}
              className="flex w-full items-center justify-center gap-3 rounded-full border border-gray-300 bg-white px-4 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </button>
          </div>

        <p className="mt-10 text-center text-[13px] text-gray-600">
          By proceeding, you agree to our{" "}
          <a href="#" className="underline hover:text-gray-900">
            Terms of Use
          </a>{" "}
          and confirm
          <br />
          you have read our{" "}
          <a href="#" className="underline hover:text-gray-900">
            Privacy and Cookie Statement
          </a>
          .
        </p>
      </div>
    </div>,
    document.body
  );
}
