import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react';
import { useLocation } from 'react-router-dom';

const ZoneTimeSelection: React.FC = () => {
  const location = useLocation();
  const { zoneId, zoneName } = location.state || { zoneId: '', zoneName: '' };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{zoneName} - Select Time</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <h2>Zone ID: {zoneId}</h2>
        <h3>Zone Name: {zoneName}</h3>
        {/* Add your time selection UI here */}
      </IonContent>
    </IonPage>
  );
};

export default ZoneTimeSelection;
