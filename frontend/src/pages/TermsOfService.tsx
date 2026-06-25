import React from 'react';

export default function TermsOfService() {
  return (
    <div className="bg-neutral-50 min-h-screen py-32 px-6 lg:px-16">
      <div className="max-w-4xl mx-auto bg-white p-10 md:p-16 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-4xl font-serif text-gray-900 mb-8 border-b border-gray-100 pb-6">Terms of Service</h1>
        
        <div className="space-y-8 text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Booking and Reservations</h2>
            <p>
              By completing a booking through our Booking Engine, you agree to the rates, terms, and conditions presented at the time of reservation. A valid credit card is required to secure your booking. The name on the credit card must match the name of the primary guest on the reservation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Cancellation Policy</h2>
            <p>
              We understand that plans can change. Our cancellation policy is as follows:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Standard Rates:</strong> Cancellations made more than 48 hours prior to check-in (3:00 PM local time) will incur no penalty. Cancellations made within 48 hours will be charged for the first night's stay.</li>
              <li><strong>Non-Refundable Rates:</strong> Bookings made under special non-refundable rates cannot be cancelled or modified without penalty.</li>
              <li><strong>No-Shows:</strong> Failure to arrive on the scheduled check-in date without prior notification will result in the cancellation of your entire reservation, and you will be charged the full amount of the stay.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Refund Policy</h2>
            <p>
              Eligible refunds will be processed to the original payment method within 7-10 business days of cancellation. Please note that processing times may vary depending on your bank or credit card provider.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Check-In and Check-Out</h2>
            <p>
              <strong>Check-In:</strong> 3:00 PM local time.<br/>
              <strong>Check-Out:</strong> 11:00 AM local time.<br/>
              Early check-in or late check-out is subject to availability and may incur additional charges.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Guest Conduct and Damage</h2>
            <p>
              Guests are expected to conduct themselves respectfully. Any damage to hotel property, rooms, or amenities caused by a guest or their visitors will be charged to the credit card on file. Smoking in non-smoking rooms will result in a cleaning fee.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Limitation of Liability</h2>
            <p>
              The hotel is not responsible for loss, damage, or theft of personal items from guest rooms, vehicles, or public areas. We strongly advise utilizing the in-room safes provided for your valuables.
            </p>
          </section>

          <div className="pt-8 mt-8 border-t border-gray-100 text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
