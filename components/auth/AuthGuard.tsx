'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useChurch } from '../../lib/context/ChurchContext';
import { UnavailableState } from '../common/UnavailableState';

const PUBLIC_ROUTES = ['/login', '/kiosk', '/guest-intake'];

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const { currentUser } = useChurch();

  if (!currentUser && !PUBLIC_ROUTES.includes(pathname)) {
    return (
      <UnavailableState
        title="Church portal temporarily unavailable"
        description="The church portal is currently unavailable. Please check back later."
      />
    );
  }

  return <>{children}</>;
};
