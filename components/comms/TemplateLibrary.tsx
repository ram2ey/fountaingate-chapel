'use client';

import React from 'react';

interface Props {
  onSelectTemplate: (templateText: string) => void;
}

const TEMPLATES = [
  {
    title: 'Sunday Service Reminder',
    category: 'Sunday Operations',
    content: 'Shalom Beloved! Join us tomorrow for Sunday Breakthrough Service at Fountain Gate Chapel. First service: 7:30 AM | Second Service: 10:00 AM. Bring a friend!'
  },
  {
    title: 'Emergency Prayer Call',
    category: 'Intercession',
    content: 'Urgent Call to Prayer: The Prayer Warriors line is open tonight at 10:00 PM. Let us stand in faith for supernatural breakthrough across all families. Zoom ID: 884-291-001.'
  },
  {
    title: 'First-Time Guest Welcome',
    category: 'Retention',
    content: 'Greetings from Fountain Gate Chapel! Thank you for worshipping with us today. We pray the message blessed you. Pastor looks forward to connecting with you this week.'
  },
  {
    title: 'Cell Leaders Briefing',
    category: 'Leadership',
    content: 'Shalom Leaders! Please remember to submit your weekly cell attendance & offering report before 5 PM today. Thank you for your faithful shepherding.'
  }
];

export const TemplateLibrary: React.FC<Props> = ({ onSelectTemplate }) => {
  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
      <div>
        <h3 className="font-display font-bold text-lg text-white">
          Pre-Formatted Pastoral Message Templates
        </h3>
        <p className="text-xs text-slate-400">1-click insert pre-approved broadcast templates into composer</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {TEMPLATES.map((tmpl, idx) => (
          <div key={idx} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">{tmpl.title}</span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold">
                  {tmpl.category}
                </span>
              </div>
              <p className="text-slate-300 text-[11px] mt-2 italic bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                "{tmpl.content}"
              </p>
            </div>

            <button
              onClick={() => onSelectTemplate(tmpl.content)}
              className="mt-3 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs flex items-center justify-center transition border border-slate-700"
            >
              Use This Template
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
