import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';

export interface ApiKey {
  id: number;
  name: string;
  key: string;
  active: boolean; // Cambiar a boolean para mejor manejo
}

let db: SQLiteDatabase | null = null;

// Inicializar DB
export const initDB = async (): Promise<void> => {
  try {
    if (!db) {
      db = await openDatabaseAsync('apikeys.db');
      console.log('Database opened successfully');
    }

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS apikeys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        key TEXT NOT NULL UNIQUE,
        active INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Table created successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Obtener todas las keys
export const getAllKeys = async (): Promise<ApiKey[]> => {
  try {
    if (!db) {
      await initDB();
    }

    const result = await db?.getAllAsync<{
      id: number;
      name: string;
      key: string;
      active: number;
    }>('SELECT * FROM apikeys ORDER BY created_at DESC');

    // Convertir active de number a boolean
    const keys: ApiKey[] = result?.map(row => ({
      ...row,
      active: row.active === 1
    })) as ApiKey[];

    console.log('Keys retrieved:', keys?.length);
    return keys;
  } catch (error) {
    console.error('Error getting all keys:', error);
    return [];
  }
};

// Obtener key activa
export const getActiveKey = async (): Promise<ApiKey | null> => {
  try {
    if (!db) {
      await initDB();
    }

    const result: any = await db?.getAllAsync<ApiKey>('SELECT * FROM apikeys WHERE active = 1 LIMIT 1');

    if (result?.length > 0) {
      const activeKey = {
        ...result[0],
        active: true
      };
      console.log('Active key found:', activeKey.name);
      return activeKey;
    }

    console.log('No active key found');
    return null;
  } catch (error) {
    console.error('Error getting active key:', error);
    return null;
  }
};

// Agregar nueva key
export const addKey = async (name: string, key: string): Promise<void> => {
  try {
    if (!db) {
      await initDB();
    }

    // Verificar si ya existe
    const existing: any = await db?.getAllAsync(
      'SELECT id FROM apikeys WHERE name = ? OR key = ?',
      [name, key]
    );

    if (existing.length > 0) {
      throw new Error('Ya existe una API Key con ese nombre o valor');
    }

    await db?.runAsync(
      'INSERT INTO apikeys (name, key) VALUES (?, ?)',
      [name, key]
    );

    console.log('Key added successfully:', name);
  } catch (error) {
    console.error('Error adding key:', error);
    throw error;
  }
};

// Actualizar key
export const updateKey = async (
  id: number,
  name: string,
  key: string
): Promise<void> => {
  try {
    if (!db) {
      await initDB();
    }

    // Verificar que no haya conflictos con otras keys
    const existing: any = await db?.getAllAsync(
      'SELECT id FROM apikeys WHERE (name = ? OR key = ?) AND id != ?',
      [name, key, id]
    );

    if (existing.length > 0) {
      throw new Error('Ya existe una API Key con ese nombre o valor');
    }

    const result: any = await db?.runAsync(
      'UPDATE apikeys SET name = ?, key = ? WHERE id = ?',
      [name, key, id]
    );

    if (result.changes === 0) {
      throw new Error('API Key no encontrada');
    }

    console.log('Key updated successfully:', name);
  } catch (error) {
    console.error('Error updating key:', error);
    throw error;
  }
};

// Eliminar key
export const deleteKey = async (id: number): Promise<void> => {
  try {
    if (!db) {
      await initDB();
    }

    const result: any = await db?.runAsync('DELETE FROM apikeys WHERE id = ?', [id]);

    if (result.changes === 0) {
      throw new Error('API Key no encontrada');
    }

    console.log('Key deleted successfully, ID:', id);
  } catch (error) {
    console.error('Error deleting key:', error);
    throw error;
  }
};

// Activar una key
export const setActiveKey = async (id: number): Promise<void> => {
  try {
    if (!db) {
      await initDB();
    }

    // Verificar que la key existe
    const keyExists: any = await db?.getAllAsync(
      'SELECT id FROM apikeys WHERE id = ?',
      [id]
    );

    if (keyExists.length === 0) {
      throw new Error('API Key no encontrada');
    }

    // Transacción para asegurar consistencia
    await db?.execAsync('BEGIN TRANSACTION');

    try {
      // Desactivar todas las keys
      await db?.runAsync('UPDATE apikeys SET active = 0');

      // Activar la key seleccionada
      await db?.runAsync('UPDATE apikeys SET active = 1 WHERE id = ?', [id]);

      await db?.execAsync('COMMIT');

      console.log('Key activated successfully, ID:', id);
    } catch (error) {
      await db?.execAsync('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error setting active key:', error);
    throw error;
  }
};

// Función para limpiar y reiniciar la base de datos (útil para debugging)
export const resetDatabase = async (): Promise<void> => {
  try {
    if (!db) {
      await initDB();
    }

    await db?.execAsync('DROP TABLE IF EXISTS apikeys');
    await initDB();

    console.log('Database reset successfully');
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
};

// Función para obtener estadísticas de la DB (útil para debugging)
export const getDbStats = async () => {
  try {
    if (!db) {
      await initDB();
    }

    const totalKeys: any = await db?.getAllAsync('SELECT COUNT(*) as count FROM apikeys');
    const activeKeys: any = await db?.getAllAsync('SELECT COUNT(*) as count FROM apikeys WHERE active = 1');

    return {
      total: totalKeys[0]?.count || 0,
      active: activeKeys[0]?.count || 0
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return { total: 0, active: 0 };
  }
};