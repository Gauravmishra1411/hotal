import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { Upload, Loader2, FileImage, X } from 'lucide-react';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  userId: string;
  onComplete: () => void;
  onClose?: () => void;
}

export default function ProfileCompletionModal({ isOpen, userId, onComplete, onClose }: ProfileCompletionModalProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [idType, setIdType] = useState('Aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleUploadImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = (err) => reject(err);
        img.src = event.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!frontImage || !backImage) {
      setError('Please upload both front and back images of your ID.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Upload images
      // Upload images as Base64 to bypass Firebase Storage CORS limits
      const frontUrl = await handleUploadImage(frontImage);
      const backUrl = await handleUploadImage(backImage);

      // Save documents info
      await setDoc(doc(db, 'userDocuments', userId), {
        idType,
        idNumber,
        frontImage: frontUrl,
        backImage: backUrl,
        verified: false,
        updatedAt: new Date()
      });

      // Update user profile
      await updateDoc(doc(db, 'users', userId), {
        name: fullName,
        phone: phone,
        address: address,
        profileCompleted: true
      });

      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to save profile information.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-8 shadow-2xl">
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        )}
        
        <div className="mb-6 pr-8">
          <h2 className="text-[28px] font-bold leading-tight text-[#00381A] tracking-tight">
            Complete Your Profile
          </h2>
          <p className="text-gray-500 mt-2 text-sm">
            For security and hotel policy, please provide your details and a valid government ID before accessing hotel services.
          </p>
        </div>

        {error && <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-200">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input 
                type="text" 
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input 
                type="text" 
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input 
              type="text" 
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Type</label>
              <select 
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600 bg-white"
              >
                <option value="Aadhaar">Aadhaar</option>
                <option value="Passport">Passport</option>
                <option value="Driving License">Driving License</option>
                <option value="Other">Other Government ID</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
              <input 
                type="text" 
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Front of ID</label>
              <div 
                onClick={() => frontInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${frontImage ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}
              >
                <input 
                  type="file" 
                  ref={frontInputRef}
                  onChange={(e) => setFrontImage(e.target.files?.[0] || null)}
                  accept="image/*"
                  className="hidden" 
                />
                {frontImage ? (
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <FileImage className="h-5 w-5" />
                    <span className="text-sm font-medium truncate">{frontImage.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-gray-500">
                    <Upload className="h-6 w-6 mb-2 text-gray-400" />
                    <span className="text-sm">Click to upload front image</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Back of ID</label>
              <div 
                onClick={() => backInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${backImage ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}
              >
                <input 
                  type="file" 
                  ref={backInputRef}
                  onChange={(e) => setBackImage(e.target.files?.[0] || null)}
                  accept="image/*"
                  className="hidden" 
                />
                {backImage ? (
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <FileImage className="h-5 w-5" />
                    <span className="text-sm font-medium truncate">{backImage.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-gray-500">
                    <Upload className="h-6 w-6 mb-2 text-gray-400" />
                    <span className="text-sm">Click to upload back image</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-green-600 py-3.5 font-bold text-white transition-colors hover:bg-green-700 disabled:opacity-50 flex items-center justify-center text-lg shadow-lg"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Complete Profile & Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
