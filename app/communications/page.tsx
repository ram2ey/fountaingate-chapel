'use client';

import React, { useState } from 'react';
import { BroadcastComposer } from '../../components/comms/BroadcastComposer';
import { TemplateLibrary } from '../../components/comms/TemplateLibrary';

export default function CommunicationsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState('');

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Direct Member Communication Center</h2>
          <p className="text-xs text-slate-400 mt-1">
            Multi-channel WhatsApp API & SMS broadcasts, pre-formatted pastoral templates, and 1-click direct links.
          </p>
        </div>
      </div>

      <BroadcastComposer key={selectedTemplate} initialTemplate={selectedTemplate} />
      <TemplateLibrary onSelectTemplate={(txt) => setSelectedTemplate(txt)} />
    </div>
  );
}
