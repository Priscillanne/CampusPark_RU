// src/components/LocationList.tsx
import React, { useState, useEffect } from 'react';
import { subscribeToLocations } from '../locationService'; // ⬅️ IMPORT the service

// Assuming the Location interface is also imported or defined here
interface Location {
  id: string;
  name: string;
  address: string;
}

const LocationList: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Use the real-time subscription for the best user experience
    const unsubscribe = subscribeToLocations((newLocations) => {
      setLocations(newLocations);
      setLoading(false);
      console.log(`Received ${newLocations.length} locations. 
        Source: ${newLocations.length > 0 ? 'Cache/Server' : 'Empty'}`);
    });

    // Cleanup function: This stops the real-time listener when the component is removed
    return () => unsubscribe(); 
  }, []);

  if (loading) {
    return <div>Loading locations... (Checking local cache first!)</div>;
  }

  return (
    <div>
      <h2>Available Campus Locations</h2>
      {locations.map(location => (
        <div key={location.id}>
          <strong>{location.name}</strong> - {location.address}
        </div>
      ))}
    </div>
  );
};

export default LocationList;