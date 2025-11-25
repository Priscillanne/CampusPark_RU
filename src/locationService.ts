// src/services/locationService.ts
import { db } from "../firebaseConfig"; // ⬅️ IMPORT the configured 'db'
import { collection, getDocs, onSnapshot, DocumentData } from "firebase/firestore";

// Define a type for your data for better development
interface Location {
  id: string;
  name: string;
  address: string;
}

/**
 * 💡 Option A: One-Time Fetch (Uses Cache Automatically)
 * Fetches the data once. If offline, it uses the cached data.
 */
export async function getLocationsOneTime(): Promise<Location[]> {
  try {
    const locationsRef = collection(db, "locations");
    const snapshot = await getDocs(locationsRef); // Automatically checks the cache first

    const locations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Location[];

    return locations;
  } catch (error) {
    console.error("Error fetching locations:", error);
    return [];
  }
}

/**
 * 💡 Option B: Real-time Subscription (Best for Persistence)
 * Listens for updates and provides instant data from the cache.
 */
export function subscribeToLocations(callback: (locations: Location[]) => void): () => void {
  const locationsRef = collection(db, "locations");

  // onSnapshot is ideal: it instantly delivers cached data, then listens for server updates.
  const unsubscribe = onSnapshot(locationsRef, (snapshot) => {
    const locations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Location[];
    
    // Pass the data to the component
    callback(locations); 
  });

  return unsubscribe; // Return the function to stop the listener later
}