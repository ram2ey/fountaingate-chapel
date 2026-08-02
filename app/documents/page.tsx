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
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string>('✓ File saved');

  // Upload Modal State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<DocumentCategory>('Sermon Outline');
  const [newFileType, setNewFileType] = useState<'docx' | 'pptx' | 'pdf'>('pptx');
  const [newContent, setNewContent] = useState('');
  const [slideCount, setSlideCount] = useState<number>(4);

  if (!isPastorOrAdmin) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 mx-auto flex items-center justify-center font-bold text-2xl">
          🔒
        </div>
        <h2 className="font-display font-bold text-2xl text-slate-900">Access Restricted to Pastoral Team</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Pastoral PowerPoint sermon decks (.pptx) and Word documents (.docx) are restricted to Pastor and Admin roles.
        </p>
      </div>
    );
  }

  const handleSelectDoc = (doc: PastoralDocument) => {
    setSelectedDoc(doc);
    setActiveSlideIndex(0);
  };

  const handleUploadDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;

    let generatedSlides = undefined;
    if (newFileType === 'pptx') {
      generatedSlides = [
        { slide_number: 1, title: newTitle, body: newContent },
        { slide_number: 2, title: 'Key Scripture & Foundation', body: 'Scripture exposition and core message points for sanctuary projection.' },
        { slide_number: 3, title: 'Application & Ministry Call', body: 'Practical action steps for believers and altar ministry.' }
      ];
    }

    const createdDoc: PastoralDocument = {
      id: `doc-${Date.now()}`,
      title: newTitle.endsWith(`.${newFileType}`) ? newTitle : `${newTitle}.${newFileType}`,
      category: newCategory,
      file_type: newFileType,
      file_size: `${(Math.random() * 3 + 1).toFixed(1)} MB`,
      download_url: `/documents/${newTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${newFileType}`,
      content: newContent,
      slides: generatedSlides,
      created_by_name: currentUser?.full_name || 'Pastor',
      last_edited_by_name: currentUser?.full_name || 'Pastor',
      last_edited_at: 'Just now',
      created_at: new Date().toISOString().split('T')[0]
    };

    addPastoralDocument(createdDoc);
    setSelectedDoc(createdDoc);
    setActiveSlideIndex(0);
    setShowUploadModal(false);
    setNewTitle('');
    setNewContent('');
  };

  const handleWhatsAppShare = () => {
    if (!selectedDoc) return;
    const text = encodeURIComponent(
      `*${selectedDoc.title}*\n📁 Category: ${selectedDoc.category}\n📄 Format: ${selectedDoc.file_type.toUpperCase()} (${selectedDoc.file_size})\n\nShared from Fountain Gate Chapel Pastoral Document Vault.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleDownload = () => {
    if (!selectedDoc) return;
    const blob = new Blob([selectedDoc.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedDoc.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
            Pastoral Word & PowerPoint Vault
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Shared document drive for PowerPoint slide decks (.pptx) and Word documents (.docx).
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition self-start sm:self-auto"
        >
          + Upload .docx / .pptx File
        </button>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Library Sidebar */}
        <div className="glass-panel p-4 bg-white border border-slate-200 shadow-sm space-y-3 lg:col-span-1">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-display font-bold text-sm text-slate-900">Pastoral File Drive ({pastoralDocuments.length})</h3>
            <span className="text-[10px] font-bold text-indigo-700 uppercase">Cloud Synced</span>
          </div>

          <div className="space-y-2">
            {pastoralDocuments.map(doc => (
              <div
                key={doc.id}
                onClick={() => handleSelectDoc(doc)}
                className={`p-3.5 border cursor-pointer transition text-xs space-y-2 ${
                  selectedDoc?.id === doc.id
                    ? 'bg-indigo-50/80 border-indigo-400 font-bold'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 text-white text-[10px] font-extrabold uppercase ${
                    doc.file_type === 'pptx' ? 'bg-amber-600' : 'bg-indigo-600'
                  }`}>
                    {doc.file_type === 'pptx' ? '📊 PPTX Deck' : '📄 DOCX Word'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{doc.file_size}</span>
                </div>

                <div>
                  <h4 className="font-display font-bold text-slate-900 text-sm line-clamp-1">{doc.title}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">{doc.category} • Updated by {doc.last_edited_by_name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Viewer Pane */}
        <div className="lg:col-span-2 space-y-4">
          {selectedDoc ? (
            <div className="glass-panel p-6 bg-white border border-slate-200 shadow-md space-y-4">
              {/* Document Action Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 text-white text-[10px] font-extrabold uppercase ${
                      selectedDoc.file_type === 'pptx' ? 'bg-amber-600' : 'bg-indigo-600'
                    }`}>
                      {selectedDoc.file_type === 'pptx' ? 'PowerPoint Presentation (.pptx)' : 'Microsoft Word Document (.docx)'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{selectedDoc.file_size}</span>
                  </div>
                  <h2 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 mt-1">
                    {selectedDoc.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleDownload}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                  >
                    <span>⬇ Download {selectedDoc.file_type.toUpperCase()}</span>
                  </button>

                  <button
                    onClick={handleWhatsAppShare}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs"
                    title="Share file link to WhatsApp"
                  >
                    💬 WhatsApp Share
                  </button>

                  {currentRole === 'admin' && (
                    <button
                      onClick={() => {
                        deletePastoralDocument(selectedDoc.id);
                        const remaining = pastoralDocuments.filter(d => d.id !== selectedDoc.id);
                        setSelectedDoc(remaining[0] || null);
                      }}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Viewer Mode 1: PowerPoint (.pptx) Slide Deck Previewer */}
              {selectedDoc.file_type === 'pptx' && selectedDoc.slides && selectedDoc.slides.length > 0 && (
                <div className="space-y-4">
                  {/* Active Slide Projection Screen */}
                  <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl min-h-[260px] flex flex-col justify-between relative overflow-hidden border border-slate-800">
                    <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                      <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px]">
                        SLIDE {activeSlideIndex + 1} OF {selectedDoc.slides.length} — FOUNTAIN GATE CHAPEL
                      </span>
                      {selectedDoc.slides[activeSlideIndex].scripture && (
                        <span className="text-indigo-200 font-semibold italic text-[11px]">
                          📖 {selectedDoc.slides[activeSlideIndex].scripture}
                        </span>
                      )}
                    </div>

                    <div className="my-auto py-4 space-y-3">
                      <h3 className="font-display font-extrabold text-xl sm:text-3xl text-white tracking-tight">
                        {selectedDoc.slides[activeSlideIndex].title}
                      </h3>
                      <p className="text-sm sm:text-base text-slate-200 whitespace-pre-line leading-relaxed font-medium">
                        {selectedDoc.slides[activeSlideIndex].body}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                      <span className="text-slate-400 text-[10px]">Preacher: {selectedDoc.created_by_name}</span>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={activeSlideIndex === 0}
                          onClick={() => setActiveSlideIndex(prev => Math.max(0, prev - 1))}
                          className="px-3 py-1 bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white font-bold text-xs border border-white/20"
                        >
                          ◀ Previous Slide
                        </button>
                        <button
                          disabled={activeSlideIndex === selectedDoc.slides.length - 1}
                          onClick={() => setActiveSlideIndex(prev => Math.min(selectedDoc.slides!.length - 1, prev + 1))}
                          className="px-3 py-1 bg-amber-400 hover:bg-amber-300 disabled:opacity-30 text-slate-950 font-extrabold text-xs shadow-sm"
                        >
                          Next Slide ▶
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Slide Thumbnails Selector Row */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Slide Deck:</span>
                    {selectedDoc.slides.map((slide, idx) => (
                      <button
                        key={slide.slide_number}
                        onClick={() => setActiveSlideIndex(idx)}
                        className={`px-3 py-2 text-left shrink-0 border transition text-xs ${
                          activeSlideIndex === idx
                            ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Slide {idx + 1}: {slide.title.substring(0, 18)}...
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Viewer Mode 2: Word (.docx) Document Reader */}
              {selectedDoc.file_type === 'docx' && (
                <div className="p-6 bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-xs text-indigo-900 uppercase">📄 Word Document Layout Preview</span>
                    <span className="text-[10px] text-slate-500">Author: {selectedDoc.created_by_name}</span>
                  </div>
                  <div className="p-6 bg-white border border-slate-200 shadow-xs font-serif text-slate-900 text-xs sm:text-sm whitespace-pre-line leading-relaxed">
                    {selectedDoc.content}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 p-6 bg-white border border-slate-200 space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 mx-auto flex items-center justify-center font-bold text-xl">
                📂
              </div>
              <h3 className="font-display font-bold text-slate-900 text-base">No Document Selected</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select a PowerPoint (.pptx) slide deck or Word (.docx) document from the file drive.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900">Upload Pastoral Document</h3>
                <p className="text-xs text-slate-500">Add Microsoft Word (.docx) or PowerPoint (.pptx) files</p>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="w-8 h-8 bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Document File Name *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Sunday_Sermon_Slides_Aug3"
                  className="w-full bg-slate-50 border border-slate-300 p-3 text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">File Format *</label>
                  <select
                    value={newFileType}
                    onChange={(e) => setNewFileType(e.target.value as 'docx' | 'pptx' | 'pdf')}
                    className="w-full bg-slate-50 border border-slate-300 p-3 text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white"
                  >
                    <option value="pptx">PowerPoint (.pptx)</option>
                    <option value="docx">Microsoft Word (.docx)</option>
                    <option value="pdf">PDF Document (.pdf)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category *</label>
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
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Document Content / Outline Notes *</label>
                <textarea
                  required
                  rows={5}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Paste document text or sermon points..."
                  className="w-full bg-slate-50 border border-slate-300 p-3 font-mono text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md"
                >
                  Upload Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
