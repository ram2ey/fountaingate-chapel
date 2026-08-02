'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import { DocumentCategory, PastoralDocument } from '../../lib/types/church';

export default function PastoralDocumentsPage() {
  const {
    pastoralDocuments,
    addPastoralDocument,
    updatePastoralDocument,
    deletePastoralDocument,
    currentRole,
    currentUser
  } = useChurch();

  const isPastorOrAdmin = currentRole === 'admin' || currentRole === 'pastor';

  const [selectedDoc, setSelectedDoc] = useState<PastoralDocument | null>(pastoralDocuments[0] || null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('✓ Saved to cloud');

  // Create Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<DocumentCategory>('Sermon Outline');
  const [newContent, setNewContent] = useState('');

  if (!isPastorOrAdmin) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 mx-auto flex items-center justify-center font-bold text-2xl">
          🔒
        </div>
        <h2 className="font-display font-bold text-2xl text-slate-900">Access Restricted to Pastoral Team</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Pastoral care action plans, sermon outlines, and leadership documents are restricted to Pastor and Admin roles.
        </p>
      </div>
    );
  }

  const handleContentChange = (content: string) => {
    if (!selectedDoc) return;
    setSaveStatus('Saving...');

    updatePastoralDocument(selectedDoc.id, {
      content,
      last_edited_by_name: currentUser?.full_name || 'Pastor'
    });

    setSelectedDoc(prev => prev ? { ...prev, content, last_edited_by_name: currentUser?.full_name || 'Pastor' } : null);

    setTimeout(() => {
      setSaveStatus('✓ Saved to cloud');
    }, 600);
  };

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;

    addPastoralDocument({
      title: newTitle,
      category: newCategory,
      content: newContent,
      created_by_name: currentUser?.full_name || 'Pastor',
      last_edited_by_name: currentUser?.full_name || 'Pastor'
    });

    setShowCreateModal(false);
    setNewTitle('');
    setNewContent('');
  };

  const handleWhatsAppShare = () => {
    if (!selectedDoc) return;
    const text = encodeURIComponent(`*${selectedDoc.title}*\n_${selectedDoc.category}_\n\n${selectedDoc.content}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
            Pastoral Collaborative Documents
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Simultaneous document editing for sermon outlines, Sunday service run of shows, and care plans.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition self-start sm:self-auto"
        >
          + Create New Document
        </button>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document List Sidebar */}
        <div className="glass-panel p-4 bg-white border border-slate-200 shadow-sm space-y-3 lg:col-span-1">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-display font-bold text-sm text-slate-900">Document Library ({pastoralDocuments.length})</h3>
            <span className="text-[10px] font-bold text-indigo-700 uppercase">Live Synced</span>
          </div>

          <div className="space-y-2">
            {pastoralDocuments.map(doc => (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`p-3.5 border cursor-pointer transition text-xs space-y-1 ${
                  selectedDoc?.id === doc.id
                    ? 'bg-indigo-50/80 border-indigo-400 font-bold'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                    {doc.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{doc.created_at}</span>
                </div>
                <h4 className="font-display font-bold text-slate-900 text-sm line-clamp-1">{doc.title}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-2">{doc.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Live Collaborative Document Editor */}
        <div className="lg:col-span-2 space-y-4">
          {selectedDoc ? (
            <div className="glass-panel p-6 bg-white border border-slate-200 shadow-md space-y-4">
              {/* Document Metadata Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="px-2.5 py-0.5 bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
                    {selectedDoc.category}
                  </span>
                  <h2 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 mt-1">
                    {selectedDoc.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1">
                    {saveStatus}
                  </span>

                  <button
                    onClick={handleWhatsAppShare}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs"
                    title="Share document to WhatsApp team"
                  >
                    💬 Share WhatsApp
                  </button>

                  {currentRole === 'admin' && (
                    <button
                      onClick={() => {
                        deletePastoralDocument(selectedDoc.id);
                        setSelectedDoc(pastoralDocuments.find(d => d.id !== selectedDoc.id) || null);
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Active Pastoral Collaborators Presence Bar */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs text-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Collaborating Pastors:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 bg-indigo-600 text-white font-bold text-[10px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Rev. Eastwood Anaba (Active)
                    </span>
                    <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Pastor Kwame Boateng (Active)
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold hidden sm:inline">
                  Last edited by: {selectedDoc.last_edited_by_name} ({selectedDoc.last_edited_at})
                </span>
              </div>

              {/* Text Area Content Editor */}
              <div className="space-y-1">
                <label className="block text-slate-700 font-bold text-xs">Live Document Content Editor</label>
                <textarea
                  rows={14}
                  value={selectedDoc.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 p-4 font-mono text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white resize-y leading-relaxed"
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-16 p-6 bg-white border border-slate-200 space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 mx-auto flex items-center justify-center font-bold text-xl">
                📄
              </div>
              <h3 className="font-display font-bold text-slate-900 text-base">No Document Selected</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select a document from the library list or create a new sermon outline.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900">Create Pastoral Document</h3>
                <p className="text-xs text-slate-500">New collaborative document for the pastoral team</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Sunday Order of Service — Aug 3"
                  className="w-full bg-slate-50 border border-slate-300 p-3 text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Document Category *</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as DocumentCategory)}
                  className="w-full bg-slate-50 border border-slate-300 p-3 text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white"
                >
                  <option value="Sermon Outline">Sermon Outline</option>
                  <option value="Sunday Service Order">Sunday Service Order</option>
                  <option value="Pastoral Meeting Agenda">Pastoral Meeting Agenda</option>
                  <option value="Counseling Action Plan">Counseling Action Plan</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Initial Document Content *</label>
                <textarea
                  required
                  rows={6}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Type document outline or agenda details..."
                  className="w-full bg-slate-50 border border-slate-300 p-3 font-mono text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md"
                >
                  Create Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
