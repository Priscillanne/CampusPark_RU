import React from "react";
import { IonPage, IonContent } from "@ionic/react";

const zoneA: React.FC = () => {
  console.log("ZoneA loaded");
  return (
    <IonPage>
      <IonContent>
        <h1>Zone A Test Page</h1>
      </IonContent>
    </IonPage>
  );
};

export default zoneA;
