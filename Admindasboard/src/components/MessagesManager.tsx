import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Mail, CheckCircle, Trash2, Clock } from 'lucide-react';

export default function MessagesManager() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'contact_messages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleMarkResolved = async (id: string, currentStatus: string) => {
    try {
      await updateDoc(doc(db, 'contact_messages', id), {
        status: currentStatus === 'resolved' ? 'new' : 'resolved'
      });
    } catch (error) {
      console.error('Error updating message status', error);
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await deleteDoc(doc(db, 'contact_messages', id));
      } catch (error) {
        console.error('Error deleting message', error);
        alert('Failed to delete message');
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-gray-50 h-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Contact Messages</h2>
          <p className="text-gray-500 mt-1">View and respond to inquiries from the public website.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4"></div>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Mail className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>No messages found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {messages.map((message) => (
              <div key={message.id} className={`p-6 transition-colors ${message.status === 'new' ? 'bg-green-50/30' : 'bg-white'}`}>
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-900 text-lg">{message.name}</h3>
                      <a href={`mailto:${message.email}`} className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {message.email}
                      </a>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        message.status === 'new' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>
                        {message.status === 'new' ? 'New' : 'Resolved'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                      <Clock className="w-3.5 h-3.5" />
                      {message.createdAt?.toDate().toLocaleString() || 'Unknown date'}
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-700 whitespace-pre-wrap">
                      {message.message}
                    </div>
                  </div>
                  
                  <div className="flex flex-row md:flex-col items-center justify-end gap-2 shrink-0 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                    <button 
                      onClick={() => handleMarkResolved(message.id, message.status)}
                      className={`w-full md:w-32 flex justify-center items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border ${
                        message.status === 'new' 
                          ? 'bg-white border-green-200 text-green-700 hover:bg-green-50' 
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      {message.status === 'new' ? 'Resolve' : 'Reopen'}
                    </button>
                    
                    <button 
                      onClick={() => handleDelete(message.id)}
                      className="w-full md:w-32 flex justify-center items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
