import React, { useState, useEffect } from 'react';
import {
  collection, query, onSnapshot, updateDoc, doc, orderBy, addDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Clock, Loader2, Settings2, ChevronDown, ChevronUp, Save,
  DollarSign, Timer, Plus, X, Lightbulb, Hash,
} from 'lucide-react';

export default function ServiceRequestsManager() {
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // State for edits: { [requestId]: { status, totalPrice, eta, serviceDetails } }
  const [editState, setEditState] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState<string | null>(null); // bookingId being saved
  
  // Filter state
  const [activeTab, setActiveTab] = useState<'upcoming' | 'previous'>('upcoming');

  // Suggestion input state: { [requestId]: { [serviceIdx]: string } }
  const [suggestionInput, setSuggestionInput] = useState<Record<string, Record<number, string>>>({});

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'serviceRequests'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: any[] = [];
      snapshot.forEach((d) => data.push({ id: d.id, ...d.data() }));
      setAllRequests(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const initState = (request: any) => {
    const services: string[] = request.services || [];
    const serviceDetails: Record<string, any> = {};
    services.forEach((svc: string) => {
      const existing = (request.serviceDetails || {})[svc] || {};
      serviceDetails[svc] = {
        price: existing.price !== undefined ? String(existing.price) : '',
        deliveryTime: existing.deliveryTime || '',
        suggestions: existing.suggestions || [],
      };
    });
    return {
      status: request.status || 'Pending',
      totalPrice: request.totalPrice !== undefined ? String(request.totalPrice) : '',
      eta: request.eta || '',
      serviceDetails,
    };
  };

  const toggleExpand = (group: any) => {
    if (expandedId === group.bookingId) { 
      setExpandedId(null); 
      return; 
    }
    setExpandedId(group.bookingId);
    
    // Initialize edit state for all requests in this group if not already initialized
    setEditState((prev) => {
      const newState = { ...prev };
      group.requests.forEach((req: any) => {
        if (!newState[req.id]) {
          newState[req.id] = initState(req);
        }
      });
      return newState;
    });
  };

  const updateServiceField = (requestId: string, svc: string, field: string, value: any) => {
    setEditState((prev) => ({
      ...prev,
      [requestId]: {
        ...prev[requestId],
        serviceDetails: {
          ...prev[requestId].serviceDetails,
          [svc]: { ...prev[requestId].serviceDetails[svc], [field]: value },
        },
      },
    }));
  };

  const updateTopField = (requestId: string, field: string, value: string) => {
    setEditState((prev) => ({ ...prev, [requestId]: { ...prev[requestId], [field]: value } }));
  };

  const addSuggestion = (requestId: string, svc: string, svcIdx: number) => {
    const text = (suggestionInput[requestId]?.[svcIdx] || '').trim();
    if (!text) return;
    const current = editState[requestId]?.serviceDetails?.[svc]?.suggestions || [];
    updateServiceField(requestId, svc, 'suggestions', [...current, text]);
    setSuggestionInput((prev) => ({
      ...prev,
      [requestId]: { ...(prev[requestId] || {}), [svcIdx]: '' },
    }));
  };

  const removeSuggestion = (requestId: string, svc: string, optIdx: number) => {
    const current = editState[requestId]?.serviceDetails?.[svc]?.suggestions || [];
    updateServiceField(requestId, svc, 'suggestions', current.filter((_: any, i: number) => i !== optIdx));
  };

  const handleSaveGroup = async (group: any) => {
    setSaving(group.bookingId);

    try {
      // We will save all requests in this group
      const promises = group.requests.map(async (request: any) => {
        const state = editState[request.id];
        if (!state) return;

        const hasSuggestions = Object.values(state.serviceDetails || {}).some(
          (v: any) => v.suggestions && v.suggestions.length > 0,
        );

        const finalStatus = hasSuggestions ? 'Awaiting Confirmation' : state.status;

        const serviceDetailsPayload = Object.fromEntries(
          Object.entries(state.serviceDetails).map(([svc, val]: [string, any]) => [
            svc,
            {
              price: Number(val.price) || 0,
              deliveryTime: val.deliveryTime || '',
              suggestions: val.suggestions || [],
              confirmedOption: val.confirmedOption || null,
            },
          ]),
        );

        await updateDoc(doc(db, 'serviceRequests', request.id), {
          status: finalStatus,
          totalPrice: Number(state.totalPrice) || 0,
          eta: state.eta,
          serviceDetails: serviceDetailsPayload,
        });

        return { request, finalStatus, hasSuggestions };
      });

      const results = await Promise.all(promises);

      // Send ONE notification for the whole group update
      const validResults = results.filter(Boolean);
      if (validResults.length > 0 && group.requests[0].userId) {
        const anySuggestions = validResults.some(r => r.hasSuggestions);
        
        // Collect all services updated
        const allServices = validResults.flatMap(r => r.request.services || []);
        
        const suggestionMsg = anySuggestions
          ? ' Please confirm your variant preferences in the app.'
          : '';
          
        await addDoc(collection(db, 'notifications'), {
          userId: group.requests[0].userId,
          title: anySuggestions ? 'Action Required — Choose Your Preferences' : 'Service Requests Updated',
          message: `Updates regarding your requests: ${allServices.join(', ')}.${suggestionMsg}`,
          isRead: false,
          createdAt: serverTimestamp(),
          type: 'service_request_update',
        });
      }

      setExpandedId(null);
    } catch (err) {
      console.error('Error saving group:', err);
      alert('Failed to save. Check console.');
    } finally {
      setSaving(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'Awaiting Confirmation': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // ── 1. Filter by Active Tab ──
  const filteredRequests = allRequests.filter(req => {
    if (activeTab === 'upcoming') {
      return req.status !== 'Completed';
    } else {
      return req.status === 'Completed';
    }
  });

  // ── 2. Group by Booking ID ──
  const groupedMap = filteredRequests.reduce((acc, curr) => {
    const key = curr.bookingId || 'Unknown';
    if (!acc[key]) {
      acc[key] = {
        bookingId: key,
        guestName: curr.guestName || 'Guest',
        createdAt: curr.createdAt, // taking latest
        requests: []
      };
    }
    // Update latest timestamp
    if (curr.createdAt && acc[key].createdAt) {
      if (curr.createdAt.toMillis() > acc[key].createdAt.toMillis()) {
        acc[key].createdAt = curr.createdAt;
      }
    }
    acc[key].requests.push(curr);
    return acc;
  }, {} as Record<string, any>);

  const groupedRequests = Object.values(groupedMap).sort((a: any, b: any) => {
    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return timeB - timeA;
  });

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-gray-50 h-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Service Requests</h2>
          <p className="text-gray-500 mt-1">Manage guest service requests grouped by booking.</p>
        </div>
        
        {/* Tabs for Upcoming/Previous */}
        <div className="flex bg-gray-200/60 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'upcoming' 
                ? 'bg-white text-green-700 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('previous')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'previous' 
                ? 'bg-white text-green-700 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
            }`}
          >
            Previous
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        ) : groupedRequests.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No {activeTab} service requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                  <th className="px-6 py-4 font-semibold">Guest / Booking</th>
                  <th className="px-6 py-4 font-semibold">Services Requested</th>
                  <th className="px-6 py-4 font-semibold">Last Update</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupedRequests.map((group: any) => {
                  const isExpanded = expandedId === group.bookingId;
                  
                  // Collect all services across all requests in this group for the overview row
                  const allServices = group.requests.flatMap((r: any) => r.services || []);

                  return (
                    <React.Fragment key={group.bookingId}>
                      {/* ── Main Group Row ── */}
                      <tr className={`transition-colors border-b border-gray-100 ${isExpanded ? 'bg-green-50/40' : 'hover:bg-gray-50/50'}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {(group.guestName || 'G').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900">{group.guestName}</div>
                              <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                <Hash className="w-3 h-3" />{group.bookingId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {allServices.slice(0, 3).map((s: string, i: number) => (
                              <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full border border-gray-200 truncate max-w-[150px]">
                                {s}
                              </span>
                            ))}
                            {allServices.length > 3 && (
                              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full border border-gray-200">
                                +{allServices.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {group.createdAt?.toDate ? group.createdAt.toDate().toLocaleString() : 'Just now'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => toggleExpand(group)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-medium text-sm ${
                              isExpanded ? 'bg-green-600 text-white shadow-md' : 'bg-green-50 text-green-700 hover:bg-green-100'
                            }`}
                          >
                            <Settings2 className="w-4 h-4" />
                            Manage ({group.requests.length})
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>

                      {/* ── Expanded Panel (Shows ALL orders in the booking) ── */}
                      {isExpanded && (
                        <tr key={`${group.bookingId}-panel`}>
                          <td colSpan={4} className="px-4 pb-4 pt-0 bg-green-50/20">
                            <div className="border border-green-200 rounded-2xl overflow-hidden shadow-md">

                              {/* Panel Header */}
                              <div className="bg-gradient-to-r from-green-700 to-green-500 px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-green-100 text-sm">
                                  <Hash className="w-3.5 h-3.5" />
                                  <span className="font-mono font-medium">{group.bookingId}</span>
                                </div>
                                <button
                                  onClick={() => setExpandedId(null)}
                                  className="w-7 h-7 flex items-center justify-center bg-white/20 hover:bg-white/40 rounded-full transition-colors flex-shrink-0"
                                >
                                  <X className="w-4 h-4 text-white" />
                                </button>
                              </div>

                              {/* Panel Body: Render each request in the group */}
                              <div className="bg-white px-6 py-5 space-y-6">
                                {group.requests.map((request: any, reqIdx: number) => {
                                  const state = editState[request.id];
                                  if (!state) return null;
                                  const reqServices: string[] = request.services || [];

                                  return (
                                    <div key={request.id} className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                                      {/* Order Header */}
                                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                                        <div className="text-xs font-semibold text-gray-500 uppercase">
                                          Order #{reqIdx + 1} • {request.createdAt?.toDate ? request.createdAt.toDate().toLocaleTimeString() : ''}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <label className="text-xs font-medium text-gray-500">Status:</label>
                                          <select
                                            value={state.status}
                                            onChange={(e) => updateTopField(request.id, 'status', e.target.value)}
                                            className={`text-xs font-semibold px-2 py-1 rounded-full outline-none border focus:ring-2 focus:ring-green-400 ${getStatusColor(state.status)}`}
                                          >
                                            <option value="Pending">Pending</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Awaiting Confirmation">Awaiting Confirmation</option>
                                          </select>
                                        </div>
                                      </div>

                                      {/* Services inside this order */}
                                      <div className="space-y-3">
                                        {reqServices.map((serviceName, svcIdx) => {
                                          const svcState = state.serviceDetails?.[serviceName] || { price: '', deliveryTime: '', suggestions: [] };
                                          const suggestions: string[] = svcState.suggestions || [];
                                          const confirmedOption = (request.serviceDetails || {})[serviceName]?.confirmedOption;

                                          return (
                                            <div key={svcIdx} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                                              <div className="flex items-center justify-between gap-3 px-4 py-3">
                                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                  <span className="text-sm font-semibold text-gray-800 truncate">{serviceName}</span>
                                                  {confirmedOption && (
                                                    <span className="text-xs bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                                                      ✓ {confirmedOption}
                                                    </span>
                                                  )}
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                  <div className="relative">
                                                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                    <input
                                                      type="number" min="0" placeholder="Price"
                                                      value={svcState.price}
                                                      onChange={(e) => updateServiceField(request.id, serviceName, 'price', e.target.value)}
                                                      className="w-24 pl-7 pr-2 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-400 bg-white"
                                                    />
                                                  </div>
                                                  <div className="relative">
                                                    <Timer className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                    <input
                                                      type="text" placeholder="e.g. 30 mins"
                                                      value={svcState.deliveryTime}
                                                      onChange={(e) => updateServiceField(request.id, serviceName, 'deliveryTime', e.target.value)}
                                                      className="w-32 pl-7 pr-2 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-400 bg-white"
                                                    />
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Suggestions */}
                                              <div className="px-4 py-3 bg-amber-50/60 border-t border-amber-100">
                                                <div className="flex items-center gap-1.5 mb-2">
                                                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                                                  <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                                                    Suggest Options
                                                  </span>
                                                </div>

                                                {suggestions.length > 0 && (
                                                  <div className="flex flex-wrap gap-1.5 mb-2">
                                                    {suggestions.map((opt, optIdx) => (
                                                      <span
                                                        key={optIdx}
                                                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${
                                                          confirmedOption === opt
                                                            ? 'bg-purple-100 text-purple-700 border-purple-300'
                                                            : 'bg-white text-amber-700 border-amber-300'
                                                        }`}
                                                      >
                                                        {confirmedOption === opt && <span>✓ </span>}
                                                        {opt}
                                                        <button
                                                          onClick={() => removeSuggestion(request.id, serviceName, optIdx)}
                                                          className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors"
                                                        >
                                                          <X className="w-3 h-3" />
                                                        </button>
                                                      </span>
                                                    ))}
                                                  </div>
                                                )}

                                                <div className="flex items-center gap-2">
                                                  <input
                                                    type="text"
                                                    placeholder="Add option (e.g. Hot)"
                                                    value={suggestionInput[request.id]?.[svcIdx] || ''}
                                                    onChange={(e) =>
                                                      setSuggestionInput((prev) => ({
                                                        ...prev,
                                                        [request.id]: { ...(prev[request.id] || {}), [svcIdx]: e.target.value },
                                                      }))
                                                    }
                                                    onKeyDown={(e) => {
                                                      if (e.key === 'Enter') { e.preventDefault(); addSuggestion(request.id, serviceName, svcIdx); }
                                                    }}
                                                    className="flex-1 text-xs px-3 py-1.5 border border-amber-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-300 bg-white placeholder:text-gray-300"
                                                  />
                                                  <button
                                                    onClick={() => addSuggestion(request.id, serviceName, svcIdx)}
                                                    className="inline-flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                                                  >
                                                    <Plus className="w-3 h-3" /> Add
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                      
                                      {/* Order ETA & Total */}
                                      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
                                        <div>
                                          <label className="block text-xs font-medium text-gray-500 mb-1">ETA for this order</label>
                                          <input
                                            type="text" value={state.eta} placeholder="e.g. 1 hour"
                                            onChange={(e) => updateTopField(request.id, 'eta', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-400 bg-white"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-500 mb-1">Total Price ($)</label>
                                          <input
                                            type="number" value={state.totalPrice} placeholder="0.00"
                                            onChange={(e) => updateTopField(request.id, 'totalPrice', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-400 bg-white"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}

                                {/* Save Button for the entire booking group */}
                                <div className="flex justify-end pt-4 mt-2 border-t border-gray-200">
                                  <button
                                    onClick={() => handleSaveGroup(group)}
                                    disabled={saving === group.bookingId}
                                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg text-sm"
                                  >
                                    {saving === group.bookingId
                                      ? <Loader2 className="w-4 h-4 animate-spin" />
                                      : <Save className="w-4 h-4" />}
                                    {saving === group.bookingId ? 'Saving...' : 'Save All & Notify Guest'}
                                  </button>
                                </div>

                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
