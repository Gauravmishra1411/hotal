import { useState } from 'react';

const roomsList = [
  { id: 'deluxe', name: 'Deluxe Sea View Room', price: 250, description: '1 King Bed, Private Balcony, Ocean View' },
  { id: 'suite', name: 'Aurora Signature Suite', price: 450, description: '1 Master Suite, Private Infinity Pool, Butler Service' },
  { id: 'villa', name: 'Royal Horizon Beach Villa', price: 850, description: '3 Bedrooms, Private Garden, Direct Beach Access' }
];

export default function BookingEngine() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    selectedRoom: 'deluxe',
    fullName: '',
    email: '',
    phone: '',
    specialRequests: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardName: ''
  });

  const selectedRoomDetails = roomsList.find(r => r.id === formData.selectedRoom) || roomsList[0];

  // Calculate nights
  const calculateNights = () => {
    if (!formData.checkIn || !formData.checkOut) return 1;
    const start = new Date(formData.checkIn).getTime();
    const end = new Date(formData.checkOut).getTime();
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const nights = calculateNights();
  const subtotal = selectedRoomDetails.price * nights;
  const tax = subtotal * 0.10; // 10% VAT
  const total = subtotal + tax;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNextStep = () => {
    if (step < 3) setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(prev => prev - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Thank you for booking, ${formData.fullName}! Your reservation at Aurora Haven is confirmed.`);
    // Here you would connect to your booking POST backend API
  };

  return (
    <div className="bg-neutral-50 min-h-screen py-32 px-6 lg:px-16">
      <div className="max-w-6xl mx-auto">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-4 mb-10">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition ${step >= 1 ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'}`}>1</div>
          <div className="w-16 h-0.5 bg-gray-200"></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition ${step >= 2 ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'}`}>2</div>
          <div className="w-16 h-0.5 bg-gray-200"></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition ${step >= 3 ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'}`}>3</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Main Action Form Form */}
          <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-serif font-semibold text-gray-900">Select Dates & Accommodations</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Check-In Date</label>
                    <input type="date" name="checkIn" value={formData.checkIn} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-yellow-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Check-Out Date</label>
                    <input type="date" name="checkOut" value={formData.checkOut} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-yellow-600" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Guests</label>
                  <select name="guests" value={formData.guests} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-yellow-600 bg-white">
                    {[1, 2, 3, 4, 5, 6].map(num => <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>)}
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-600">Choose Your Room Sanctuary</label>
                  {roomsList.map(room => (
                    <label key={room.id} className={`flex items-start justify-between p-4 rounded-xl border cursor-pointer transition ${formData.selectedRoom === room.id ? 'border-yellow-600 bg-yellow-50/20' : 'border-gray-100 hover:border-gray-200'}`}>
                      <div className="flex items-start space-x-3">
                        <input type="radio" name="selectedRoom" value={room.id} checked={formData.selectedRoom === room.id} onChange={handleChange} className="mt-1 accent-yellow-600" />
                        <div>
                          <span className="font-bold text-gray-900 block">{room.name}</span>
                          <span className="text-xs text-gray-500">{room.description}</span>
                        </div>
                      </div>
                      <span className="font-serif text-yellow-600 font-bold">₹{room.price}/night</span>
                    </label>
                  ))}
                </div>

                <button onClick={handleNextStep} className="w-full bg-black hover:bg-neutral-800 text-white font-medium py-3 rounded-lg transition mt-4">
                  Continue to Personal Details
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-serif font-semibold text-gray-900">Your Contact Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none" placeholder="John Doe" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none" placeholder="johndoe@email.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Phone Number</label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none" placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Special Requests (Optional)</label>
                    <textarea name="specialRequests" value={formData.specialRequests} onChange={handleChange} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none" placeholder="Dietary rules, high-floor preference, pillow preferences..."></textarea>
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button onClick={handlePrevStep} className="w-1/3 border border-gray-200 text-gray-600 font-medium py-3 rounded-lg hover:bg-gray-50 transition">Back</button>
                  <button onClick={handleNextStep} className="w-2/3 bg-black hover:bg-neutral-800 text-white font-medium py-3 rounded-lg transition">Continue to Payment</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-2xl font-serif font-semibold text-gray-900">Secure Payment Gateway</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Cardholder Name</label>
                    <input type="text" name="cardName" value={formData.cardName} onChange={handleChange} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Card Number</label>
                    <input type="text" name="cardNumber" value={formData.cardNumber} onChange={handleChange} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none" placeholder="•••• •••• •••• ••••" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Expiration Date</label>
                      <input type="text" name="expiry" value={formData.expiry} onChange={handleChange} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none" placeholder="MM/YY" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">CVV Security Code</label>
                      <input type="password" name="cvv" value={formData.cvv} onChange={handleChange} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none" placeholder="•••" />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-start space-x-3 text-xs text-gray-500">
                  <svg className="w-5 h-5 text-green-600 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.167 13c0 2.41 1.95 4.36 4.36 4.36h6.946c2.41 0 4.36-1.95 4.36-4.36V7c0-2.41-1.95-4.36-4.36-4.36H6.527C4.117 2.64 2.167 4.59 2.167 7v6zm12.986-5.467a.75.75 0 00-1.06-1.06l-4.524 4.524-1.96-1.96a.75.75 0 00-1.06 1.06l2.49 2.49a.75.75 0 001.06 0l5.054-5.054z" clipRule="evenodd"/></svg>
                  <span>Your connection is protected by industry standard 256-bit encryption protocols. Payments are securely managed.</span>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button type="button" onClick={handlePrevStep} className="w-1/3 border border-gray-200 text-gray-600 font-medium py-3 rounded-lg hover:bg-gray-50 transition">Back</button>
                  <button type="submit" className="w-2/3 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 rounded-lg transition shadow-md">
                    Pay & Confirm Booking
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Sidebar Booking Summary card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit space-y-6">
            <h3 className="text-xl font-serif font-semibold text-gray-900 border-b border-gray-100 pb-3">Booking Summary</h3>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Sanctuary</span>
                <span className="font-semibold text-gray-900">{selectedRoomDetails.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Dates Selected</span>
                <span className="font-semibold text-gray-900">{formData.checkIn || 'Not selected'} - {formData.checkOut || 'Not selected'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Duration</span>
                <span className="font-semibold text-gray-900">{nights} night{nights > 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Guests</span>
                <span className="font-semibold text-gray-900">{formData.guests} Guest{Number(formData.guests) > 1 ? 's' : ''}</span>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Room Rate ({nights} nights)</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Taxes (10% VAT)</span>
                  <span>₹{tax}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-100 pt-3">
                  <span>Total Amount</span>
                  <span className="font-serif text-yellow-600">₹{total}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
