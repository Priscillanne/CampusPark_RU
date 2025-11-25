import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent, IonGrid, IonRow, IonCol, IonIcon } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { car, navigate, location, time } from "ionicons/icons";

const ZonePage: React.FC = () => {
  const history = useHistory();

  // Zones array with info - FIXED: Changed to ZoneA, ZoneB, ZoneC (capital Z)
  const zones = [
    { id: 'ZoneA', name: 'Zone A', availableSpots: 23, totalSpots: 50, distance: '2 min walk' },
    { id: 'ZoneB', name: 'Zone B', availableSpots: 15, totalSpots: 40, distance: '5 min walk' },
    { id: 'ZoneC', name: 'Zone C', availableSpots: 30, totalSpots: 60, distance: '8 min walk' },
  ];

  // Handle Zone Click - Now redirects to UserTypeSelection
  const handleZoneClick = (zoneId: string, zoneName: string) => {
    history.push({
      pathname: '/user-type',
      state: { 
        zoneId: zoneId,
        zoneName: zoneName 
      }
    });
  };

  const getZoneColor = (spots: number) => {
    if (spots === 0) return "#EF4444";
    if (spots < 5) return "#F59E0B";
    return "#10B981";
  };

  // FIXED: Added null check for zoneName
  const getZoneIcon = (zoneName: string) => {
    if (!zoneName) return car; // Default icon if zoneName is undefined
    
    if (zoneName.includes('A')) return location;
    if (zoneName.includes('B')) return time;
    return car;
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ "--background": "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)", "--border-color": "transparent" }}>
          <IonTitle className="ion-text-center" style={{ color: "white", fontWeight: "700", fontSize: "20px" }}>
            🅿️ CampusPark
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ "--background": "linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%)" }}>
        <div style={{ textAlign: "center", padding: "32px 24px", background: "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)", borderRadius: "0 0 30px 30px", color: "white", marginBottom: "20px" }}>
          <div style={{ background: "rgba(255,255,255,0.2)", width: "80px", height: "80px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", backdropFilter: "blur(10px)", border: "2px solid rgba(255,255,255,0.3)" }}>
            <IonIcon icon={car} style={{ fontSize: "40px", color: "white" }} />
          </div>

          <h1 style={{ fontSize: "28px", fontWeight: "800", margin: "0 0 8px", color: "white" }}>Find Your Spot</h1>
          <p style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "500", opacity: "0.9" }}>Raffles University Parking</p>
        </div>

        <div className="ion-padding" style={{ paddingTop: "0" }}>
          <div style={{ marginBottom: "32px" }}>
            <IonGrid style={{ padding: "0" }}>
              <IonRow>
                {zones.map((zone) => (
                  <IonCol size="12" key={zone.id} style={{ padding: "8px" }}>
                    {/* FIXED: Changed onClick to use handleZoneClick */}
                    <IonCard button onClick={() => handleZoneClick(zone.id, zone.name)} style={{ borderRadius: "20px", boxShadow: "0 4px 20px rgba(59, 130, 246, 0.15)", transition: "all 0.3s ease", background: "white", margin: "0", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                      <IonCardContent style={{ padding: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <div style={{ background: "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)", width: "50px", height: "50px", borderRadius: "15px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 15px rgba(59, 130, 246, 0.4)" }}>
                            {/* FIXED: Added safe zone.name access */}
                            <IonIcon icon={getZoneIcon(zone.name)} style={{ fontSize: "24px", color: "white" }} />
                          </div>

                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", margin: "0" }}>
                                {zone.name}
                              </h3>
                              <span style={{ fontSize: "14px", color: getZoneColor(zone.availableSpots), fontWeight: "700", padding: "4px 12px", background: `${getZoneColor(zone.availableSpots)}15`, borderRadius: "12px", border: `1px solid ${getZoneColor(zone.availableSpots)}30` }}>
                                {zone.availableSpots === 0 ? "Full" : zone.availableSpots < 5 ? "Limited" : "Available"}
                              </span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: getZoneColor(zone.availableSpots), animation: zone.availableSpots > 0 ? "pulse 2s infinite" : "none" }} />
                                <p style={{ fontSize: "14px", color: "#64748b", margin: 0, fontWeight: "500" }}>
                                  {zone.availableSpots} spots available
                                </p>
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <IonIcon icon={time} style={{ fontSize: "14px", color: "#94a3b8" }} />
                              <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
                                {zone.distance} • Total {zone.totalSpots} spots
                              </span>
                            </div>
                          </div>
                        </div>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ZonePage;