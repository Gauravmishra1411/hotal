export default function PrivacyPolicy() {
  return (
    <div className="bg-neutral-50 min-h-screen py-32 px-6 lg:px-16">
      <div className="max-w-4xl mx-auto bg-white p-10 md:p-16 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-4xl font-serif text-gray-900 mb-8 border-b border-gray-100 pb-6">Privacy Policy</h1>
        
        <div className="space-y-8 text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Information We Collect</h2>
            <p>
              When you make a reservation, sign up for our newsletter, or use our services, we collect personal information such as your name, email address, phone number, payment details, and special requests. We also collect non-identifiable data such as IP addresses and browser types to improve our website experience.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <p>
              The information we collect is used to:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Process and confirm your hotel reservations.</li>
              <li>Communicate with you regarding your stay and special requests.</li>
              <li>Improve our services, website, and guest experience.</li>
              <li>Send promotional offers and newsletters (only if you have opted in).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Data Security</h2>
            <p>
              We implement industry-standard 256-bit encryption protocols to protect your sensitive information, especially during the payment and booking process. Your data is stored securely and is only accessible to authorized personnel who require it to perform their duties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Sharing Your Information</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may share necessary data with trusted third-party service providers (such as payment gateways) strictly for the purpose of facilitating your booking and enhancing your stay.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Cookies</h2>
            <p>
              Our website uses cookies to enhance user experience, remember your preferences, and track analytics. You can choose to disable cookies through your browser settings, though this may affect certain functionalities of our booking engine.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Your Rights</h2>
            <p>
              You have the right to request access to, correction of, or deletion of your personal data stored with us. To exercise these rights, please contact our support team.
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
