'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Currency = 'USD' | 'PEN' | 'BRL';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  symbol: string;
}

const symbols: Record<Currency, string> = {
  USD: '$',
  PEN: 'S/',
  BRL: 'R$',
};

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'USD',
  setCurrency: () => {},
  symbol: '$',
});

export const useCurrency = () => useContext(CurrencyContext);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('USD');

  useEffect(() => {
    // Cargar configuración guardada
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.currency && ['USD', 'PEN', 'BRL'].includes(data.currency)) {
          setCurrencyState(data.currency as Currency);
        }
      })
      .catch(console.error);
  }, []);

  const setCurrency = async (c: Currency) => {
    setCurrencyState(c);
    // Guardar en backend
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'currency', value: c }),
    });
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, symbol: symbols[currency] }}>
      {children}
    </CurrencyContext.Provider>
  );
}