'use client';

import React from 'react';
import { UserProfileSettings } from '../../components/settings/UserProfileSettings';

export default function SettingsPage() {
  return (
    <div className="space-y-6 pb-8 max-w-4xl mx-auto">
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
          User Account Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your profile details, interface language preferences, and mobile notification triggers.
        </p>
      </div>

      <UserProfileSettings />
    </div>
  );
}
