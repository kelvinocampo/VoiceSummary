// src/providers/ApiKeyProvider.tsx
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  getAllKeys,
  addKey,
  updateKey,
  deleteKey,
  setActiveKey as dbSetActiveKey,
  getActiveKey,
} from '@/services/apiKeyDatabase';

export interface ApiKey {
  id: number;
  name: string;
  key: string;
  active: number;
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
  const [activeKey, setActiveKeyState] = useState<ApiKey | null>(null);

  // Cargar keys desde DB
  const loadKeys = useCallback(async () => {
    try {
      const allKeys = await getAllKeys();
      const active = await getActiveKey();
      setKeys(allKeys || []);
      setActiveKeyState(active || null);
    } catch (error) {
      console.error('Error al cargar API Keys:', error);
    }
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const addNewKey = async (name: string, key: string) => {
    try {
      await addKey(name, key);
      await loadKeys();
    } catch (error) {
      console.error('Error al agregar API Key:', error);
    }
  };

  const editKey = async (id: number, name: string, key: string) => {
    try {
      await updateKey(id, name, key);
      await loadKeys();
    } catch (error) {
      console.error('Error al editar API Key:', error);
    }
  };

  const removeKey = async (id: number) => {
    try {
      await deleteKey(id);
      await loadKeys();
    } catch (error) {
      console.error('Error al eliminar API Key:', error);
    }
  };

  const activateKey = async (id: number) => {
    try {
      await dbSetActiveKey(id);
      await loadKeys();
    } catch (error) {
      console.error('Error al activar API Key:', error);
    }
  };

  return (
    <ApiKeyContext.Provider
      value={{ keys, activeKey, addNewKey, editKey, removeKey, activateKey }}
    >
      {children}
    </ApiKeyContext.Provider>
  );
};
