import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Plus, Edit2, Trash2, FileText, Settings, BookOpen, Image as ImageIcon, Tag } from 'lucide-react';

export default function ContentManager() {
  const [activeTab, setActiveTab] = useState('Pages');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  const collections: Record<string, string> = {
    'Pages': 'pages',
    'Services': 'services',
    'Blogs': 'blogs',
    'Hero Content': 'hero_content',
    'Hero Slides': 'hero_slides',
    'Site Settings': 'site_settings',
    'Coupons': 'coupons'
  };

  const [settingsData, setSettingsData] = useState<any>({});
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, collections[activeTab]));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: any[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setItems(data);
      if (activeTab === 'Site Settings') {
        if (data.length > 0) {
          setSettingsData(data[0]);
        } else {
          setSettingsData({});
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [activeTab]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const colRef = collection(db, 'site_settings');
      const payload = {
        siteName: settingsData.siteName || '',
        contactEmail: settingsData.contactEmail || '',
        contactPhone: settingsData.contactPhone || '',
        contactAddress: settingsData.contactAddress || '',
        facebookUrl: settingsData.facebookUrl || '',
        twitterUrl: settingsData.twitterUrl || '',
        instagramUrl: settingsData.instagramUrl || '',
        linkedinUrl: settingsData.linkedinUrl || ''
      };
      if (settingsData.id) {
        await updateDoc(doc(db, 'site_settings', settingsData.id), payload);
      } else {
        await addDoc(colRef, payload);
      }
      alert("Settings updated successfully!");
    } catch (error) {
      console.error("Error saving settings: ", error);
      alert("Error saving settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const [uploading, setUploading] = useState(false);

  const handleContentFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `content/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setFormData((prev: any) => ({ ...prev, [fieldName]: downloadURL }));
    } catch (error) {
      console.error("Error uploading content file:", error);
      alert("Failed to upload image. Make sure Storage is enabled in Firebase and Rules allow writing.");
    } finally {
      setUploading(false);
    }
  };

  const handleOpenModal = (item: any = null) => {
    if (item) {
      setEditingId(item.id);
      setFormData(item);
    } else {
      setEditingId(null);
      const defaults: Record<string, any> = {};
      if (activeTab === 'Services') {
        defaults.icon = 'Car';
      } else if (activeTab === 'Coupons') {
        defaults.discountType = 'percentage';
        defaults.status = 'active';
      }
      setFormData(defaults);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const colName = collections[activeTab];
      if (editingId) {
        await updateDoc(doc(db, colName, editingId), formData);
      } else {
        await addDoc(collection(db, colName), formData);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving document: ", error);
      alert("Error saving document");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteDoc(doc(db, collections[activeTab], id));
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert("Error deleting document");
      }
    }
  };

  const renderFormFields = () => {
    switch (activeTab) {
      case 'Pages':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Page Title</label>
              <input type="text" required className="w-full border rounded-lg p-2" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. About Us" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL path)</label>
              <input type="text" required className="w-full border rounded-lg p-2" value={formData.slug || ''} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="e.g. about-us" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea required rows={5} className="w-full border rounded-lg p-2" value={formData.content || ''} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="HTML or text content..." />
            </div>
          </>
        );
      case 'Services':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
              <input type="text" required className="w-full border rounded-lg p-2" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Airport Transfer" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea required rows={3} className="w-full border rounded-lg p-2" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Service description..." />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Icon Type</label>
              <select className="w-full border rounded-lg p-2" value={formData.icon || 'Car'} onChange={e => setFormData({...formData, icon: e.target.value})}>
                <option value="Car">Car</option>
                <option value="Coffee">Coffee</option>
                <option value="Wifi">Wifi</option>
                <option value="Star">Star</option>
              </select>
            </div>
          </>
        );
      case 'Blogs':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Blog Title</label>
              <input type="text" required className="w-full border rounded-lg p-2" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Blog title" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <div className="flex gap-2 mb-2">
                <input type="text" className="w-full border rounded-lg p-2" value={formData.imageUrl || ''} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://..." />
                <label className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 border rounded-lg px-4 cursor-pointer text-sm font-medium text-gray-700 flex-shrink-0">
                  {uploading ? 'Uploading...' : 'Upload Image'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleContentFileUpload(e, 'imageUrl')} disabled={uploading} />
                </label>
              </div>
              {formData.imageUrl && (
                <div className="h-20 w-32 rounded-lg overflow-hidden border border-gray-200 mb-2">
                  <img src={formData.imageUrl} alt="Blog Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea required rows={5} className="w-full border rounded-lg p-2" value={formData.content || ''} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="Blog content..." />
            </div>
          </>
        );
      case 'Hero Content':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Subheading</label>
              <input type="text" className="w-full border rounded-lg p-2" value={formData.subheading || ''} onChange={e => setFormData({...formData, subheading: e.target.value})} placeholder="e.g. A COASTAL RETREAT - EST. 1924" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Main Heading</label>
              <input type="text" required className="w-full border rounded-lg p-2" value={formData.heading || ''} onChange={e => setFormData({...formData, heading: e.target.value})} placeholder="e.g. Where the sea remembers your name." />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Paragraph Description</label>
              <textarea required rows={4} className="w-full border rounded-lg p-2" value={formData.paragraph || ''} onChange={e => setFormData({...formData, paragraph: e.target.value})} placeholder="e.g. A century-old hideaway..." />
            </div>
          </>
        );
      case 'Hero Slides':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <div className="flex gap-2 mb-2">
                <input type="text" required className="w-full border rounded-lg p-2" value={formData.imageUrl || ''} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://res.cloudinary.com/..." />
                <label className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 border rounded-lg px-4 cursor-pointer text-sm font-medium text-gray-700 flex-shrink-0">
                  {uploading ? 'Uploading...' : 'Upload Image'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleContentFileUpload(e, 'imageUrl')} disabled={uploading} />
                </label>
              </div>
              {formData.imageUrl && (
                <div className="h-20 w-32 rounded-lg overflow-hidden border border-gray-200 mb-2">
                  <img src={formData.imageUrl} alt="Slide Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
              <input type="text" required className="w-full border rounded-lg p-2" value={formData.caption || ''} onChange={e => setFormData({...formData, caption: e.target.value})} placeholder="e.g. Luxury Resort & Spa" />
            </div>
          </>
        );
      case 'Coupons':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
              <input type="text" required className="w-full border rounded-lg p-2 uppercase" value={formData.code || ''} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="e.g. WELCOME10" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type *</label>
              <select className="w-full border rounded-lg p-2 bg-white" value={formData.discountType || 'percentage'} onChange={e => setFormData({...formData, discountType: e.target.value})}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value *</label>
              <input type="number" required className="w-full border rounded-lg p-2" value={formData.discountValue || ''} onChange={e => setFormData({...formData, discountValue: e.target.value})} placeholder="e.g. 10 for 10% or 500 for ₹500" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Booking Amount (₹)</label>
              <input type="number" className="w-full border rounded-lg p-2" value={formData.minBookingAmount || ''} onChange={e => setFormData({...formData, minBookingAmount: e.target.value})} placeholder="e.g. 1000 (optional)" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
              <select className="w-full border rounded-lg p-2 bg-white" value={formData.status || 'active'} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-gray-50 h-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Content Management</h2>
          <p className="text-gray-500 mt-1">Manage pages, services, and blog posts dynamically.</p>
        </div>
        {activeTab !== 'Site Settings' && (
          <button 
            onClick={() => handleOpenModal()} 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add New {activeTab === 'Hero Content' ? 'Text Overlay' : activeTab === 'Hero Slides' ? 'Slide' : activeTab.slice(0, -1)}
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[500px]">
        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-2 bg-gray-50/50 overflow-x-auto">
          {[
            { name: 'Pages', icon: FileText },
            { name: 'Services', icon: Settings },
            { name: 'Blogs', icon: BookOpen },
            { name: 'Hero Content', icon: ImageIcon },
            { name: 'Hero Slides', icon: ImageIcon },
            { name: 'Site Settings', icon: Settings },
            { name: 'Coupons', icon: Tag }
          ].map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`px-6 py-4 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.name 
                  ? 'border-green-600 text-green-600 bg-white' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Content List */}
        <div className="p-6 flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : activeTab === 'Site Settings' ? (
            <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6 pb-2 border-b border-gray-100">Global Site Settings</h3>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                    <input type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none" value={settingsData.siteName || ''} onChange={e => setSettingsData({...settingsData, siteName: e.target.value})} placeholder="e.g. LuxeStay" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                    <input type="email" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none" value={settingsData.contactEmail || ''} onChange={e => setSettingsData({...settingsData, contactEmail: e.target.value})} placeholder="e.g. support@luxestay.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                    <input type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none" value={settingsData.contactPhone || ''} onChange={e => setSettingsData({...settingsData, contactPhone: e.target.value})} placeholder="e.g. +1 (800) 123-4567" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Address</label>
                    <input type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none" value={settingsData.contactAddress || ''} onChange={e => setSettingsData({...settingsData, contactAddress: e.target.value})} placeholder="e.g. 123 Luxury Ave, San Francisco" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Link</label>
                    <input type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none" value={settingsData.facebookUrl || ''} onChange={e => setSettingsData({...settingsData, facebookUrl: e.target.value})} placeholder="https://facebook.com/..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Twitter Link</label>
                    <input type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none" value={settingsData.twitterUrl || ''} onChange={e => setSettingsData({...settingsData, twitterUrl: e.target.value})} placeholder="https://twitter.com/..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instagram Link</label>
                    <input type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none" value={settingsData.instagramUrl || ''} onChange={e => setSettingsData({...settingsData, instagramUrl: e.target.value})} placeholder="https://instagram.com/..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Link</label>
                    <input type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none" value={settingsData.linkedinUrl || ''} onChange={e => setSettingsData({...settingsData, linkedinUrl: e.target.value})} placeholder="https://linkedin.com/..." />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button type="submit" disabled={savingSettings} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2">
                    {savingSettings ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
              <p>No {activeTab.toLowerCase()} found.</p>
              <button onClick={() => handleOpenModal()} className="mt-4 text-green-600 font-medium hover:underline">
                Create the first one
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow group relative flex flex-col justify-between">
                  <div>
                    {activeTab === 'Hero Slides' && item.imageUrl && (
                      <div className="h-32 w-full rounded-lg bg-gray-100 overflow-hidden mb-3">
                        <img src={item.imageUrl} alt={item.caption} className="w-full h-full object-cover" />
                      </div>
                    )}
                    {activeTab === 'Coupons' && (
                      <div className="flex justify-between items-center mb-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {item.status === 'active' ? 'Active' : 'Disabled'}
                        </span>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {item.discountType === 'percentage' ? `${item.discountValue}% OFF` : `₹${item.discountValue} OFF`}
                        </span>
                      </div>
                    )}
                    <h3 className="font-bold text-lg text-gray-900 mb-2 truncate">
                      {item.title || item.name || item.heading || item.caption || item.code || 'Item'}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 font-light">
                      {item.description || item.content || item.paragraph || item.imageUrl || item.slug || (item.minBookingAmount ? `Min Booking: ₹${item.minBookingAmount}` : 'No minimum booking requirement')}
                    </p>
                  </div>
                  
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur rounded-lg p-1 shadow-sm border border-gray-100">
                    <button onClick={() => handleOpenModal(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">
                {editingId ? `Edit ${activeTab.slice(0, -1)}` : `New ${activeTab.slice(0, -1)}`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6">
              {renderFormFields()}
              <div className="mt-6 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 bg-green-600 text-white font-medium hover:bg-green-700 rounded-lg transition-colors shadow-sm">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
