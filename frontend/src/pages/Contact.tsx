import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'contact_messages'), {
        ...formData,
        status: 'new',
        createdAt: serverTimestamp()
      });
      setSuccess(true);
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <section className="page-section py-24 px-6 lg:px-16 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="space-y-6">
          <span className="text-sm font-bold uppercase tracking-widest text-[#d4af37]">Get In Touch</span>
          <h2 className="text-4xl font-serif text-gray-900 dark:text-white">Reach the Concierge</h2>
          <p className="text-gray-600 dark:text-gray-300">Have questions about your stay, event booking, or travel plans? Let us know and we will get back to you directly.</p>
          <div className="space-y-4 pt-4">
            <p className="text-gray-700 dark:text-gray-300"><strong>Address:</strong> Santo Tomás Beach, Menorca, Spain</p>
            <p className="text-gray-700 dark:text-gray-300"><strong>Email:</strong> reservations@aurorahaven.com</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg space-y-4">
          {success && (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg font-medium">
              Thank you! Your message has been sent to the concierge.
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Name</label>
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#d4af37] focus:border-[#d4af37] dark:bg-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Email</label>
            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#d4af37] focus:border-[#d4af37] dark:bg-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
            <textarea rows={4} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} required className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#d4af37] focus:border-[#d4af37] dark:bg-gray-900 dark:text-white"></textarea>
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-[#d4af37] hover:bg-yellow-600 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition">
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </section>
  );
}
