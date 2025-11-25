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
} from "@ionic/react";
import { useParams, useHistory } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig"; // ✅ ensure same firebaseConfig import

type Zone = {
  id: string;
  name: string;
  availableSpots: number;
};

const ZoneDetail: React.FC = () => {
  const { zoneId } = useParams<{ zoneId: string }>(); // ✅ match /zone-detail/:zoneId
  const history = useHistory();
  const [zone, setZone] = useState<Zone | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchZone = async () => {
      try {
        const zoneRef = doc(db, "zones", zoneId);
        const snap = await getDoc(zoneRef);
        if (snap.exists()) {
          setZone({ id: snap.id, ...(snap.data() as Omit<Zone, "id">) });
          console.log("Fetched Zone Data:", snap.data());
        } else {
          console.error("Zone not found!");
        }
      } catch (err) {
        console.error("Error fetching zone:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchZone();
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

  if (!zone) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <IonText color="danger">
            <p>Zone not found!</p>
          </IonText>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="light">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/zones" />
          </IonButtons>
          <IonTitle style={{ color: "#F97316" }}>{zone.name}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        className="ion-padding"
        style={{
          backgroundColor: "#1f1f1f",
          color: "white",
          textAlign: "center",
          minHeight: "100vh",
        }}
      >
        <h1 style={{ fontSize: "28px", marginTop: "20px" }}>{zone.name}</h1>
        <p style={{ fontSize: "16px", marginTop: "10px" }}>
          {zone.availableSpots} spots available
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "15px",
            marginTop: "20px",
          }}
        >
          <button
            onClick={() => history.push(`/parking-lot/${zoneId}`)}
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              border: "none",
              borderRadius: "8px",
              padding: "10px 20px",
              backgroundColor: "#34D399",
              color: "white",
              transition: "all 0.3s ease",
            }}
          >
            View Parking Lot
          </button>

          <button
            onClick={() => history.goBack()}
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              border: "none",
              borderRadius: "8px",
              padding: "10px 20px",
              backgroundColor: "#FDE047",
              color: "black",
              transition: "all 0.3s ease",
            }}
          >
            Go Back
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ZoneDetail;
