import React, { createContext, useCallback, useContext, useState, useRef } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const abortRef = useRef(null);

  const fetchItems = useCallback(async ({ page = 1, limit = 20, q = '' } = {}) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(
        `http://localhost:3001/api/items?page=${page}&limit=${limit}&q=${encodeURIComponent(q)}`,
        { signal: controller.signal }
      );
      const json = await res.json();
      setItems(json || []);
      setTotal(json.length || 0);
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Fetch error:', err);
    }
  }, []);

  return (
    <DataContext.Provider value={{ items, total, fetchItems }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
