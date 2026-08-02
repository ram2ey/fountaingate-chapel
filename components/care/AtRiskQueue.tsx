'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';

export const AtRiskQueue: React.FC = () => {
  const { members, updateMember, addCareNote } = useChurch();
  const atRiskMembers = members.filter(m => m.status === 'at_risk');

  const [activeCareModalMemberId, setActiveCareModalMemberId] = useState<string | null>(null);
  const [careNoteText, setCareNoteText] = useState('');
  const [actionItem, setActionItem] = useState('Home visitation scheduled for Saturday');
  const [isConfidential, setIsConfidential] = useState(true);

  const handleSaveCareVisit = (memberId: string, memberName: string) => {
    if (!careNoteText) return;

    addCareNote({
      member_id: memberId,
      member_name: memberName,
      pastor_id: 'p1',
      pastor_name: 'Rev. Dr. Eastwood Anaba',
      note: careNoteText,
      is_confidential: isConfidential,
      action_item: actionItem,
      follow_up_date: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0]
    });

    updateMember(memberId, { consecutive_absences: 1, status: 'active' });

    setActiveCareModalMemberId(null);
    setCareNoteText('');
  };

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-lg text-white">
            Automated "At-Risk" Member Intervention Queue
          </h3>
          <p className="text-xs text-slate-400">
            Engine automatically flags active members with 3+ consecutive missed services for pastoral care.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30">
          {atRiskMembers.length} Members Needing Outreach
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {atRiskMembers.length === 0 ? (
          <div className="col-span-2 p-8 text-center border border-dashed border-slate-800 rounded-2xl">
            <h4 className="font-bold text-slate-200 text-sm">All Members Are Actively Engaged!</h4>
            <p className="text-xs text-slate-400 mt-1">No member currently meets the 3-week absence threshold.</p>
          </div>
        ) : (
          atRiskMembers.map(member => (
            <div key={member.id} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                    {member.first_name[0]}{member.last_name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 text-sm">{member.first_name} {member.last_name}</h4>
                    <p className="text-[11px] text-slate-400">{member.cell_group} • {member.phone}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                  {member.consecutive_absences} Wks Missed
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-300 flex items-center justify-between">
                <span className="text-slate-400">Last Attended: {member.last_attended_at}</span>
                <span className="text-amber-400 font-semibold">Priority Pastoral Outreach</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}?text=Shalom%20${encodeURIComponent(member.first_name)}%2C%20we%20missed%20you%20at%20Fountain%20Gate%20Chapel!%20Pastoral%20care%20team.`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs text-center shadow-md transition"
                >
                  1-Click WhatsApp
                </a>

                <button
                  onClick={() => setActiveCareModalMemberId(member.id)}
                  className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition"
                >
                  Assign Care Visit
                </button>
              </div>

              {/* Care Visit Drawer Input */}
              {activeCareModalMemberId === member.id && (
                <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-indigo-500/40 space-y-2 animate-in fade-in">
                  <span className="text-[11px] font-bold text-indigo-300 block">Record Pastoral Counseling / Visit Note</span>
                  <textarea
                    rows={2}
                    value={careNoteText}
                    onChange={(e) => setCareNoteText(e.target.value)}
                    placeholder="Describe pastoral conversation or counseling details..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex items-center justify-between text-[11px]">
                    <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isConfidential}
                        onChange={(e) => setIsConfidential(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-indigo-600"
                      />
                      <span>Mark Confidential</span>
                    </label>
                    <button
                      onClick={() => handleSaveCareVisit(member.id, `${member.first_name} ${member.last_name}`)}
                      className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-500"
                    >
                      Save & Resolve
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
