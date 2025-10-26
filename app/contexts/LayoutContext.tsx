'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type LayoutType = 'header' | 'sidebar';

interface LayoutContextType {
  layout: LayoutType;
  setLayout: (layout: LayoutType) => void;
  toggleLayout: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [layout, setLayoutState] = useState<LayoutType>('sidebar');

  // Load layout preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('layout-preference');
    if (saved === 'header' || saved === 'sidebar') {
      setLayoutState(saved);
    }
  }, []);

  const setLayout = (newLayout: LayoutType) => {
    setLayoutState(newLayout);
    localStorage.setItem('layout-preference', newLayout);
  };

  const toggleLayout = () => {
    const newLayout = layout === 'header' ? 'sidebar' : 'header';
    setLayout(newLayout);
  };

  return (
    <LayoutContext.Provider value={{ layout, setLayout, toggleLayout }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}