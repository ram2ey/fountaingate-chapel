'use client';

import React, { useState } from 'react';
import { BroadcastComposer } from '../../components/comms/BroadcastComposer';
import { TemplateLibrary } from '../../components/comms/TemplateLibrary';

export default function CommunicationsPage() {
  const [selectedTemplateText, setSelectedTemplateText] = useState('');

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
          WhatsApp & SMS Communications
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Direct messaging dispatch center for sanctuary announcements and guest follow-up.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BroadcastComposer initialMessage={selectedTemplateText} />
        </div>
        <div>
          <TemplateLibrary onSelectTemplate={(text) => setSelectedTemplateText(text)} />
        </div>
      </div>
    </div>
  );
}
