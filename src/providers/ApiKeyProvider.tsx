// src/providers/ApiKeyProvider.tsx
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  initDB,
  getAllKeys,
  addKey,
  updateKey,
  deleteKey,
  setActiveKey as dbSetActiveKey,
  getActiveKey,
  getDbStats,
} from '@/services/apiKeyDatabase'; // Asegúrate que el nombre del archivo coincida

export interface ApiKey {
  id: number;
  name: string;
  key: string;
  active: boolean; // Cambiar a boolean
}

interface ApiKeyContextType {
  keys: ApiKey[];
  activeKey: ApiKey | null;
  isLoading: boolean;
  addNewKey: (name: string, key: string) => Promise<void>;
  editKey: (id: number, name: string, key: string) => Promise<void>;
  removeKey: (id: number) => Promise<void>;
  activateKey: (id: number) => Promise<void>;
  refreshKeys: () => Promise<void>;
}

export const ApiKeyContext = createContext<ApiKeyContextType>({
  keys: [],
  activeKey: null,
  isLoading: false,
  addNewKey: async () => {},
  editKey: async () => {},
  removeKey: async () => {},
  activateKey: async () => {},
  refreshKeys: async () => {},
});

export const ApiKeyProvider = ({ children }: { children: ReactNode }) => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [activeKey, setActiveKeyState] = useState<ApiKey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Inicializar base de datos
  const initializeDB = useCallback(async () => {
    try {
      console.log('Initializing database...');
      await initDB();
      setIsInitialized(true);
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      setIsInitialized(false);
    }
  }, []);

  // Cargar keys desde DB
  const loadKeys = useCallback(async () => {
    if (!isInitialized) return;
    
    try {
      setIsLoading(true);
      console.log('Loading keys from database...');
      
      const [allKeys, active, stats] = await Promise.all([
        getAllKeys(),
        getActiveKey(),
        getDbStats()
      ]);
      
      console.log('Database stats:', stats);
      console.log('Loaded keys:', allKeys?.length || 0);
      console.log('Active key:', active?.name || 'none');
      
      setKeys(allKeys || []);
      setActiveKeyState(active || null);
    } catch (error) {
      console.error('Error loading API Keys:', error);
      setKeys([]);
      setActiveKeyState(null);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // Inicializar al montar el componente
  useEffect(() => {
    initializeDB();
  }, [initializeDB]);

  // Cargar keys cuando la DB esté inicializada
  useEffect(() => {
    if (isInitialized) {
      loadKeys();
    }
  }, [isInitialized, loadKeys]);

  // Función pública para refrescar keys
  const refreshKeys = useCallback(async () => {
    await loadKeys();
  }, [loadKeys]);

  const addNewKey = async (name: string, key: string) => {
    try {
      console.log('Adding new key:', name);
      await addKey(name.trim(), key.trim());
      await loadKeys();
      console.log('Key added successfully');
    } catch (error) {
      console.error('Error adding API Key:', error);
      throw error;
    }
  };

  const editKey = async (id: number, name: string, key: string) => {
    try {
      console.log('Editing key:', id, name);
      await updateKey(id, name.trim(), key.trim());
      await loadKeys();
      console.log('Key edited successfully');
    } catch (error) {
      console.error('Error editing API Key:', error);
      throw error;
    }
  };

  const removeKey = async (id: number) => {
    try {
      console.log('Removing key:', id);
      await deleteKey(id);
      await loadKeys();
      console.log('Key removed successfully');
    } catch (error) {
      console.error('Error removing API Key:', error);
      throw error;
    }
  };

  const activateKey = async (id: number) => {
    try {
      console.log('Activating key:', id);
      await dbSetActiveKey(id);
      await loadKeys();
      console.log('Key activated successfully');
    } catch (error) {
      console.error('Error activating API Key:', error);
      throw error;
    }
  };

  // Log del estado actual para debugging
  useEffect(() => {
    console.log('Provider state update:', {
      keysCount: keys.length,
      activeKey: activeKey?.name || 'none',
      isLoading,
      isInitialized
    });
  }, [keys, activeKey, isLoading, isInitialized]);

  return (
    <ApiKeyContext.Provider
      value={{
        keys,
        activeKey,
        isLoading,
        addNewKey,
        editKey,
        removeKey,
        activateKey,
        refreshKeys,
      }}
    >
      {children}
    </ApiKeyContext.Provider>
  );
};