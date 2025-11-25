import React, { useState, useEffect } from 'react';
import { IonCard, IonCardContent, IonItem, IonLabel, IonBadge, IonButton } from '@ionic/react';
import { PenaltyService } from '../services/penaltyService';

interface PenaltyMonitorProps {
  booking: any;
  onPenaltyUpdate?: (penaltyAmount: number) => void;
}

const PenaltyMonitor: React.FC<PenaltyMonitorProps> = ({ booking, onPenaltyUpdate }) => {
  const [penaltyStatus, setPenaltyStatus] = useState<any>(null);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  useEffect(() => {
    checkPenalty();
    
    // Check for penalties every minute
    const interval = setInterval(() => {
      checkPenalty();
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [booking]);

  const checkPenalty = () => {
    const status = PenaltyService.getPenaltyStatus(booking);
    setPenaltyStatus(status);
    setLastChecked(new Date());
    
    if (onPenaltyUpdate && status.amount > 0) {
      onPenaltyUpdate(status.amount);
    }
  };

  const handleMarkAsRemoved = async () => {
    // In real app, update Firebase to mark car as removed
    console.log('Car marked as removed for booking:', booking.bookingId);
    // This would stop further penalties
  };

  if (!penaltyStatus) return null;

  return (
    <IonCard style={{
      margin: '10px 0',
      background: penaltyStatus.hasPenalty ? '#fff3cd' : '#d4edda',
      border: penaltyStatus.hasPenalty ? '1px solid #ffeaa7' : '1px solid #c3e6cb'
    }}>
      <IonCardContent style={{ padding: '15px' }}>
        <IonItem lines="none" style={{ 
          '--background': 'transparent',
          '--padding-start': '0'
        }}>
          <IonLabel>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ 
                margin: 0, 
                color: penaltyStatus.hasPenalty ? '#856404' : '#155724',
                fontSize: '16px',
                fontWeight: '500'
              }}>
                {penaltyStatus.hasPenalty ? '⚠️ Late Return Penalty' : '⏰ Return Status'}
              </h3>
              {penaltyStatus.hasPenalty && (
                <IonBadge color="danger" style={{ fontSize: '12px' }}>
                  RM{penaltyStatus.amount}
                </IonBadge>
              )}
            </div>
            
            <p style={{ 
              margin: '0 0 12px 0',
              color: penaltyStatus.hasPenalty ? '#856404' : '#155724',
              fontSize: '14px',
              lineHeight: '1.4'
            }}>
              {penaltyStatus.message}
            </p>

            {penaltyStatus.hasPenalty && (
              <div style={{ marginTop: '10px' }}>
                <IonButton 
                  size="small" 
                  color="success"
                  onClick={handleMarkAsRemoved}
                  style={{ '--padding-start': '12px', '--padding-end': '12px' }}
                >
                  🚗 Mark as Removed
                </IonButton>
              </div>
            )}
            
            <div style={{ 
              fontSize: '11px', 
              color: penaltyStatus.hasPenalty ? '#b08c3c' : '#6c997a',
              marginTop: '8px'
            }}>
              Last checked: {lastChecked.toLocaleTimeString()}
            </div>
          </IonLabel>
        </IonItem>
      </IonCardContent>
    </IonCard>
  );
};

export default PenaltyMonitor;