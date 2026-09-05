import React, { createContext, useContext, useState, useCallback } from 'react';

export interface DemoProfile {
  id: string;
  name: string;
  initials: string;
  email: string;
  year: string;
  major: string;
  instagram?: string;
  discord?: string;
}

const DEMO_PROFILES: DemoProfile[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Aisha Johnson',
    initials: 'AJ',
    email: 'ajohnson@calpoly.edu',
    year: 'Junior',
    major: 'Computer Science',
    instagram: '@aisha.codes',
    discord: 'aishaj#9012',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Jordan Kim',
    initials: 'JK',
    email: 'jkim@calpoly.edu',
    year: 'Sophomore',
    major: 'Software Engineering',
    discord: 'jordank#8832',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Maya Patel',
    initials: 'MP',
    email: 'mpatel@calpoly.edu',
    year: 'Junior',
    major: 'Computer Science',
    instagram: '@maya.p',
  },
];

interface DemoUserContextValue {
  currentUser: DemoProfile;
  allProfiles: DemoProfile[];
  switchUser: (id: string) => void;
  getProfile: (id: string) => DemoProfile | undefined;
}

const DemoUserContext = createContext<DemoUserContextValue | null>(null);

export function DemoUserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<DemoProfile>(DEMO_PROFILES[0]);

  const switchUser = useCallback((id: string) => {
    const profile = DEMO_PROFILES.find((p) => p.id === id);
    if (profile) setCurrentUser(profile);
  }, []);

  const getProfile = useCallback(
    (id: string) => DEMO_PROFILES.find((p) => p.id === id),
    [],
  );

  return (
    <DemoUserContext.Provider
      value={{ currentUser, allProfiles: DEMO_PROFILES, switchUser, getProfile }}
    >
      {children}
    </DemoUserContext.Provider>
  );
}

export function useDemoUser(): DemoUserContextValue {
  const ctx = useContext(DemoUserContext);
  if (!ctx) throw new Error('useDemoUser must be inside DemoUserProvider');
  return ctx;
}
