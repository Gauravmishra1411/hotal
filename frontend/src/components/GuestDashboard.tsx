import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Check, CheckCircle2, Clock, Loader2, Sparkles, X, Utensils, ChevronRight, MessageSquarePlus } from 'lucide-react';
import type { User } from 'firebase/auth';

interface GuestDashboardProps {
  user: User;
  userData: any;
}

const SERVICE_MENUS: Record<string, { name: string, price: number }[]> = {
  "In-Room Dining": [
    { name: "Continental Breakfast", price: 20 },
    { name: "Classic Burger & Fries", price: 25 },
    { name: "Margherita Pizza", price: 18 },
    { name: "Grilled Salmon", price: 35 },
    { name: "Chocolate Lava Cake", price: 12 }
  ],
  "Spa Appointment": [
    { name: "Swedish Massage (60m)", price: 100 },
    { name: "Deep Tissue (60m)", price: 120 },
    { name: "Hot Stone Therapy (90m)", price: 150 },
    { name: "Radiance Facial", price: 90 }
  ],
  "Laundry Service": [
    { name: "Standard Wash & Fold", price: 15 },
    { name: "Dry Cleaning (Suit)", price: 25 },
    { name: "Express Ironing", price: 8 }
  ]
};

export default function GuestDashboard({ user, userData }: GuestDashboardProps) {
  const [services, setServices] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customRequest, setCustomRequest] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [activeServiceMenu, setActiveServiceMenu] = useState<string | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const fetchBookingAndStartTimer = async () => {
      if (!userData?.bookingId) return;
      try {
        const bookingRef = doc(db, 'bookings', userData.bookingId);
        const bookingSnap = await getDoc(bookingRef);
        if (bookingSnap.exists()) {
          const bookingData = bookingSnap.data();
          const checkOutStr = bookingData.checkOutDate || bookingData.checkOut;
          if (checkOutStr) {
            let coDate = new Date(checkOutStr);
            if (isNaN(coDate.getTime())) {
              const parts = checkOutStr.split(/[\/\-]/);
              if (parts.length === 3) {
                if (parts[0].length === 4) {
                  coDate = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
                } else {
                  coDate = new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]));
                }
              }
            }
            if (!isNaN(coDate.getTime())) {
              coDate.setHours(11, 0, 0, 0); // 11:00 AM Checkout
              const checkOutTimeMs = coDate.getTime();

              const updateTimer = () => {
                const now = new Date().getTime();
                const distance = checkOutTimeMs - now;
                if (distance < 0) {
                  setTimeLeft("Checkout Time Passed");
                  if (interval) clearInterval(interval);
                } else {
                  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                  const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                  setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
                }
              };
              updateTimer();
              interval = setInterval(updateTimer, 1000);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching booking for countdown:", err);
      }
    };

    fetchBookingAndStartTimer();
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [userData?.bookingId]);

  useEffect(() => {
    // Fetch active services
    const qServices = query(collection(db, 'services'));
    const unsubServices = onSnapshot(qServices, (snapshot) => {
      const servicesData: any[] = [];
      snapshot.forEach(doc => {
        servicesData.push({ id: doc.id, ...doc.data() });
      });
      // Filter active on client side, allowing services that don't explicitly have active: false
      setServices(servicesData.filter(s => s.active !== false));
    }, (error) => {
      console.error("Firestore error fetching services:", error);
    });

    // Fetch user's previous requests
    // We remove the user ID filter temporarily if we want to debug, but keep it for normal use
    // Using simple client side filter if index is missing
    const qRequests = query(collection(db, 'serviceRequests'));
    const unsubRequests = onSnapshot(qRequests, (snapshot) => {
      const requestsData: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.userId === user.uid) {
          requestsData.push({ id: doc.id, ...data });
        }
      });
      // Sort descending by time
      requestsData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setRequests(requestsData);
      setLoading(false);
    });

    return () => {
      unsubServices();
      unsubRequests();
    };
  }, [user.uid]);

  const toggleService = (serviceName: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceName)
        ? prev.filter(s => s !== serviceName)
        : [...prev, serviceName]
    );
  };

  const handleServiceClick = (serviceName: string) => {
    if (SERVICE_MENUS[serviceName]) {
      setActiveServiceMenu(serviceName);
    } else {
      toggleService(serviceName);
    }
  };

  const isServiceSelected = (serviceName: string) => {
    if (SERVICE_MENUS[serviceName]) {
      return selectedServices.some(s => s.startsWith(`${serviceName} - `));
    }
    return selectedServices.includes(serviceName);
  };

  const getSelectionCount = (serviceName: string) => {
    if (SERVICE_MENUS[serviceName]) {
      return selectedServices.filter(s => s.startsWith(`${serviceName} - `)).length;
    }
    return selectedServices.includes(serviceName) ? 1 : 0;
  };

  const handleSubmitRequest = async () => {
    if (selectedServices.length === 0 && !customRequest.trim()) return;
    setSubmitting(true);
    try {
      const finalServices = [...selectedServices];
      if (customRequest.trim()) {
        finalServices.push(`Custom Request - ${customRequest.trim()}`);
      }

      await addDoc(collection(db, 'serviceRequests'), {
        userId: user.uid,
        guestName: userData?.name || 'Guest',
        bookingId: userData?.bookingId || 'Unknown',
        hotelId: userData?.hotelId || 'Unknown',
        services: finalServices,
        status: 'Pending',
        createdAt: serverTimestamp()
      });

      // Notify Admin
      await addDoc(collection(db, 'notifications'), {
        title: 'New Service Request',
        message: `${userData?.name || 'Guest'} (Booking: ${userData?.bookingId}) requested: ${finalServices.join(', ')}`,
        isRead: false,
        createdAt: serverTimestamp(),
        type: 'service_request'
      });

      setSelectedServices([]);
      setCustomRequest('');
      setActiveServiceMenu(null);
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 pt-28 pb-20 font-sans min-h-screen">
      <div className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#00381A] mb-4">
          Welcome, {userData?.name?.split(' ')[0] || 'Guest'}!
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Enhance your stay with our premium hotel services. Select what you need below and we'll take care of the rest.
        </p>
        
        {timeLeft && (
          <div className="mt-6 inline-flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 px-6 py-3 rounded-2xl font-bold border border-green-200/60 shadow-sm animate-fade-in-up">
            <div className="bg-green-100 p-2 rounded-xl">
              <Clock className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <span className="text-sm font-medium text-green-600/80 block leading-tight">Time Remaining in Your Stay</span>
              <span className="text-lg tracking-tight tabular-nums">{timeLeft}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Services Selection */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-green-600" />
              Available Services
            </h2>

            {services.length === 0 ? (
              <div className="text-gray-500 italic py-4">No services available at the moment.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {services.map(service => {
                  const isSelected = isServiceSelected(service.name);
                  const selectionCount = getSelectionCount(service.name);
                  const hasMenu = !!SERVICE_MENUS[service.name];

                  return (
                    <div
                      key={service.id}
                      onClick={() => handleServiceClick(service.name)}
                      className={`relative overflow-hidden cursor-pointer rounded-2xl p-4 border-2 transition-all duration-300 ${isSelected
                        ? 'border-green-600 bg-green-50 shadow-md shadow-green-100'
                        : 'border-gray-200 hover:border-green-400 hover:shadow-md'
                        } flex justify-between items-center`}
                    >
                      {isSelected && !hasMenu && (
                        <div className="absolute top-0 right-0 bg-green-600 rounded-bl-xl p-1.5">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                      
                      <div>
                        <h3 className={`text-lg font-bold ${isSelected ? 'text-green-800' : 'text-gray-900'} flex items-center gap-2`}>
                          {service.name}
                          {selectionCount > 0 && hasMenu && (
                            <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                              {selectionCount}
                            </span>
                          )}
                        </h3>
                        {service.price > 0 && !hasMenu && (
                          <p className={`text-sm font-medium mt-1 ${isSelected ? 'text-green-600' : 'text-gray-500'}`}>
                            ${service.price}
                          </p>
                        )}
                        {hasMenu && (
                          <p className={`text-sm font-medium mt-1 ${isSelected ? 'text-green-600' : 'text-gray-500'}`}>
                            View Options
                          </p>
                        )}
                      </div>
                      
                      {hasMenu && (
                        <ChevronRight className={`h-5 w-5 ${isSelected ? 'text-green-600' : 'text-gray-400'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Custom Request Input */}
            <div className="mt-6 p-5 bg-gray-50 rounded-2xl border border-gray-100">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                <MessageSquarePlus className="h-4 w-4 text-green-600" />
                Have a specific request?
              </label>
              <textarea
                value={customRequest}
                onChange={(e) => setCustomRequest(e.target.value)}
                placeholder="E.g., Need extra pillows, requesting a late checkout..."
                className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-green-500 transition-all resize-none shadow-sm"
                rows={2}
              ></textarea>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={handleSubmitRequest}
                disabled={(selectedServices.length === 0 && !customRequest.trim()) || submitting}
                className="w-full sm:w-auto px-8 py-4 bg-[#00381A] text-white font-bold rounded-full hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 duration-300"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Request {(selectedServices.length > 0 || customRequest.trim()) ? 'Items' : 'Services'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Requests Status */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 h-full">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              Your Requests
            </h2>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                You haven't requested any services yet.
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map(request => (
                  <div key={request.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        {request.createdAt?.toDate ? request.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 mt-3">
                      {request.services.map((service: string, idx: number) => {
                        const isSubItem = service.includes(" - ");
                        const [mainService, subItem] = isSubItem ? service.split(" - ") : [service, null];
                        
                        return (
                          <div key={idx} className={`p-2 rounded-lg border ${mainService === 'Custom Request' ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-200'}`}>
                            <span className="text-sm font-bold text-gray-800">{isSubItem ? subItem : mainService}</span>
                            {isSubItem && mainService !== 'Custom Request' && <span className="block text-xs text-gray-500">{mainService}</span>}
                            {mainService === 'Custom Request' && <span className="block text-xs text-blue-500">Custom Request</span>}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Display ETA and Total Price if set by Admin */}
                    {(request.totalPrice !== undefined || request.eta) && (
                      <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
                        {request.eta ? (
                          <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium">
                            <Clock className="w-4 h-4 text-gray-400" /> 
                            <span>ETA: <span className="text-gray-900">{request.eta}</span></span>
                          </div>
                        ) : <div />}
                        
                        {request.totalPrice !== undefined && (
                          <div className="text-sm font-bold text-gray-900">
                            Total: <span className="text-green-700">${request.totalPrice}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Service Menu Modal */}
      {activeServiceMenu && SERVICE_MENUS[activeServiceMenu] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setActiveServiceMenu(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Utensils className="h-6 w-6 text-green-600" />
              {activeServiceMenu} Options
            </h3>
            
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {SERVICE_MENUS[activeServiceMenu].map((item, idx) => {
                const itemKey = `${activeServiceMenu} - ${item.name}`;
                const isSelected = selectedServices.includes(itemKey);
                
                return (
                  <div 
                    key={idx}
                    onClick={() => toggleService(itemKey)}
                    className={`flex justify-between items-center p-4 rounded-xl cursor-pointer border-2 transition-all ${
                      isSelected ? 'border-green-600 bg-green-50 shadow-sm' : 'border-gray-100 hover:border-green-300'
                    }`}
                  >
                    <div>
                      <div className={`font-bold ${isSelected ? 'text-green-800' : 'text-gray-900'}`}>
                        {item.name}
                      </div>
                      <div className={`text-sm ${isSelected ? 'text-green-600' : 'text-gray-500'}`}>
                        ${item.price}
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8">
              <button 
                onClick={() => setActiveServiceMenu(null)}
                className="w-full py-4 bg-[#00381A] text-white font-bold rounded-full hover:bg-green-800 transition-colors shadow-lg hover:shadow-xl duration-300"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

