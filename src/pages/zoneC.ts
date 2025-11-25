import React from "react";
import { IonPage, IonContent } from "@ionic/react";

const zoneC: React.FC = () => {
  console.log("ZoneC loaded");
  return (
    <IonPage>
      <IonContent>
        <h1>Zone C Test Page</h1>
      </IonContent>
    </IonPage>
  );
};

export default zoneC;
