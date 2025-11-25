import React, { useState, useEffect } from 'react';
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonCard, 
  IonCardContent, 
  IonButton, 
  IonGrid,
  IonRow,
  IonCol,
  IonLoading,
  IonLabel,
  IonItem,
  IonIcon,
  IonChip
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { car, walk, accessibility, time, calendar, person } from 'ionicons/icons';

interface ParkingSlot {
  id: string;
  label: string;
  zoneId: string;
  row: number;
  col: number;
  status: 'available' | 'booked';
  type: 'regular' | 'disabled' | 'oku';
}

interface LocationState {
  userType?: 'normal' | 'oku';
  okuId?: string;
  zoneId?: string;
  zoneName?: string;
  date?: string;
  timeIn?: string;
  timeOut?: string;
  duration?: string;
}

const ParkingVisualization: React.FC = () => {
  const history = useHistory();
  const location = useLocation<LocationState>();
  const [parkingSlots, setParkingSlots] = useState<ParkingSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoneInfo, setZoneInfo] = useState<any>(null);

  // Get data from previous screen with proper typing
  const { userType, okuId, zoneId, date, timeIn, timeOut, duration, zoneName } = location.state || {};

  useEffect(() => {
    if (zoneId) {
      fetchZoneInfo();
      fetchParkingSlots();
    } else {
      setLoading(false);
    }
  }, [zoneId]);

  const fetchZoneInfo = async () => {
    if (!zoneId) return;
    
    try {
      const zoneDoc = await getDoc(doc(db, 'zones', zoneId));
      if (zoneDoc.exists()) {
        setZoneInfo(zoneDoc.data());
      }
    } catch (error) {
      console.error('Error fetching zone info:', error);
    }
  };

  const fetchParkingSlots = () => {
    if (!zoneId) return;

    const q = query(
      collection(db, 'parkingSlots'),
      where('zoneId', '==', zoneId)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const slots: ParkingSlot[] = [];
      querySnapshot.forEach((doc) => {
        slots.push({ id: doc.id, ...doc.data() } as ParkingSlot);
      });
      
      // Sort slots by row and column for proper grid display
      slots.sort((a, b) => {
        if (a.row === b.row) return a.col - b.col;
        return a.row - b.row;
      });
      
      setParkingSlots(slots);
      setLoading(false);
    });

    return unsubscribe;
  };

  const handleSlotPress = (slot: ParkingSlot) => {
    if (slot.status === 'booked') {
      alert('🚫 This parking slot is already booked');
      return;
    }

    // Check if OKU user is trying to book non-OKU spot
    if (userType === 'oku' && slot.type !== 'oku') {
      alert('♿ OKU users must select OKU parking spots');
      return;
    }

    // Check if normal user is trying to book OKU spot
    if (userType === 'normal' && slot.type === 'oku') {
      alert('🚫 This spot is reserved for OKU users');
      return;
    }

    setSelectedSlot(slot);
    
    // Navigate to booking form with all parameters
    history.push({
      pathname: '/booking',
      state: {
        ...location.state, // Pass all previous data
        slotId: slot.id,
        slotLabel: slot.label,
        zoneName: zoneInfo?.zoneName || zoneName || 'Unknown Zone'
      }
    });
  };

  const getSlotColor = (slot: ParkingSlot) => {
    if (slot.status === 'booked') return '#EF4444'; // Red
    if (slot.type === 'oku') return '#3B82F6'; // Blue
    if (slot.type === 'disabled') return '#8B5CF6'; // Purple
    return '#10B981'; // Green
  };

  const getSlotIcon = (slot: ParkingSlot) => {
    if (slot.status === 'booked') return '⛔';
    if (slot.type === 'oku') return '♿';
    if (slot.type === 'disabled') return '🦽';
    return '🅿️';
  };

  const getSlotTextColor = (slot: ParkingSlot) => {
    return 'white';
  };

  // Group slots by row for grid display
  const rows: { [key: number]: ParkingSlot[] } = {};
  parkingSlots.forEach(slot => {
    if (!rows[slot.row]) {
      rows[slot.row] = [];
    }
    rows[slot.row].push(slot);
  });

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding" style={{ '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
            <IonLoading isOpen={loading} message="Loading parking slots..." />
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <IonIcon icon={car} style={{ fontSize: '48px', color: 'white' }} />
              <p style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginTop: '10px' }}>Loading Parking Slots</p>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Preparing your parking map...</p>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ 
          "--background": "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)", 
          "--border-color": "transparent",
          boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)'
        }}>
          <IonTitle className="ion-text-center" style={{ 
            color: "white", 
            fontWeight: "800", 
            fontSize: "22px",
            textShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            🅿️ {zoneInfo?.zoneName || zoneName || 'Parking Zone'}
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ 
        "--background": "linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)" 
      }}>
        <div style={{ padding: '16px' }}>
          
          {/* Legend with beautiful design */}
          <IonCard style={{ 
            borderRadius: '20px', 
            marginBottom: '20px', 
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <IonCardContent style={{ padding: '20px' }}>
              <h3 style={{ 
                textAlign: 'center', 
                margin: '0 0 20px 0', 
                color: '#1e293b',
                fontWeight: '700',
                fontSize: '18px'
              }}>
                🎯 Parking Legend
              </h3>
              
              <IonGrid style={{ padding: '0' }}>
                <IonRow className="ion-justify-content-around">
                  <IonCol size="auto">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '8px', 
                        backgroundColor: '#10B981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: 'white',
                        fontWeight: 'bold'
                      }}>
                        🅿️
                      </div>
                      <IonLabel style={{ fontSize: '14px', fontWeight: '600' }}>Available</IonLabel>
                    </div>
                  </IonCol>
                  <IonCol size="auto">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '8px', 
                        backgroundColor: '#EF4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: 'white',
                        fontWeight: 'bold'
                      }}>
                        ⛔
                      </div>
                      <IonLabel style={{ fontSize: '14px', fontWeight: '600' }}>Booked</IonLabel>
                    </div>
                  </IonCol>
                  <IonCol size="auto">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '8px', 
                        backgroundColor: '#3B82F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: 'white',
                        fontWeight: 'bold'
                      }}>
                        ♿
                      </div>
                      <IonLabel style={{ fontSize: '14px', fontWeight: '600' }}>OKU Only</IonLabel>
                    </div>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>

          {/* Campus Building Indicator */}
          <IonCard style={{ 
            borderRadius: '20px', 
            marginBottom: '20px', 
            background: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
            boxShadow: '0 8px 25px rgba(107, 114, 128, 0.3)',
            color: 'white'
          }}>
            <IonCardContent style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <div style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  width: '50px', 
                  height: '50px', 
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  backdropFilter: 'blur(10px)'
                }}>
                  🏫
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 'bold' }}>
                    Campus Building
                  </h3>
                  <p style={{ margin: '0', fontSize: '14px', opacity: '0.9' }}>
                    Main Entrance This Side
                  </p>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Parking Grid */}
          <IonCard style={{ 
            borderRadius: '20px', 
            marginBottom: '20px', 
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <IonCardContent style={{ padding: '20px' }}>
              <div style={{ 
                maxHeight: '500px', 
                overflowY: 'auto',
                padding: '10px'
              }}>
                {Object.keys(rows).map(rowKey => (
                  <div key={rowKey} style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    flexWrap: 'wrap', 
                    marginBottom: '12px',
                    gap: '8px'
                  }}>
                    {rows[parseInt(rowKey)].map(slot => (
                      <div 
                        key={slot.id}
                        onClick={() => handleSlotPress(slot)}
                        style={{ 
                          width: '70px', 
                          height: '70px', 
                          borderRadius: '15px',
                          background: getSlotColor(slot),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: slot.status === 'available' 
                            ? '0 4px 15px rgba(16, 185, 129, 0.3)' 
                            : '0 4px 15px rgba(0,0,0,0.1)',
                          cursor: slot.status === 'available' ? 'pointer' : 'not-allowed',
                          transition: 'all 0.3s ease',
                          border: selectedSlot?.id === slot.id 
                            ? '3px solid #F59E0B' 
                            : '2px solid rgba(255,255,255,0.3)',
                          transform: selectedSlot?.id === slot.id ? 'scale(1.05)' : 'scale(1)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                          if (slot.status === 'available') {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (slot.status === 'available' && selectedSlot?.id !== slot.id) {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = slot.status === 'available' 
                              ? '0 4px 15px rgba(16, 185, 129, 0.3)' 
                              : '0 4px 15px rgba(0,0,0,0.1)';
                          }
                        }}
                      >
                        <div style={{ 
                          textAlign: 'center',
                          color: getSlotTextColor(slot),
                          textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                        }}>
                          <div style={{ fontSize: '20px', marginBottom: '2px' }}>
                            {getSlotIcon(slot)}
                          </div>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: 'bold',
                            letterSpacing: '0.5px'
                          }}>
                            {slot.label}
                          </div>
                        </div>
                        
                        {/* Shine effect */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                          transition: 'left 0.5s ease'
                        }}></div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </IonCardContent>
          </IonCard>

          {/* Booking Information */}
          <IonCard style={{ 
            borderRadius: '20px', 
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
            boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
            color: 'white'
          }}>
            <IonCardContent style={{ padding: '20px' }}>
              <h3 style={{ 
                textAlign: 'center', 
                margin: '0 0 16px 0', 
                fontSize: '18px',
                fontWeight: '700'
              }}>
                📋 Booking Summary
              </h3>
              
              <IonGrid style={{ padding: '0' }}>
                <IonRow>
                  <IonCol size="6">
                    <IonItem lines="none" style={{ '--background': 'transparent' }}>
                      <IonLabel>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <IonIcon icon={calendar} style={{ color: 'rgba(255,255,255,0.8)' }} />
                          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>Date</div>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>{date}</div>
                      </IonLabel>
                    </IonItem>
                  </IonCol>
                  <IonCol size="6">
                    <IonItem lines="none" style={{ '--background': 'transparent' }}>
                      <IonLabel>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <IonIcon icon={time} style={{ color: 'rgba(255,255,255,0.8)' }} />
                          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>Time</div>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>{timeIn} - {timeOut}</div>
                      </IonLabel>
                    </IonItem>
                  </IonCol>
                </IonRow>
                
                <IonRow>
                  <IonCol size="12">
                    <IonItem lines="none" style={{ '--background': 'transparent' }}>
                      <IonLabel>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <IonIcon icon={person} style={{ color: 'rgba(255,255,255,0.8)' }} />
                          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>User Type</div>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>
                          {userType === 'oku' ? '♿ OKU User' : '👤 Normal User'}
                        </div>
                      </IonLabel>
                    </IonItem>
                  </IonCol>
                </IonRow>
                
                {selectedSlot && (
                  <IonRow>
                    <IonCol size="12">
                      <div style={{ 
                        textAlign: 'center', 
                        background: 'rgba(255,255,255,0.2)', 
                        padding: '12px',
                        borderRadius: '12px',
                        marginTop: '10px',
                        backdropFilter: 'blur(10px)'
                      }}>
                        <div style={{ fontSize: '12px', opacity: '0.9', marginBottom: '4px' }}>
                          Selected Parking Spot
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#F59E0B' }}>
                          🎯 {selectedSlot.label}
                        </div>
                      </div>
                    </IonCol>
                  </IonRow>
                )}
              </IonGrid>
            </IonCardContent>
          </IonCard>

          {/* Instructions */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: '20px',
            padding: '16px',
            background: 'rgba(255,255,255,0.8)',
            borderRadius: '15px',
            backdropFilter: 'blur(10px)'
          }}>
            <p style={{ 
              fontSize: '14px', 
              color: '#64748b', 
              margin: '0 0 8px 0',
              fontWeight: '600'
            }}>
              {parkingSlots.length > 0 
                ? '✨ Tap on an available parking spot to book it!' 
                : '🚫 No parking spots available for this zone'
              }
            </p>
            <p style={{ 
              fontSize: '12px', 
              color: '#94a3b8', 
              margin: '0',
              fontStyle: 'italic'
            }}>
              Available spots glow green and are interactive
            </p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ParkingVisualization;