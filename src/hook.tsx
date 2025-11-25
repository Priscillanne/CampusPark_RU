import { useState, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';  // Import Preferences
import { collection, getDocs } from 'firebase/firestore';  // Assuming Firestore setup
import { db } from './firebaseConfig';  // Your Firestore db instance

interface CachedDataOptions {
  collectionName: string;  // e.g., 'zones', 'parking', etc.
  storageKey: string;      // e.g., 'cachedZones'
}

export const useCachedData = ({ collectionName, storageKey }: CachedDataOptions) => {
  const [data, setData] = useState<any[]>([]);  // Your data array (e.g., zones or sessions)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      // Step 1: Try to load from Preferences (cache) immediately
      try {
        const { value } = await Preferences.get({ key: storageKey });
        if (value) {
          const cachedData = JSON.parse(value);
          setData(cachedData);  // Display cached data right away
          console.log('Loaded from cache:', cachedData);
        }
      } catch (error) {
        console.error('Error loading cache:', error);
      }

      // Step 2: Fetch live data from Firestore
      try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const liveData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        setData(liveData);  // Update UI with live data
        setLoading(false);
        
        // Step 3: Save live data to Preferences (cache)
        await Preferences.set({
          key: storageKey,
          value: JSON.stringify(liveData),
        });
        console.log('Fetched and cached live data:', liveData);
      } catch (error) {
        console.error('Error fetching from Firestore:', error);
        setLoading(false);  // Still stop loading even if fetch fails
      }
    };

    loadData();
  }, [collectionName, storageKey]);  // Re-run if collection or key changes

  return { data, loading };
};
