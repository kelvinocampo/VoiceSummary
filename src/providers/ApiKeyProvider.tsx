// src/providers/ApiKeyProvider.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { getAllKeys, addKey, updateKey, deleteKey, setActiveKey, getActiveKey } from '@/services/apiKeyDatabase';

export interface ApiKey {
  id: number;
  name: string;
  key: string;
  active: boolean;
}

interface ApiKeyContextType {
  keys: ApiKey[];
  activeKey: ApiKey | null;
  addNewKey: (name: string, key: string) => Promise<void>;
  editKey: (id: number, name: string, key: string) => Promise<void>;
  removeKey: (id: number) => Promise<void>;
  activateKey: (id: number) => Promise<void>;
}

export const ApiKeyContext = createContext<ApiKeyContextType>({} as ApiKeyContextType);

export const ApiKeyProvider = ({ children }: { children: ReactNode }) => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [activeKey, setActive] = useState<ApiKey | null>(null);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    const allKeys = await getAllKeys();
    const active = await getActiveKey();
    setKeys(allKeys);
    setActive(active);
  };

  const addNewKey = async (name: string, key: string) => {
    await addKey(name, key);
    await loadKeys();
  };

  const editKey = async (id: number, name: string, key: string) => {
    await updateKey(id, name, key);
    await loadKeys();
  };

  const removeKey = async (id: number) => {
    await deleteKey(id);
    await loadKeys();
  };

  const activateKey = async (id: number) => {
    await setActiveKey(id);
    await loadKeys();
  };

  return (
    <ApiKeyContext.Provider value={{ keys, activeKey, addNewKey, editKey, removeKey, activateKey }}>
      {children}
    </ApiKeyContext.Provider>
  );
};
