'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { isSubdomainRequest } from '@/lib/subdomain-utils';

// Define available currencies (PKR first as default)
export const AVAILABLE_CURRENCIES = {
  'PKR': { 
    name: 'Rs (Rupees)', 
    symbol: '₨', // Unicode rupee symbol
    code: 'PKR',
    position: 'before'
  },
  'USD': { 
    name: 'US Dollar', 
    symbol: '$', // Standard dollar symbol
    code: 'USD',
    position: 'before' // before or after the amount
  },
  'AED': { 
    name: 'Dirham', 
    symbol: '&#xe001;', // Custom font character
    code: 'AED',
    position: 'before'
  }
} as const;

export type CurrencyCode = keyof typeof AVAILABLE_CURRENCIES;

interface CurrencyContextType {
  currentCurrency: CurrencyCode;
  currencySettings: typeof AVAILABLE_CURRENCIES[CurrencyCode];
  availableCurrencies: typeof AVAILABLE_CURRENCIES;
  setCurrency: (currency: CurrencyCode) => Promise<void>;
  refreshCurrency: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

interface CurrencyProviderProps {
  children: ReactNode;
}

// Helper function to get currency from localStorage
const getCurrencyFromStorage = (): CurrencyCode => {
  if (typeof window === 'undefined') return 'PKR';
  
  try {
    const stored = localStorage.getItem('selectedCurrency');
    if (stored && AVAILABLE_CURRENCIES[stored as CurrencyCode]) {
      return stored as CurrencyCode;
    }
  } catch (error) {
    console.warn('Failed to read currency from localStorage:', error);
  }
  
  return 'PKR';
};

// Helper function to save currency to localStorage
const saveCurrencyToStorage = (currency: CurrencyCode) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('selectedCurrency', currency);
  } catch (error) {
    console.warn('Failed to save currency to localStorage:', error);
  }
};

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  // Initialize with stored currency or PKR default
  const [currentCurrency, setCurrentCurrency] = useState<CurrencyCode>(() => getCurrencyFromStorage());
  const [loading, setLoading] = useState(false); // Start with false to prevent initial flash
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();

  // Fetch current currency settings only when user is authenticated and on a subdomain
  useEffect(() => {
    // Check if we're on a subdomain (tenant) or main domain
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const isSubdomain = isSubdomainRequest(hostname);
    
    if (status === 'authenticated' && session && isSubdomain) {
      fetchCurrencySettings();
    } else if (status !== 'loading') {
      // User is not authenticated or on main domain, ensure we have the stored currency
      const storedCurrency = getCurrencyFromStorage();
      setCurrentCurrency(storedCurrency);
      setLoading(false);
    }
    // Don't do anything if status is 'loading'
  }, [status, session]);

  const fetchCurrencySettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/settings/currency');
      if (!response.ok) {
        // Don't throw error, just log and use stored/default
        console.warn('Failed to fetch currency settings, using stored/default PKR');
        const storedCurrency = getCurrencyFromStorage();
        setCurrentCurrency(storedCurrency);
        return;
      }
      
      const data = await response.json();
      const fetchedCurrency = data.currentCurrency || 'PKR';
      setCurrentCurrency(fetchedCurrency);
      // Save to localStorage for future use
      saveCurrencyToStorage(fetchedCurrency);
    } catch (err: any) {
      console.error('Error fetching currency settings:', err);
      // Don't set error state to avoid breaking the UI
      // Just fallback to stored/default currency silently
      const storedCurrency = getCurrencyFromStorage();
      setCurrentCurrency(storedCurrency);
    } finally {
      setLoading(false);
    }
  };

  const setCurrency = async (currency: CurrencyCode) => {
    try {
      setError(null);
      
      // Immediately update local state and localStorage for instant feedback
      setCurrentCurrency(currency);
      saveCurrencyToStorage(currency);
      
      const response = await fetch('/api/settings/currency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update currency');
      }
      
      const result = await response.json();
      // Confirm the currency was set correctly
      setCurrentCurrency(result.currentCurrency);
      saveCurrencyToStorage(result.currentCurrency);
    } catch (err: any) {
      console.error('Error updating currency:', err);
      setError(err.message);
      throw err;
    }
  };

  const refreshCurrency = async () => {
    await fetchCurrencySettings();
  };

  const value: CurrencyContextType = {
    currentCurrency,
    currencySettings: AVAILABLE_CURRENCIES[currentCurrency],
    availableCurrencies: AVAILABLE_CURRENCIES,
    setCurrency,
    refreshCurrency,
    loading,
    error,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}; 