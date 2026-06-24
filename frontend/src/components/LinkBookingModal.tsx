import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Link as LinkIcon, Camera, Fingerprint, Upload, FileImage, PenTool } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

interface LinkBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
}

export default function LinkBookingModal({ isOpen, onClose, userId, onSuccess }: LinkBookingModalProps) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [bookingData, setBookingData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Step 2 State
  const [idType, setIdType] = useState('Aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [livePhoto, setLivePhoto] = useState<File | null>(null);
  const [fingerprint, setFingerprint] = useState<File | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const livePhotoRef = useRef<HTMLInputElement>(null);
  const fingerprintRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setPhone('');
      setBookingId('');
      setBookingData(null);
      setError('');
      setSuccess('');
      setIdType('Aadhaar');
      setIdNumber('');
      setFrontImage(null);
      setBackImage(null);
      setLivePhoto(null);
      setFingerprint(null);
      setSignatureData(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Signature Canvas Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignatureData(canvas.toDataURL('image/png'));
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !bookingId.trim()) return;

    try {
      setLoading(true);
      setError('');
      
      const cleanBookingId = bookingId.trim().replace(/^#/, '');
      const bookingRef = doc(db, 'bookings', cleanBookingId);
      const bookingSnap = await getDoc(bookingRef);

      if (!bookingSnap.exists()) {
        setError("Booking ID not found. Please verify your details.");
        setLoading(false);
        return;
      }

      const bData = bookingSnap.data();
      
      const normalizePhone = (p: string) => p ? p.replace(/\\D/g, '') : '';
      const bPhone = normalizePhone(bData.phone);
      const inputPhone = normalizePhone(phone);
      
      // Only verify phone if it exists in the booking document
      // If it exists, compare digits only. Also handle cases where country codes might differ by checking if one ends with the other
      if (bData.phone && bPhone && inputPhone) {
        if (!bPhone.endsWith(inputPhone) && !inputPhone.endsWith(bPhone)) {
          setError("Phone number does not match the booking details.");
          setLoading(false);
          return;
        }
      }

      setBookingData(bData);
      setStep(2);

    } catch (err: any) {
      setError(err.message || 'Failed to verify booking.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageToBase64 = async (file: File | null): Promise<string> => {
    if (!file) return '';
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600;
          const MAX_HEIGHT = 600;
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
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.onerror = (err) => reject(err);
        img.src = event.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!frontImage || !backImage) {
      setError('Please upload the Front and Back of your ID.');
      return;
    }
    if (!idNumber.trim()) {
      setError('Please enter your ID Number.');
      return;
    }
    
    saveSignature();

    try {
      setLoading(true);
      setError('');
      
      // Upload files
      const [
        urlFront, urlBack, urlLive, urlFinger
      ] = await Promise.all([
        handleImageToBase64(frontImage),
        handleImageToBase64(backImage),
        handleImageToBase64(livePhoto),
        handleImageToBase64(fingerprint)
      ]);

      const finalSignature = signatureData || canvasRef.current?.toDataURL('image/png');
      const cleanBookingId = bookingId.trim().replace(/^#/, '');

      // Update User Profile
      await updateDoc(doc(db, 'users', userId), {
        phone: phone,
        bookingId: cleanBookingId,
        hotelId: bookingData.hotelName || 'Unknown Hotel',
        profileCompleted: true,
        updatedAt: serverTimestamp()
      });

      // Prepare documents payload
      const docPayload: any = {
        idType: idType,
        idNumber: idNumber,
        frontImage: urlFront,
        backImage: urlBack,
        signature: finalSignature,
        verified: false,
        updatedAt: serverTimestamp()
      };

      if (urlLive) docPayload.livePhoto = urlLive;
      if (urlFinger) docPayload.fingerprint = urlFinger;

      // Update User Documents
      await setDoc(doc(db, 'userDocuments', userId), docPayload, { merge: true });

      // Update Booking
      await updateDoc(doc(db, 'bookings', cleanBookingId), {
        userId: userId,
        updatedAt: serverTimestamp()
      });

      setSuccess("Booking successfully linked and Identity Verified!");
      
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 2500);

    } catch (err: any) {
      setError(err.message || 'Failed to link booking and upload documents.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className={`relative w-full bg-white rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col ${step === 1 ? 'max-w-[420px] p-8' : 'max-w-3xl max-h-[90vh]'}`}>
        
        {/* Header */}
        <div className={`flex justify-between items-center ${step === 2 ? 'p-6 border-b' : ''}`}>
          {step === 2 ? (
            <h2 className="text-[22px] font-bold text-gray-900 flex items-center gap-2">
              <Camera className="w-6 h-6 text-blue-600" />
              Identity & Biometric Verification
            </h2>
          ) : (
            <div className="w-full">
              <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-2 hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
              <div className="flex justify-center mb-4 mt-2">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <LinkIcon className="h-6 w-6" />
                </div>
              </div>
              <h2 className="text-[24px] font-bold leading-tight text-center text-gray-900 tracking-tight">
                Link Your Booking
              </h2>
              <p className="text-gray-500 mt-2 text-sm text-center">
                Enter your booking details to start the verification process.
              </p>
            </div>
          )}
          
          {step === 2 && (
             <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100 transition-colors">
               <X className="h-5 w-5 text-gray-500" />
             </button>
          )}
        </div>

        {error && <div className="m-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-200">{error}</div>}
        {success && <div className="m-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200">{success}</div>}

        {step === 1 ? (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input 
                type="text" 
                placeholder="e.g. +1234567890"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Booking ID</label>
              <input 
                type="text" 
                placeholder="e.g. BK12345"
                required
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
            
            <button 
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 mt-4 flex items-center justify-center"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify Booking'}
            </button>
          </form>
        ) : (
          <div className="overflow-y-auto p-6 bg-gray-50 flex-1">
            <form onSubmit={handleStep2Submit} className="space-y-8">
              
              {/* ID Documents */}
              <div className="bg-white p-5 rounded-2xl border shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 border-b pb-2">ID Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Type</label>
                    <select 
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors bg-white"
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
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                        <div className="flex flex-col items-center justify-center gap-2 text-green-700">
                          <FileImage className="h-6 w-6 mb-1" />
                          <span className="text-sm font-medium truncate w-full text-center">{frontImage.name}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-gray-500">
                          <Upload className="h-6 w-6 mb-2 text-gray-400" />
                          <span className="text-sm">Click to upload</span>
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
                        <div className="flex flex-col items-center justify-center gap-2 text-green-700">
                          <FileImage className="h-6 w-6 mb-1" />
                          <span className="text-sm font-medium truncate w-full text-center">{backImage.name}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-gray-500">
                          <Upload className="h-6 w-6 mb-2 text-gray-400" />
                          <span className="text-sm">Click to upload</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Biometrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-2xl border shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-gray-500" /> Live Photo
                  </h3>
                  <div 
                    onClick={() => livePhotoRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors flex flex-col items-center ${livePhoto ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}
                  >
                    <input type="file" capture="user" ref={livePhotoRef} onChange={(e) => setLivePhoto(e.target.files?.[0] || null)} accept="image/*" className="hidden" />
                    <Camera className={`w-8 h-8 mb-2 ${livePhoto ? 'text-green-500' : 'text-gray-400'}`} />
                    {livePhoto ? <span className="text-sm font-medium text-green-700">Photo Captured</span> : <span className="text-sm text-gray-500">Take Live Photo</span>}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-gray-500" /> Fingerprint
                  </h3>
                  <div 
                    onClick={() => fingerprintRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors flex flex-col items-center ${fingerprint ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}
                  >
                    <input type="file" ref={fingerprintRef} onChange={(e) => setFingerprint(e.target.files?.[0] || null)} accept="image/*" className="hidden" />
                    <Fingerprint className={`w-8 h-8 mb-2 ${fingerprint ? 'text-green-500' : 'text-gray-400'}`} />
                    {fingerprint ? <span className="text-sm font-medium text-green-700">Fingerprint Scanned</span> : <span className="text-sm text-gray-500">Upload Fingerprint Scan</span>}
                  </div>
                </div>
              </div>

              {/* Signature */}
              <div className="bg-white p-5 rounded-2xl border shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-gray-500" /> Digital Signature
                </h3>
                <div className="border rounded-xl overflow-hidden bg-gray-50 relative">
                  <canvas 
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseOut={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    width={600}
                    height={150}
                    className="w-full cursor-crosshair touch-none"
                    style={{ border: 'none' }}
                  ></canvas>
                  <button type="button" onClick={clearSignature} className="absolute top-2 right-2 text-xs bg-white border px-2 py-1 rounded shadow-sm text-gray-600 hover:bg-gray-50">
                    Clear
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">Please draw your signature inside the box.</p>
              </div>

              <div className="pt-4 pb-2">
                <button 
                  type="submit"
                  disabled={loading || success !== ''}
                  className="w-full rounded-full bg-blue-600 py-3.5 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center text-lg shadow-lg"
                >
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Complete Verification & Link Booking'}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
