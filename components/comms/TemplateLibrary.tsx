'use client';

import React from 'react';

const TEMPLATES = [
  {
    title: 'Sunday Service Reminder',
    category: 'Weekly Announcement',
    text: 'Shalom Beloved, join us this Sunday at Fountain Gate Chapel for a powerful time of worship and word. Service starts at 8:30 AM.'
  },
  {
    title: 'First-Time Guest Welcome',
    category: 'Visitor Follow-up',
    text: 'God bless you for worshipping with Fountain Gate Chapel today! We are honored to have you. Our pastoral team looks forward to connecting.'
  },
  {
    title: 'Mid-week Teaching Service',
    category: 'Bible Study',
    text: 'Beloved member, join us for our Mid-week Teaching & Deliverance service this Wednesday at 6:00 PM. Come ready for prayer and Bible study.'
  }
];

interface Props {
  onSelectTemplate: (text: string) => void;
}

export const TemplateLibrary: React.FC<Props> = ({ onSelectTemplate }) => {
  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div>
        <h4 className="font-display font-bold text-base text-slate-900">Broadcast Message Templates</h4>
        <p className="text-xs text-slate-500">Pre-formatted templates for pastoral announcements</p>
      </div>

      <div className="space-y-3">
        {TEMPLATES.map((tmpl, idx) => (
          <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-slate-900 text-xs">{tmpl.title}</h5>
              <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                {tmpl.category}
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">{tmpl.text}</p>
            <button
              onClick={() => onSelectTemplate(tmpl.text)}
              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition shadow-xs"
            >
              Use Template →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
