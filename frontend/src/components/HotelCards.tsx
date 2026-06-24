import { useState, useEffect, useRef } from 'react';
import { type User } from 'firebase/auth';
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { MoonLoader, PacmanLoader } from 'react-spinners';
import { 
    Building, MapPin, Loader2, X, Star, Users, 
    CalendarDays, Wifi, Car, Coffee, 
    Utensils, Dumbbell, Waves, Wind, PawPrint,
    Phone, Mail, Globe, Info, ShieldCheck,
    Tv, Bed, LayoutDashboard, Tag
} from 'lucide-react';

// Helpers to render the different exhaustive lists based on boolean flags
const renderPropertyAmenities = (hotel: any) => {
    const list = [
        { key: 'parkingAvailable', label: 'Free parking', icon: Car },
        { key: 'wifiAvailable', label: 'Free High Speed Internet (WiFi)', icon: Wifi },
        { key: 'gym', label: 'Fitness Centre with Gym / Workout Room', icon: Dumbbell },
        { key: 'swimmingPool', label: 'Pool', icon: Waves },
        { key: 'barLounge', label: 'Bar / lounge', icon: Coffee },
        { key: 'waterParkOffsite', label: 'Water park offsite', icon: Waves },
        { key: 'kidsStayFree', label: 'Kids stay free', icon: Users },
        { key: 'babysitting', label: 'Babysitting', icon: Users },
        { key: 'petFriendly', label: 'Pet Friendly', icon: PawPrint },
    ];
    return list.filter(item => hotel[item.key]);
};

const renderRoomFeatures = (hotel: any) => {
    const list = [
        { key: 'allergyFreeRoom', label: 'Allergy-free room', icon: ShieldCheck },
        { key: 'airConditioningRoom', label: 'Air conditioning', icon: Wind },
        { key: 'diningArea', label: 'Dining area', icon: Utensils },
        { key: 'cableSatelliteTV', label: 'Cable / satellite TV', icon: Tv },
        { key: 'blackoutCurtains', label: 'Blackout curtains', icon: LayoutDashboard },
        { key: 'desk', label: 'Desk', icon: LayoutDashboard },
        { key: 'coffeeTeaMaker', label: 'Coffee / tea maker', icon: Coffee },
        { key: 'bidet', label: 'Bidet', icon: LayoutDashboard },
    ];
    return list.filter(item => hotel[item.key]);
};

const renderRoomTypes = (hotel: any) => {
    const list = [
        { key: 'cityView', label: 'City view', icon: Building },
        { key: 'bridalSuite', label: 'Bridal suite', icon: Bed },
        { key: 'familyRooms', label: 'Family rooms', icon: Users },
        { key: 'poolView', label: 'Pool view', icon: Waves },
        { key: 'suites', label: 'Suites', icon: Bed },
        { key: 'smokingRooms', label: 'Smoking rooms available', icon: Wind },
    ];
    return list.filter(item => hotel[item.key]);
};

const RatingBar = ({ label, score }: { label: string, score: number }) => {
    const width = `${(score / 5) * 100}%`;
    return (
        <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-24">{label}</span>
            <div className="flex-1 mx-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-600 rounded-full" style={{ width }}></div>
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white w-6 text-right">{Number(score).toFixed(1)}</span>
        </div>
    );
};

export default function HotelCards({ user, onOpenLogin }: { user: User | null; onOpenLogin: () => void }) {
    const [hotels, setHotels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedHotel, setSelectedHotel] = useState<any | null>(null);

    // Booking state
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [rooms, setRooms] = useState(1);
    const [guests, setGuests] = useState(2);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Credit Card');
    const [paymentProcessing, setPaymentProcessing] = useState(false);

    // Coupon states
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [couponError, setCouponError] = useState('');
    const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);

    // Toast state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    // Loader state
    const [isCouponLoading, setIsCouponLoading] = useState(false);
    const [isPaymentLoading, setIsPaymentLoading] = useState(false);
    const [paymentSuccessDetails, setPaymentSuccessDetails] = useState<any>(null);
    const paymentModalRef = useRef<HTMLDivElement>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 4000);
    };

    useEffect(() => {
        if (!showPaymentModal) return;
        const fetchAvailableCoupons = async () => {
            try {
                const couponsRef = collection(db, 'coupons');
                const q = query(couponsRef, where('status', '==', 'active'));
                const querySnapshot = await getDocs(q);
                const fetchedCoupons = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data() as any
                }));
                setAvailableCoupons(fetchedCoupons);
            } catch (err) {
                console.error("Error fetching coupons:", err);
            }
        };
        fetchAvailableCoupons();
    }, [showPaymentModal]);

    const handleApplyCouponCode = async (codeToApply: string) => {
        setCouponError('');
        const trimmedCode = codeToApply.trim().toUpperCase();
        if (!trimmedCode) {
            setCouponError('Please enter a coupon code.');
            return;
        }

        // Trigger loading state
        setIsCouponLoading(true);

        // Simulate 3 seconds delay
        setTimeout(async () => {
            try {
                const checkInDate = new Date(checkIn);
                const checkOutDate = new Date(checkOut);
                const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
                const originalPrice = Number(selectedHotel.pricePerNight) * rooms * diffDays;

                const couponsRef = collection(db, 'coupons');
                const q = query(couponsRef, where('code', '==', trimmedCode));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    setCouponError('Invalid coupon code.');
                    setAppliedCoupon(null);
                    setCouponDiscount(0);
                    showToast('Invalid coupon code.', 'error');
                    setIsCouponLoading(false);
                    return;
                }

                const couponData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() as any };

                if (couponData.status !== 'active') {
                    setCouponError('This coupon is disabled.');
                    setAppliedCoupon(null);
                    setCouponDiscount(0);
                    showToast('This coupon is disabled.', 'error');
                    setIsCouponLoading(false);
                    return;
                }

                if (couponData.minBookingAmount && originalPrice < Number(couponData.minBookingAmount)) {
                    setCouponError(`Min booking amount for this coupon is ₹${couponData.minBookingAmount}.`);
                    setAppliedCoupon(null);
                    setCouponDiscount(0);
                    showToast(`Min booking amount is ₹${couponData.minBookingAmount}.`, 'error');
                    setIsCouponLoading(false);
                    return;
                }

                let discount = 0;
                if (couponData.discountType === 'percentage') {
                    discount = (originalPrice * Number(couponData.discountValue)) / 100;
                } else if (couponData.discountType === 'fixed') {
                    discount = Number(couponData.discountValue);
                }

                if (discount > originalPrice) {
                    discount = originalPrice;
                }

                setAppliedCoupon(couponData);
                setCouponDiscount(discount);
                setCouponCode(trimmedCode);
                setCouponError('');
                showToast(`Coupon "${trimmedCode}" applied successfully!`, 'success');
                setTimeout(() => {
                    if (paymentModalRef.current) {
                        paymentModalRef.current.scrollTo({
                            top: paymentModalRef.current.scrollHeight,
                            behavior: 'smooth'
                        });
                    }
                }, 100);
            } catch (err) {
                console.error("Error applying coupon:", err);
                setCouponError('Failed to apply coupon.');
                showToast('Failed to apply coupon.', 'error');
            } finally {
                setIsCouponLoading(false);
            }
        }, 3000);
    };

    const handleApplyCoupon = () => {
        handleApplyCouponCode(couponCode);
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setCouponCode('');
        setCouponError('');
        showToast('Coupon removed successfully.', 'success');
    };

    useEffect(() => {
        const fetchHotels = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'hotels'));
                const fetchedHotels = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setHotels(fetchedHotels);
            } catch (err) {
                console.error("Error fetching hotels:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHotels();
    }, []);

    const handleDetails = (hotel: any) => {
        if (!user) {
            onOpenLogin();
            return;
        }
        setSelectedHotel(hotel);
    };

    const handleBookNow = () => {
        if (!user) {
            onOpenLogin();
            return;
        }

        if (!checkIn || !checkOut) {
            alert("Please select check-in and check-out dates.");
            return;
        }

        if (selectedHotel.availableRooms !== undefined && selectedHotel.availableRooms < rooms) {
            alert(`Sorry, only ${selectedHotel.availableRooms} rooms are available.`);
            return;
        }

        setShowPaymentModal(true);
    };

    const processPayment = async () => {
        try {
            setPaymentProcessing(true);
            setIsPaymentLoading(true);
            
            // 1. Calculate total price
            const checkInDate = new Date(checkIn);
            const checkOutDate = new Date(checkOut);
            const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // at least 1 day
            const originalPrice = Number(selectedHotel.pricePerNight) * rooms * diffDays;
            const discountAmount = appliedCoupon ? couponDiscount : 0;
            const finalPrice = originalPrice - discountAmount;

            // Wait 6 seconds to simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 6000));

            // 2. Save booking
            const bookingRef = await addDoc(collection(db, 'bookings'), {
                userId: user?.uid,
                userName: user?.displayName || user?.email || 'Guest',
                hotelId: selectedHotel.id,
                hotelName: selectedHotel.hotelName,
                checkInDate: checkIn,
                checkOutDate: checkOut,
                rooms,
                guests,
                originalAmount: originalPrice,
                couponCode: appliedCoupon ? appliedCoupon.code : null,
                discountAmount: discountAmount,
                totalAmount: finalPrice,
                bookingStatus: 'Confirmed',
                paymentStatus: 'Paid',
                createdAt: serverTimestamp()
            });

            // 3. Save payment
            await addDoc(collection(db, 'payments'), {
                bookingId: bookingRef.id,
                userId: user?.uid,
                amount: finalPrice,
                paymentMethod,
                transactionId: 'TXN' + Math.random().toString().slice(2, 11).toUpperCase(),
                paymentStatus: 'Successful',
                paidAt: serverTimestamp()
            });

            // 4. Save notification
            await addDoc(collection(db, 'notifications'), {
                title: 'New Hotel Booking',
                message: `${user?.displayName || user?.email || 'A user'} booked ${selectedHotel.hotelName}`,
                bookingId: bookingRef.id,
                userId: user?.uid,
                isRead: false,
                createdAt: serverTimestamp()
            });

            // 5. Decrement available rooms
            if (selectedHotel.availableRooms !== undefined) {
                const currentAvailable = Number(selectedHotel.availableRooms);
                if (!isNaN(currentAvailable)) {
                    const hotelRef = doc(db, 'hotels', selectedHotel.id);
                    await updateDoc(hotelRef, {
                        availableRooms: currentAvailable - rooms
                    });
                    
                    // Update local state to reflect the change immediately
                    setHotels(prevHotels => prevHotels.map(h => 
                        h.id === selectedHotel.id ? { ...h, availableRooms: currentAvailable - rooms } : h
                    ));
                }
            }

            // Set success details to trigger Success View
            setPaymentSuccessDetails({
                bookingId: bookingRef.id,
                finalPrice,
                hotelName: selectedHotel.hotelName
            });

        } catch (error: any) {
            console.error("Booking failed", error);
            alert("Booking failed: " + (error?.message || 'Unknown error occurred'));
        } finally {
            setPaymentProcessing(false);
            setIsPaymentLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-green-600 mb-4" />
                <p className="text-gray-500 font-medium">Loading premium properties...</p>
            </div>
        );
    }

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[99999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border transition-all animate-slide-in-right ${
                    toast.type === 'success' 
                        ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/90 dark:border-green-800 dark:text-green-200' 
                        : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/90 dark:border-red-800 dark:text-red-200'
                }`}>
                    <span className="w-2.5 h-2.5 rounded-full animate-pulse bg-current"></span>
                    <span className="text-sm font-semibold tracking-wide">{toast.message}</span>
                </div>
            )}
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Featured Hotels</h2>
            
            {hotels.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                    <Building className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium text-lg">No properties available yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {hotels.map((hotel) => (
                        <div key={hotel.id} className="w-full h-full flex flex-col rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800 hover:shadow-xl transition-shadow border border-transparent dark:border-gray-700">
                            {hotel.thumbnail ? (
                                <img src={hotel.thumbnail} alt={hotel.hotelName} className="w-full h-56 object-cover" />
                            ) : (
                                <div className="w-full h-56 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                    <Building className="h-12 w-12 text-gray-400" />
                                </div>
                            )}
                            <div className="p-4 flex flex-col flex-grow">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 line-clamp-1">{hotel.hotelName}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                    <MapPin className="h-3 w-3" />
                                    {hotel.city}, {hotel.country}
                                </p>
                                <div className="flex items-center mt-2">
                                    <Star className="w-4 h-4 text-green-600 mr-1 fill-green-600" />
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{hotel.averageRating || hotel.starRating || 'New'}</span>
                                    {hotel.totalReviews > 0 && <span className="text-xs text-gray-500 ml-1">({hotel.totalReviews})</span>}
                                </div>
                                <div className="mt-auto">
                                    {hotel.availableRooms !== undefined && (
                                        <p className={`text-sm font-bold ${hotel.availableRooms > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                                            {hotel.availableRooms > 0 ? `${hotel.availableRooms} room(s) available` : 'Sold Out'}
                                        </p>
                                    )}
                                    <p className="mt-2 text-lg font-black text-gray-900 dark:text-white">
                                        {hotel.currency === 'USD' ? '$' : hotel.currency === 'EUR' ? '€' : '₹'}{hotel.pricePerNight} 
                                    </p>
                                    <button onClick={() => handleDetails(hotel)} className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors">
                                        View Deal
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* TRIP ADVISOR STYLE DETAILS MODAL OVERLAY */}
            {selectedHotel && (
                <div className="fixed inset-0 z-[9999] bg-white dark:bg-gray-900 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    
                    {/* Top Navigation Bar */}
                    <div className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-none">{selectedHotel.hotelName}</h1>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1 font-bold text-green-700 dark:text-green-500">
                                    <Star className="w-4 h-4 fill-green-700 dark:fill-green-500" /> 
                                    {selectedHotel.averageRating || selectedHotel.starRating} Very Good
                                </span>
                                {selectedHotel.totalReviews > 0 && <span className="underline cursor-pointer hover:text-gray-900">({selectedHotel.totalReviews.toLocaleString()} reviews)</span>}
                                {selectedHotel.rankingText && <span className="text-gray-500">· {selectedHotel.rankingText}</span>}
                            </div>
                        </div>
                        <button onClick={() => setSelectedHotel(null)} className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                            <X className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                        </button>
                    </div>

                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
                        
                        {/* Links Row */}
                        <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-gray-700 dark:text-gray-300">
                            {selectedHotel.website && (
                                <a href={selectedHotel.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-green-600 transition-colors">
                                    <Globe className="w-4 h-4" /> Visit hotel website
                                </a>
                            )}
                            {selectedHotel.phone && (
                                <span className="flex items-center gap-2 cursor-pointer hover:text-green-600 transition-colors">
                                    <Phone className="w-4 h-4" /> {selectedHotel.phone}
                                </span>
                            )}
                            {selectedHotel.email && (
                                <span className="flex items-center gap-2 cursor-pointer hover:text-green-600 transition-colors">
                                    <Mail className="w-4 h-4" /> E-mail hotel
                                </span>
                            )}
                            <span className="flex items-center gap-2 cursor-pointer hover:text-green-600 transition-colors">
                                <MapPin className="w-4 h-4" /> View location
                            </span>
                        </div>

                        {/* Image Grid Hero */}
                        <div className="flex flex-col md:flex-row gap-2 h-auto md:h-[400px]">
                            {/* Main Image */}
                            <div className="flex-1 rounded-l-xl overflow-hidden relative">
                                {selectedHotel.thumbnail ? (
                                    <img src={selectedHotel.thumbnail} alt="Main view" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                                        <Building className="h-16 w-16 text-gray-400" />
                                    </div>
                                )}
                            </div>
                            
                            {/* Side Images (Gallery) */}
                            {selectedHotel.galleryImages && selectedHotel.galleryImages.length > 0 && (
                                <div className="flex md:flex-col gap-2 w-full md:w-1/3">
                                    {selectedHotel.galleryImages.slice(0, 2).map((img: string, index: number) => (
                                        <div key={index} className={`flex-1 overflow-hidden relative ${index === 0 ? 'rounded-tr-xl' : 'rounded-br-xl'}`}>
                                            <img src={img} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                                            <div className="absolute bottom-2 left-2 text-white font-bold drop-shadow-md text-sm">
                                                {index === 0 ? 'Traveller' : 'Room/Suite'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* View Prices & Deals Section */}
                        <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-6 bg-gray-50 dark:bg-gray-800/30">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">View prices for your travel dates</h3>
                            
                            <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 p-4 rounded-xl flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2 font-medium">
                                    <ShieldCheck className="w-5 h-5" /> Rewards member rate available
                                </div>
                                <span className="underline cursor-pointer text-sm font-bold">Log in to view</span>
                            </div>

                            <div className="flex flex-col md:flex-row gap-4 mb-6">
                                <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-3 flex items-center gap-3">
                                    <CalendarDays className="w-5 h-5 text-gray-400" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500">Check In</p>
                                        <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="w-full bg-transparent font-semibold text-gray-900 dark:text-white outline-none" />
                                    </div>
                                </div>
                                <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-3 flex items-center gap-3">
                                    <CalendarDays className="w-5 h-5 text-gray-400" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500">Check Out</p>
                                        <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="w-full bg-transparent font-semibold text-gray-900 dark:text-white outline-none" />
                                    </div>
                                </div>
                                <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-3 flex items-center gap-3">
                                    <Users className="w-5 h-5 text-gray-400" />
                                    <div className="flex-1 flex gap-2">
                                        <div className="w-1/2">
                                            <p className="text-xs text-gray-500">Rooms</p>
                                            <input type="number" min="1" value={rooms} onChange={e => setRooms(Number(e.target.value))} className="w-full bg-transparent font-semibold text-gray-900 dark:text-white outline-none" />
                                        </div>
                                        <div className="w-1/2">
                                            <p className="text-xs text-gray-500">Guests</p>
                                            <input type="number" min="1" value={guests} onChange={e => setGuests(Number(e.target.value))} className="w-full bg-transparent font-semibold text-gray-900 dark:text-white outline-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Deals List */}
                            <div className="space-y-4">
                                {/* Official Deal */}
                                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 flex flex-wrap items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="font-black text-xl text-gray-800 dark:text-gray-200 uppercase tracking-widest">{selectedHotel.hotelName.split(' ')[0]}</div>
                                        <span className="hidden md:flex items-center gap-1 text-sm text-gray-500"><Tag className="w-4 h-4"/> Members save up to 15% Extra</span>
                                    </div>
                                    <div className="flex items-center gap-6 mt-4 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                                        <div className="text-right">
                                            {selectedHotel.availableRooms !== undefined && (
                                                <p className={`text-xs font-bold mb-1 ${selectedHotel.availableRooms > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                                                    {selectedHotel.availableRooms > 0 ? `Only ${selectedHotel.availableRooms} room(s) left!` : 'Sold Out'}
                                                </p>
                                            )}
                                            <div className="text-2xl font-black text-gray-900 dark:text-white leading-none">
                                                {selectedHotel.currency === 'USD' ? '$' : selectedHotel.currency === 'EUR' ? '€' : '₹'}{selectedHotel.pricePerNight}
                                            </div>
                                        </div>
                                        <button disabled={showPaymentModal || Number(selectedHotel.availableRooms) === 0} onClick={handleBookNow} className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-full transition-colors shadow-lg shadow-green-500/30">
                                            {Number(selectedHotel.availableRooms) === 0 ? 'Sold Out' : 'Book Now'}
                                        </button>
                                    </div>
                                </div>

                                {/* Generated Partner Deal 1 */}
                                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 flex flex-wrap items-center justify-between shadow-sm">
                                    <div className="font-bold text-xl text-blue-800 dark:text-blue-400">Booking.com</div>
                                    <div className="flex items-center gap-6 mt-4 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {selectedHotel.currency === 'USD' ? '$' : selectedHotel.currency === 'EUR' ? '€' : '₹'}{selectedHotel.pricePerNight}
                                        </div>
                                        <button disabled={showPaymentModal} onClick={handleBookNow} className="bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-900 border-2 border-gray-900 font-bold py-2.5 px-8 rounded-full transition-colors">
                                            Book Now
                                        </button>
                                    </div>
                                </div>

                                {/* Generated Partner Deal 2 (Slightly cheaper) */}
                                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 flex flex-wrap items-center justify-between shadow-sm">
                                    <div className="font-bold text-xl text-blue-500">Skyscanner</div>
                                    <div className="flex items-center gap-6 mt-4 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                                        <div className="text-right">
                                            <p className="text-sm text-red-500 line-through">
                                                {selectedHotel.currency === 'USD' ? '$' : selectedHotel.currency === 'EUR' ? '€' : '₹'}{selectedHotel.pricePerNight}
                                            </p>
                                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                                {selectedHotel.currency === 'USD' ? '$' : selectedHotel.currency === 'EUR' ? '€' : '₹'}{Math.floor(Number(selectedHotel.pricePerNight) * 0.9)}
                                            </div>
                                        </div>
                                        <button disabled={showPaymentModal} onClick={handleBookNow} className="bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-900 border-2 border-gray-900 font-bold py-2.5 px-8 rounded-full transition-colors">
                                            Book Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* About & Ratings & Features */}
                        <div className="flex flex-col lg:flex-row gap-16 pb-20 border-t border-gray-200 dark:border-gray-800 pt-12">
                            
                            {/* Left Column: Ratings & Description */}
                            <div className="w-full lg:w-1/3">
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">About</h2>
                                
                                <div className="flex items-end gap-3 mb-6">
                                    <span className="text-6xl font-black text-gray-900 dark:text-white leading-none">{selectedHotel.averageRating || selectedHotel.starRating}</span>
                                    <div className="pb-1">
                                        <p className="font-bold text-gray-700 dark:text-gray-300 text-lg">Very Good</p>
                                        <p className="text-sm text-green-700 dark:text-green-500 font-medium underline cursor-pointer">{selectedHotel.totalReviews} reviews</p>
                                    </div>
                                </div>

                                <div className="space-y-1 mb-8">
                                    <RatingLocation label="Location" score={selectedHotel.ratingLocation || 4.6} />
                                    <RatingLocation label="Rooms" score={selectedHotel.ratingRooms || 4.5} />
                                    <RatingLocation label="Value" score={selectedHotel.ratingValue || 4.4} />
                                    <RatingLocation label="Cleanliness" score={selectedHotel.ratingCleanliness || 4.7} />
                                    <RatingLocation label="Service" score={selectedHotel.ratingService || 4.7} />
                                    <RatingLocation label="Sleep Quality" score={selectedHotel.ratingSleepQuality || 4.6} />
                                </div>

                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-base">
                                    {selectedHotel.description || selectedHotel.shortDescription || "Welcome to our beautiful property. Experience luxury and comfort tailored perfectly for your stay."}
                                </p>
                            </div>

                            {/* Right Column: Exhaustive Amenities Lists */}
                            <div className="w-full lg:w-2/3 space-y-12">
                                
                                {/* Property Amenities */}
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Property amenities</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                                        {renderPropertyAmenities(selectedHotel).map(item => (
                                            <div key={item.key} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                                <item.icon className="w-5 h-5 text-gray-500" />
                                                <span>{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Room Features */}
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Room features</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                                        {renderRoomFeatures(selectedHotel).map(item => (
                                            <div key={item.key} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                                <item.icon className="w-5 h-5 text-gray-500" />
                                                <span>{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Room Types */}
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Room types</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                                        {renderRoomTypes(selectedHotel).map(item => (
                                            <div key={item.key} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                                <item.icon className="w-5 h-5 text-gray-500" />
                                                <span>{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Good to know */}
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Good to know</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wide flex items-center gap-1">Hotel Class <Info className="w-4 h-4 text-gray-400"/></p>
                                            <div className="flex items-center gap-1">
                                                {[...Array(selectedHotel.hotelClass || 5)].map((_, i) => (
                                                    <Star key={i} className="w-4 h-4 fill-gray-800 dark:fill-gray-200 text-gray-800 dark:text-gray-200" />
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wide">Hotel Style</p>
                                            <p className="text-gray-600 dark:text-gray-400">{selectedHotel.hotelStyle || 'Modern, Classic'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wide">Languages Spoken</p>
                                            <p className="text-gray-600 dark:text-gray-400">{selectedHotel.languagesSpoken || 'English'}</p>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            )}

             {/* Payment Modal */}
             {showPaymentModal && selectedHotel && (
                 <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
                     {/* Pacman Loader Overlay */}
                     {isPaymentLoading && (
                         <div className="fixed inset-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-[20000] flex flex-col items-center justify-center gap-6 animate-in fade-in duration-200">
                             <div className="pl-8">
                                 <PacmanLoader color="#16a34a" size={25} />
                             </div>
                             <div className="text-center mt-4 px-4">
                                 <p className="text-base font-bold text-gray-900 dark:text-white">Processing Payment...</p>
                                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 animate-pulse font-medium">Please do not refresh or close this window.</p>
                             </div>
                         </div>
                     )}

                     <div ref={paymentModalRef} className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-none relative">

                         {paymentSuccessDetails ? (
                             <div className="flex flex-col items-center justify-center text-center py-6 animate-in fade-in zoom-in-95 duration-300">
                                 <div className="w-20 h-20 bg-green-50 dark:bg-green-950/30 rounded-full flex items-center justify-center mb-6 border border-green-200 dark:border-green-800">
                                     <ShieldCheck className="w-12 h-12 text-green-600 dark:text-green-400" />
                                 </div>
                                 
                                 <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Successful!</h3>
                                 <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mb-6">
                                     Your booking at <span className="font-semibold text-gray-800 dark:text-gray-200">{paymentSuccessDetails.hotelName}</span> has been confirmed.
                                 </p>
                                 
                                 <div className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 mb-8 text-left space-y-2.5 text-xs text-gray-600 dark:text-gray-300">
                                     <div className="flex justify-between">
                                         <span className="font-medium">Booking ID:</span>
                                         <span className="font-mono text-gray-950 dark:text-white select-all">{paymentSuccessDetails.bookingId}</span>
                                     </div>
                                     <div className="flex justify-between">
                                         <span className="font-medium">Total Paid:</span>
                                         <span className="font-bold text-green-600 dark:text-green-400 text-sm">
                                             {selectedHotel.currency === 'USD' ? '$' : selectedHotel.currency === 'EUR' ? '€' : '₹'}
                                             {paymentSuccessDetails.finalPrice}
                                         </span>
                                     </div>
                                     <div className="flex justify-between">
                                         <span className="font-medium">Check-In:</span>
                                         <span className="font-semibold text-gray-800 dark:text-gray-200">{checkIn}</span>
                                     </div>
                                     <div className="flex justify-between">
                                         <span className="font-medium">Check-Out:</span>
                                         <span className="font-semibold text-gray-800 dark:text-gray-200">{checkOut}</span>
                                     </div>
                                 </div>
                                 
                                 <button 
                                     onClick={() => {
                                         setShowPaymentModal(false);
                                         setSelectedHotel(null);
                                         setCheckIn('');
                                         setCheckOut('');
                                         setRooms(1);
                                         setGuests(2);
                                         setCouponCode('');
                                         setAppliedCoupon(null);
                                         setCouponDiscount(0);
                                         setCouponError('');
                                         setPaymentSuccessDetails(null);
                                     }}
                                     className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-4 rounded-xl transition-colors shadow-lg shadow-green-600/30"
                                 >
                                     Done
                                 </button>
                             </div>
                         ) : (
                             <>
                                 <div className="flex justify-between items-center mb-6">
                                     <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Complete Payment</h2>
                                     <button onClick={() => { setShowPaymentModal(false); setCouponCode(''); setAppliedCoupon(null); setCouponDiscount(0); setCouponError(''); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                         <X className="w-6 h-6" />
                                     </button>
                                 </div>
                                 
                                 <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                                     <h3 className="font-semibold text-gray-800 dark:text-gray-200">{selectedHotel.hotelName}</h3>
                                     <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{checkIn} to {checkOut}</p>
                                     <p className="text-sm text-gray-500 dark:text-gray-400">{rooms} Room(s), {guests} Guest(s)</p>
                                     {appliedCoupon && (
                                         <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-sm text-gray-500">
                                             <span>Original Price</span>
                                             <span className="line-through">
                                                 {selectedHotel.currency === 'USD' ? '$' : selectedHotel.currency === 'EUR' ? '€' : '₹'}
                                                 {Number(selectedHotel.pricePerNight) * rooms * (Math.ceil(Math.abs(new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)) || 1)}
                                             </span>
                                         </div>
                                     )}

                                     {appliedCoupon && (
                                         <div className="flex justify-between items-center text-sm text-red-500 mt-1">
                                             <span>Coupon Discount ({appliedCoupon.code})</span>
                                             <span>
                                                 -{selectedHotel.currency === 'USD' ? '$' : selectedHotel.currency === 'EUR' ? '€' : '₹'}
                                                 {couponDiscount}
                                             </span>
                                         </div>
                                     )}

                                     <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                         <span className="font-medium text-gray-600 dark:text-gray-300">Total Amount</span>
                                         <span className="text-xl font-bold text-green-600">
                                             {selectedHotel.currency === 'USD' ? '$' : selectedHotel.currency === 'EUR' ? '€' : '₹'}
                                             {Number(selectedHotel.pricePerNight) * rooms * (Math.ceil(Math.abs(new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)) || 1) - (appliedCoupon ? couponDiscount : 0)}
                                         </span>
                                     </div>
                                 </div>

                                 {/* Coupon Form Input */}
                                 <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-2xl relative overflow-hidden">
                                     {/* Glassmorphic Loader Overlay */}
                                     {isCouponLoading && (
                                         <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-2">
                                             <MoonLoader size={24} color="#16a34a" />
                                             <span className="text-xs font-semibold text-green-700 dark:text-green-400 animate-pulse">Verifying coupon...</span>
                                         </div>
                                     )}
                                     
                                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Have a Coupon?</label>
                                     <div className="flex gap-2">
                                         <input 
                                             type="text" 
                                             value={couponCode} 
                                             onChange={(e) => setCouponCode(e.target.value)} 
                                             placeholder="e.g. WELCOME10" 
                                             disabled={isCouponLoading || appliedCoupon !== null}
                                             className="flex-1 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm outline-none uppercase bg-transparent text-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                         />
                                         <button 
                                             type="button" 
                                             onClick={handleApplyCoupon} 
                                             disabled={isCouponLoading || appliedCoupon !== null}
                                             className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:dark:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all"
                                         >
                                             Apply
                                         </button>
                                     </div>
                                     {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
                                     {appliedCoupon && (
                                         <div className="mt-2 flex items-center justify-between">
                                             <p className="text-green-600 text-xs mt-1 font-medium">Coupon "{appliedCoupon.code}" applied successfully!</p>
                                             <button 
                                                 type="button"
                                                 onClick={handleRemoveCoupon}
                                                 className="text-xs text-red-500 hover:text-red-700 font-semibold underline focus:outline-none transition-colors"
                                             >
                                                 Remove
                                             </button>
                                         </div>
                                     )}
                                 </div>

                                 {/* Available Coupons list from Backend */}
                                 {availableCoupons.length > 0 && (
                                     <div className="mb-6 p-4 border border-dashed border-green-300 dark:border-green-800 rounded-2xl bg-green-50/30 dark:bg-green-950/10">
                                         <span className="block text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider mb-2">Available Coupons</span>
                                         <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                             {availableCoupons.map((coupon) => (
                                                 <button
                                                     key={coupon.id}
                                                     type="button"
                                                     onClick={() => handleApplyCouponCode(coupon.code)}
                                                     disabled={isCouponLoading || appliedCoupon !== null}
                                                     className="w-full text-left p-2 border border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 rounded-xl bg-white dark:bg-gray-900 transition-colors flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:dark:hover:border-gray-700"
                                                 >
                                                     <div>
                                                         <span className="inline-block px-1.5 py-0.5 text-[10px] font-black text-green-700 bg-green-100 rounded tracking-wider uppercase border border-dashed border-green-400 group-hover:bg-green-600 group-hover:text-white group-hover:border-solid transition-colors">
                                                             {coupon.code}
                                                         </span>
                                                         <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 font-medium">
                                                             {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                                                         </span>
                                                         {coupon.minBookingAmount && (
                                                             <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                                                                 Min booking: ₹{coupon.minBookingAmount}
                                                             </p>
                                                         )}
                                                     </div>
                                                     <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                         Apply
                                                     </span>
                                                 </button>
                                             ))}
                                         </div>
                                     </div>
                                 )}

                                 <div className="mb-8">
                                     <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Select Payment Method</p>
                                     <div className="space-y-2">
                                         {['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Wallet'].map((method) => (
                                             <label key={method} className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                 <input 
                                                     type="radio" 
                                                     name="paymentMethod" 
                                                     value={method} 
                                                     checked={paymentMethod === method} 
                                                     onChange={(e) => setPaymentMethod(e.target.value)}
                                                     className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                                                 />
                                                 <span className="ml-3 text-gray-700 dark:text-gray-300 font-medium">{method}</span>
                                             </label>
                                         ))}
                                     </div>
                                 </div>

                                 <button 
                                     disabled={paymentProcessing || isCouponLoading} 
                                     onClick={processPayment} 
                                     className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl transition-colors shadow-lg shadow-green-600/30 flex items-center justify-center"
                                 >
                                     {paymentProcessing ? (
                                         <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Processing...</>
                                     ) : (
                                         `Pay ${selectedHotel.currency === 'USD' ? '$' : selectedHotel.currency === 'EUR' ? '€' : '₹'}${Number(selectedHotel.pricePerNight) * rooms * (Math.ceil(Math.abs(new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)) || 1) - (appliedCoupon ? couponDiscount : 0)}`
                                     )}
                                 </button>
                             </>
                         )}
                     </div>
                 </div>
             )} 
        </section>
    );
}

// Wrapper for the Rating Bar to easily map them
function RatingLocation({ label, score }: { label: string, score: number }) {
    return <RatingBar label={label} score={score} />;
}
