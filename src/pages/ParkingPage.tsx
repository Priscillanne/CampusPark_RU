import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonText,
  IonCard,
  IonCardContent,
} from "@ionic/react";
import { useParams } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig"; // ✅ Make sure this path matches your project
import { saveToCache, getFromCache } from "../utils/storage"; // Import cache helper functions

type ParkingSpot = {
  id: string;
  number: string;
  status: string; // "available", "occupied", etc.
};

const ParkingPage: React.FC = () => {
  const { zoneId } = useParams<{ zoneId: string }>(); // ✅ read from route param
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParkingSpots = async () => {
      // First, try to get cached data
      const cacheKey = `parkingSpots_${zoneId}`;
      const cachedSpots = await getFromCache(cacheKey);
      if (cachedSpots) {
        setParkingSpots(cachedSpots); // If cached data exists, set it
        setLoading(false);
      }

      // Now fetch live data from Firestore
      try {
        // Example Firestore structure: /zones/{zoneId}/parkingSpots
        const spotsRef = collection(db, "zones", zoneId, "parkingSpots");
        const snapshot = await getDocs(spotsRef);

        const spots: ParkingSpot[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<ParkingSpot, "id">),
        }));

        setParkingSpots(spots);
        // Save fetched data to cache for future use
        saveToCache(cacheKey, spots);
        console.log("Fetched parking spots:", spots);
      } catch (error) {
        console.error("Error fetching parking spots:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchParkingSpots();
  }, [zoneId]);

  if (loading) {
    return (
      <IonPage>
        <IonContent
          className="ion-padding"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
          }}
        >
          <IonSpinner name="crescent" />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      {/* HEADER */}
      <IonHeader>
        <IonToolbar color="light">
          <IonButtons slot="start">
            <IonBackButton defaultHref={`/zone-detail/${zoneId}`} />
          </IonButtons>
          <IonTitle style={{ color: "#F97316" }}>
            Parking - Zone {zoneId}
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* CONTENT */}
      <IonContent
        className="ion-padding"
        style={{
          "--background": "#F9FAFB",
          minHeight: "100vh",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#111827" }}>
            Parking Spots
          </h1>
          <IonText color="medium">
            <p>View all parking spots for this zone</p>
          </IonText>
        </div>

        {/* No spots found */}
        {parkingSpots.length === 0 ? (
          <IonText color="medium" className="ion-text-center">
            <p>No parking spots found for this zone.</p>
          </IonText>
        ) : (
          parkingSpots.map((spot) => (
            <IonCard
              key={spot.id}
              style={{
                borderRadius: "16px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                marginBottom: "12px",
              }}
            >
              <IonCardContent
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#111827",
                      margin: 0,
                    }}
                  >
                    Spot #{spot.number}
                  </h2>
                  <p
                    style={{
                      fontSize: "15px",
                      color:
                        spot.status === "available" ? "#22C55E" : "#EF4444",
                      marginTop: "4px",
                    }}
                  >
                    {spot.status === "available"
                      ? "Available"
                      : "Occupied"}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: "22px",
                    color: "#F97316",
                    fontWeight: "bold",
                  }}
                >
                  ›
                </span>
              </IonCardContent>
            </IonCard>
          ))
        )}
      </IonContent>
    </IonPage>
  );
};

export default ParkingPage;
