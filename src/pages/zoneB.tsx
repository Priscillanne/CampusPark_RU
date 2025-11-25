import React from "react";
import { IonPage, IonContent } from "@ionic/react";

const zoneB: React.FC = () => {
  console.log("ZoneB loaded");
  return (
    <IonPage>
      <IonContent>
        <h1>Zone B Test Page</h1>
      </IonContent>
    </IonPage>
  );
};

export default zoneB;
