import React, { useState, useEffect } from 'react';
import { Plus, X, Save, Building, MapPin, DollarSign, Wifi, Image as ImageIcon, Pencil, Trash2, Upload, Star, Info } from 'lucide-react';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase';
import type { Hotel } from '../types/hotel';

const initialFormState: Partial<Hotel> = {
  hotelName: '', slug: '', shortDescription: '', description: '', starRating: 5, featured: false, status: 'active',
  ownerName: '', email: '', phone: '', website: '',
  country: '', state: '', city: '', address: '', postalCode: '', latitude: '', longitude: '', googleMapLink: '',
  pricePerNight: '', currency: 'INR',
  roomTypes: [], availableRooms: 0, maxGuests: 0, checkInTime: '14:00', checkOutTime: '11:00',
  wifiAvailable: true, parkingAvailable: true, breakfastIncluded: true, restaurant: true, gym: true, swimmingPool: true, airConditioning: true, petFriendly: false, 
  barLounge: false, waterParkOffsite: false, kidsStayFree: false, babysitting: false, amenities: [],
  allergyFreeRoom: false, blackoutCurtains: false, airConditioningRoom: true, desk: true, diningArea: false, coffeeTeaMaker: true, cableSatelliteTV: true, bidet: false,
  cityView: true, poolView: false, bridalSuite: false, suites: true, familyRooms: true, smokingRooms: false,
  hotelClass: 5, hotelStyle: 'Modern, Luxury', languagesSpoken: 'English, Hindi',
  thumbnail: '', galleryImages: [], videoUrl: '',
  averageRating: 4.5, totalReviews: 0, ratingLocation: 4.5, ratingRooms: 4.5, ratingValue: 4.5, ratingCleanliness: 4.5, ratingService: 4.5, ratingSleepQuality: 4.5, rankingText: '#1 of hotels'
};

export default function HotelsManager() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [form, setForm] = useState<Partial<Hotel>>(initialFormState);
  const [editingHotelId, setEditingHotelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [error, setError] = useState('');

  const fetchHotels = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'hotels'));
      const fetchedHotels = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Hotel));
      setHotels(fetchedHotels);
    } catch (err: any) {
      console.error("Error fetching hotels:", err);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm(prev => ({ ...prev, [name]: checked }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isGallery: boolean = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingMedia(true);
      setError('');
      
      const uploadPromises = Array.from(files).map(async (file) => {
        const storageRef = ref(storage, `hotels/${Date.now()}-${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
      });

      const downloadURLs = await Promise.all(uploadPromises);
      
      if (isGallery) {
        setForm(prev => ({ ...prev, galleryImages: [...(prev.galleryImages || []), ...downloadURLs] }));
      } else {
        setForm(prev => ({ ...prev, thumbnail: downloadURLs[0] }));
      }
      
    } catch (err: any) {
      console.error("Error uploading file:", err);
      setError("Failed to upload image. Make sure Storage is enabled in Firebase and Rules allow writing.");
    } finally {
      setUploadingMedia(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setForm(prev => {
      const newImages = [...(prev.galleryImages || [])];
      newImages.splice(index, 1);
      return { ...prev, galleryImages: newImages };
    });
  };

  const openNewModal = () => {
    setForm(initialFormState);
    setEditingHotelId(null);
    setShowModal(true);
    setActiveTab('basic');
  };

  const handleEdit = (hotel: Hotel) => {
    setForm(hotel);
    setEditingHotelId((hotel as any).id);
    setShowModal(true);
    setActiveTab('basic');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this hotel? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, 'hotels', id));
      fetchHotels();
    } catch (err: any) {
      console.error("Error deleting hotel:", err);
      alert("Failed to delete hotel.");
    }
  };

  const handleSaveHotel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Manual Validation for required fields across tabs
    if (!form.hotelName || !form.description) {
      setActiveTab('basic');
      const msg = 'Please fill out all required fields in Basic Info (Hotel Name, Description).';
      setError(msg);
      alert(msg);
      return;
    }
    if (!form.address || !form.city || !form.country) {
      setActiveTab('location');
      const msg = 'Please fill out all required fields in Location (Address, City, Country).';
      setError(msg);
      alert(msg);
      return;
    }
    if (!form.pricePerNight) {
      setActiveTab('pricing');
      const msg = 'Please provide the Base Price Per Night.';
      setError(msg);
      alert(msg);
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!auth.currentUser) throw new Error("You must be logged in to save a hotel.");

      const hotelData = {
        ...form,
        updatedAt: serverTimestamp(),
      };

      if (editingHotelId) {
        const hotelRef = doc(db, 'hotels', editingHotelId);
        await updateDoc(hotelRef, hotelData);
      } else {
        const newHotelData = {
          ...hotelData,
          createdBy: auth.currentUser.uid,
          createdAt: serverTimestamp(),
        };
        await addDoc(collection(db, 'hotels'), newHotelData);
      }
      
      setForm(initialFormState);
      setEditingHotelId(null);
      setShowModal(false);
      fetchHotels();
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.message || 'Failed to save hotel. Ensure your Firestore database is created and rules are set.';
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Building },
    { id: 'location', label: 'Location & Contact', icon: MapPin },
    { id: 'pricing', label: 'Pricing & Rooms', icon: DollarSign },
    { id: 'ratings', label: 'Ratings Breakdown', icon: Star },
    { id: 'amenities', label: 'Features & Amenities', icon: Wifi },
    { id: 'media', label: 'Media Gallery', icon: ImageIcon },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-8 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Hotels &amp; Rooms Manager</h2>
        <button
          onClick={openNewModal}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl shadow-md transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add New Hotel
        </button>
      </div>

      {hotels.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-dashed border-gray-300">
          <Building className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium text-lg">No hotels added yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {hotels.map((hotel: any) => (
            <div key={hotel.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 group hover:shadow-md transition-shadow relative">
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                <button onClick={() => handleEdit(hotel)} className="p-2 bg-white/90 backdrop-blur-sm text-blue-600 rounded-lg shadow-sm hover:bg-blue-50 transition-colors">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(hotel.id)} className="p-2 bg-white/90 backdrop-blur-sm text-red-600 rounded-lg shadow-sm hover:bg-red-50 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {hotel.thumbnail ? (
                <img src={hotel.thumbnail} alt={hotel.hotelName} className="w-full h-48 object-cover rounded-xl mb-4 group-hover:scale-[1.02] transition-transform duration-300" />
              ) : (
                <div className="w-full h-48 bg-gray-100 rounded-xl mb-4 flex items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-gray-300" />
                </div>
              )}
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{hotel.hotelName}</h3>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                  ★ {hotel.averageRating}
                </span>
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
                <MapPin className="h-3 w-3" /> {hotel.city}, {hotel.country}
              </p>
              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <p className="text-lg font-black text-gray-900">
                  {hotel.currency} {hotel.pricePerNight} <span className="text-sm font-normal text-gray-500">/ night</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm z-50 p-4 md:p-8">
          <div className="bg-white rounded-2xl w-full max-w-6xl h-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-800">
                {editingHotelId ? 'Edit Property Details' : 'Add New Property'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6 mb-0 rounded-r shadow-sm">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            <form id="hotelForm" onSubmit={handleSaveHotel} className="flex-1 flex overflow-hidden">
              <div className="w-64 bg-gray-50 border-r border-gray-100 p-4 overflow-y-auto hidden md:block flex-shrink-0">
                <div className="space-y-1">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        activeTab === tab.id ? 'bg-white text-green-600 shadow-sm border border-gray-100' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? 'text-green-600' : 'text-gray-400'}`} />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8">
                
                {/* BASIC INFO TAB */}
                <div className={activeTab === 'basic' ? 'block' : 'hidden'}>
                  <h4 className="text-lg font-bold text-gray-800 mb-6">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Name *</label>
                      <input name="hotelName" value={form.hotelName} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ranking Text (e.g., #1 of 163 hotels in Noida)</label>
                      <input name="rankingText" value={form.rankingText} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none" />
                    </div>
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                    <input name="shortDescription" value={form.shortDescription} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none" />
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Description * (Supports long text)</label>
                    <textarea name="description" rows={6} value={form.description} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none" />
                  </div>
                  
                  <h4 className="text-lg font-bold text-gray-800 mb-4 mt-8">Good to Know</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Class (Stars)</label>
                      <input name="hotelClass" type="number" min="1" max="5" value={form.hotelClass} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Style</label>
                      <input name="hotelStyle" value={form.hotelStyle} onChange={handleChange} placeholder="Charming, Classic" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Languages Spoken</label>
                      <input name="languagesSpoken" value={form.languagesSpoken} onChange={handleChange} placeholder="English, Hindi" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none" />
                    </div>
                  </div>
                </div>

                {/* LOCATION & CONTACT TAB */}
                <div className={activeTab === 'location' ? 'block' : 'hidden'}>
                  <h4 className="text-lg font-bold text-gray-800 mb-6">Location Details</h4>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Address *</label>
                    <input name="address" value={form.address} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                      <input name="city" value={form.city} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input name="state" value={form.state} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                      <input name="country" value={form.country} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none" />
                    </div>
                  </div>
                  
                  <h4 className="text-lg font-bold text-gray-800 mb-6 mt-8">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Public Phone Number</label>
                      <input name="phone" value={form.phone} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Public Email Address</label>
                      <input name="email" value={form.email} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Official Website Link</label>
                      <input name="website" value={form.website} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none" />
                    </div>
                  </div>
                </div>

                {/* PRICING & ROOMS TAB */}
                <div className={activeTab === 'pricing' ? 'block' : 'hidden'}>
                  <h4 className="text-lg font-bold text-gray-800 mb-6">Pricing</h4>
                  <div className="bg-blue-50 p-4 rounded-xl mb-6 flex gap-3 text-blue-800">
                    <Info className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm">The base price you enter here will be used as the official deal price. The system will automatically generate slight variations for other partners (like Booking.com) to demonstrate the deal comparison UI.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Base Price Per Night *</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                        <input name="pricePerNight" type="number" value={form.pricePerNight} onChange={handleChange} className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                      <select name="currency" value={form.currency} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none bg-white">
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>
                  </div>
                  
                  <h4 className="text-lg font-bold text-gray-800 mb-6 mt-8">Room Availability</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Available Rooms</label>
                      <input name="availableRooms" type="number" value={form.availableRooms} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Guests per Room</label>
                      <input name="maxGuests" type="number" value={form.maxGuests} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none" />
                    </div>
                  </div>
                </div>

                {/* RATINGS TAB */}
                <div className={activeTab === 'ratings' ? 'block' : 'hidden'}>
                  <h4 className="text-lg font-bold text-gray-800 mb-6">Ratings & Reviews Breakdown</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Review Count</label>
                      <input name="totalReviews" type="number" value={form.totalReviews} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Overall Average Rating (1.0 - 5.0)</label>
                      <input name="averageRating" type="number" step="0.1" max="5" value={form.averageRating} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none" />
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <h5 className="font-semibold text-gray-800 mb-4">Specific Categories (1.0 - 5.0)</h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      {[
                        { name: 'ratingLocation', label: 'Location' },
                        { name: 'ratingRooms', label: 'Rooms' },
                        { name: 'ratingValue', label: 'Value' },
                        { name: 'ratingCleanliness', label: 'Cleanliness' },
                        { name: 'ratingService', label: 'Service' },
                        { name: 'ratingSleepQuality', label: 'Sleep Quality' },
                      ].map(rating => (
                        <div key={rating.name}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{rating.label}</label>
                          <input name={rating.name} type="number" step="0.1" max="5" value={form[rating.name as keyof Hotel] as number} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2 outline-none bg-white" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AMENITIES TAB */}
                <div className={activeTab === 'amenities' ? 'block' : 'hidden'}>
                  <h4 className="text-lg font-bold text-gray-800 mb-4">Property Amenities</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8">
                    {[
                      { name: 'wifiAvailable', label: 'Free High Speed WiFi' },
                      { name: 'parkingAvailable', label: 'Free Parking' },
                      { name: 'breakfastIncluded', label: 'Breakfast Included' },
                      { name: 'restaurant', label: 'Restaurant' },
                      { name: 'gym', label: 'Fitness Centre with Gym' },
                      { name: 'swimmingPool', label: 'Pool' },
                      { name: 'barLounge', label: 'Bar / Lounge' },
                      { name: 'waterParkOffsite', label: 'Water park offsite' },
                      { name: 'kidsStayFree', label: 'Kids stay free' },
                      { name: 'babysitting', label: 'Babysitting' },
                      { name: 'petFriendly', label: 'Pet Friendly' },
                    ].map((amenity) => (
                      <label key={amenity.name} className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" name={amenity.name} checked={form[amenity.name as keyof Hotel] as boolean} onChange={handleChange} className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                        <span className="text-gray-700 text-sm group-hover:text-gray-900">{amenity.label}</span>
                      </label>
                    ))}
                  </div>

                  <h4 className="text-lg font-bold text-gray-800 mb-4">Room Features</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8">
                    {[
                      { name: 'allergyFreeRoom', label: 'Allergy-free room' },
                      { name: 'blackoutCurtains', label: 'Blackout curtains' },
                      { name: 'airConditioningRoom', label: 'Air conditioning' },
                      { name: 'desk', label: 'Desk' },
                      { name: 'diningArea', label: 'Dining area' },
                      { name: 'coffeeTeaMaker', label: 'Coffee / tea maker' },
                      { name: 'cableSatelliteTV', label: 'Cable / satellite TV' },
                      { name: 'bidet', label: 'Bidet' },
                    ].map((feature) => (
                      <label key={feature.name} className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" name={feature.name} checked={form[feature.name as keyof Hotel] as boolean} onChange={handleChange} className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                        <span className="text-gray-700 text-sm group-hover:text-gray-900">{feature.label}</span>
                      </label>
                    ))}
                  </div>

                  <h4 className="text-lg font-bold text-gray-800 mb-4">Room Types Available</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    {[
                      { name: 'cityView', label: 'City view' },
                      { name: 'poolView', label: 'Pool view' },
                      { name: 'bridalSuite', label: 'Bridal suite' },
                      { name: 'suites', label: 'Suites' },
                      { name: 'familyRooms', label: 'Family rooms' },
                      { name: 'smokingRooms', label: 'Smoking rooms available' },
                    ].map((type) => (
                      <label key={type.name} className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" name={type.name} checked={form[type.name as keyof Hotel] as boolean} onChange={handleChange} className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                        <span className="text-gray-700 text-sm group-hover:text-gray-900">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* MEDIA TAB */}
                <div className={activeTab === 'media' ? 'block' : 'hidden'}>
                  <h4 className="text-lg font-bold text-gray-800 mb-6">Hero Thumbnail (Primary Image)</h4>
                  <div className="mb-8 p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors relative">
                    <label className="flex flex-col items-center justify-center cursor-pointer">
                      <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                        <Upload className="h-6 w-6 text-blue-500" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Upload Hero Image</span>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, false)} className="hidden" />
                    </label>
                  </div>

                  {form.thumbnail && (
                    <div className="mb-8 p-2 bg-gray-50 rounded-xl border border-gray-100 inline-block relative group">
                      <img src={form.thumbnail} alt="Preview" className="h-48 rounded-lg object-cover" />
                    </div>
                  )}

                  <h4 className="text-lg font-bold text-gray-800 mb-6 border-t border-gray-200 pt-8">Gallery Images</h4>
                  <div className="mb-6 p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors relative">
                    <label className="flex flex-col items-center justify-center cursor-pointer">
                      <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                        <Upload className="h-6 w-6 text-green-500" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Upload Multiple Gallery Images</span>
                      <input type="file" accept="image/*" multiple onChange={(e) => handleFileUpload(e, true)} className="hidden" />
                    </label>
                  </div>

                  {uploadingMedia && (
                    <div className="text-sm text-blue-600 mb-4 animate-pulse">Uploading media to secure storage...</div>
                  )}

                  {form.galleryImages && form.galleryImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {form.galleryImages.map((img, index) => (
                        <div key={index} className="relative group rounded-xl overflow-hidden border border-gray-200">
                          <img src={img} alt={`Gallery ${index}`} className="w-full h-32 object-cover" />
                          <button 
                            type="button" 
                            onClick={() => removeGalleryImage(index)}
                            className="absolute top-2 right-2 p-1.5 bg-red-600/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </form>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/80 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Please ensure all required (*) fields are filled.
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="hotelForm"
                  disabled={loading || uploadingMedia}
                  className="px-6 py-2.5 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition-colors shadow-md shadow-green-600/20 flex items-center gap-2 disabled:opacity-70"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="h-5 w-5" />
                  )}
                  {editingHotelId ? 'Update Hotel' : 'Publish Hotel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
