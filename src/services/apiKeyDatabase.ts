// src/services/apikeysDB.ts
import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';

export interface ApiKey {
  id: number;
  name: string;
  key: string;
  active: number; // 0 o 1
}

let db: SQLiteDatabase | null = null;

// Inicializar DB
export const initDB = async (): Promise<void> => {
  if (!db) {
    db = await openDatabaseAsync('apikeys.db');
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS apikeys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      key TEXT UNIQUE,
      active INTEGER DEFAULT 0
    );
  `);
};

// Obtener todas las keys
export const getAllKeys = async (): Promise<ApiKey[]> => {
  if (!db) throw new Error('DB no inicializada');
  const result = await db.getAllAsync<ApiKey>('SELECT * FROM apikeys');
  return result;
};

// Obtener key activa
export const getActiveKey = async (): Promise<ApiKey | null> => {
  if (!db) throw new Error('DB no inicializada');
  const result = await db.getAllAsync<ApiKey>(
    'SELECT * FROM apikeys WHERE active = 1 LIMIT 1'
  );
  return result.length > 0 ? result[0] : null;
};

// Agregar nueva key
export const addKey = async (name: string, key: string): Promise<void> => {
  if (!db) throw new Error('DB no inicializada');
  await db.runAsync(
    'INSERT INTO apikeys (name, key) VALUES (?, ?)',
    name,
    key
  );
};

// Actualizar key
export const updateKey = async (
  id: number,
  name: string,
  key: string
): Promise<void> => {
  if (!db) throw new Error('DB no inicializada');
  await db.runAsync(
    'UPDATE apikeys SET name = ?, key = ? WHERE id = ?',
    name,
    key,
    id
  );
};

// Eliminar key
export const deleteKey = async (id: number): Promise<void> => {
  if (!db) throw new Error('DB no inicializada');
  await db.runAsync('DELETE FROM apikeys WHERE id = ?', id);
};

// Activar una key
export const setActiveKey = async (id: number): Promise<void> => {
  if (!db) throw new Error('DB no inicializada');
  await db.execAsync('UPDATE apikeys SET active = 0');
  await db.runAsync('UPDATE apikeys SET active = 1 WHERE id = ?', id);
};
