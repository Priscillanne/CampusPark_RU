import { Storage } from '@ionic/storage';

// Initialize Ionic Storage
const storage = new Storage();
storage.create();

// Save data to cache
export const saveToCache = async (key: string, data: any) => {
  try {
    await storage.set(key, JSON.stringify(data)); // Convert data to string and store it
  } catch (err) {
    console.error('Error saving to cache:', err);
  }
};

// Get data from cache
export const getFromCache = async (key: string) => {
  try {
    const data = await storage.get(key); // Get data
    return data ? JSON.parse(data) : null; // Parse it and return
  } catch (err) {
    console.error('Error getting from cache:', err);
    return null;
  }
};
