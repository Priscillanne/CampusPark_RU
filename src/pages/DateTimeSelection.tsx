import React, { useState } from 'react';
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonCard, 
  IonCardContent, 
  IonButton, 
  IonItem, 
  IonLabel,
  IonDatetime,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';

// Add interface for location state
interface LocationState {
  userType?: 'normal' | 'oku';
  okuId?: string;
  zoneId?: string;
  zoneName?: string;
}

const DateTimeSelection: React.FC = () => {
  const history = useHistory();
  const location = useLocation<LocationState>();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const handleDateChange = (e: any) => {
    const date = new Date(e.detail.value);
    setSelectedDate(date.toISOString().split('T')[0]);
    setShowDatePicker(false);
  };

  const handleStartTimeChange = (e: any) => {
    const time = new Date(e.detail.value).toTimeString().slice(0, 5);
    setStartTime(time);
    setShowStartTimePicker(false);
  };

  const handleEndTimeChange = (e: any) => {
    const time = new Date(e.detail.value).toTimeString().slice(0, 5);
    setEndTime(time);
    setShowEndTimePicker(false);
  };

  const formatDisplayTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  const formatDisplayDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleContinue = () => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    if (start >= end) {
      alert('End time must be after start time');
      return;
    }

    // Calculate duration
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const duration = `${hours}h ${minutes}m`;

    // Get data from previous screen
    const previousState = location.state || {};

    history.push({
      pathname: '/parking-visualization',
      state: {
        ...previousState, // Pass through userType, okuId, zoneId, etc.
        date: selectedDate,
        timeIn: startTime,
        timeOut: endTime,
        duration
      }
    });
  };

  const getMinDate = () => {
    return new Date().toISOString();
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 1);
    return maxDate.toISOString();
  };

  // Calculate duration for display
  const calculateDuration = () => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ "--background": "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)", "--border-color": "transparent" }}>
          <IonTitle className="ion-text-center" style={{ color: "white", fontWeight: "700", fontSize: "20px" }}>
            Date & Time
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ "--background": "linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%)" }}>
        <div style={{ padding: '20px' }}>
          <IonCard style={{ borderRadius: '20px', marginBottom: '20px', background: 'white' }}>
            <IonCardContent style={{ padding: '20px' }}>
              <h2 style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold', marginBottom: '30px', color: '#1e293b' }}>
                Select Date & Time
              </h2>

              {/* Date Selection */}
              <IonItem 
                button 
                onClick={() => setShowDatePicker(true)}
                style={{ 
                  '--background': 'transparent', 
                  borderRadius: '12px', 
                  border: '1px solid #e2e8f0',
                  marginBottom: '20px'
                }}
              >
                <IonLabel>
                  <div style={{ fontWeight: '500', color: '#64748b', fontSize: '14px' }}>Date</div>
                  <div style={{ color: '#1e293b', fontSize: '16px', marginTop: '4px' }}>
                    {formatDisplayDate(selectedDate)}
                  </div>
                </IonLabel>
              </IonItem>

              {showDatePicker && (
                <IonDatetime
                  presentation="date"
                  value={selectedDate}
                  onIonChange={handleDateChange}
                  min={getMinDate()}
                  max={getMaxDate()}
                  style={{ 
                    borderRadius: '12px', 
                    border: '1px solid #e2e8f0',
                    marginBottom: '20px'
                  }}
                />
              )}

              <IonGrid style={{ padding: '0' }}>
                <IonRow>
                  <IonCol size="6" style={{ padding: '4px' }}>
                    {/* Start Time Selection */}
                    <IonItem 
                      button 
                      onClick={() => setShowStartTimePicker(true)}
                      style={{ 
                        '--background': 'transparent', 
                        borderRadius: '12px', 
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <IonLabel>
                        <div style={{ fontWeight: '500', color: '#64748b', fontSize: '14px' }}>Start Time</div>
                        <div style={{ color: '#1e293b', fontSize: '16px', marginTop: '4px' }}>
                          {formatDisplayTime(startTime)}
                        </div>
                      </IonLabel>
                    </IonItem>

                    {showStartTimePicker && (
                      <IonDatetime
                        presentation="time"
                        value={`2000-01-01T${startTime}`}
                        onIonChange={handleStartTimeChange}
                        style={{ 
                          borderRadius: '12px', 
                          border: '1px solid #e2e8f0',
                          marginTop: '10px'
                        }}
                      />
                    )}
                  </IonCol>

                  <IonCol size="6" style={{ padding: '4px' }}>
                    {/* End Time Selection */}
                    <IonItem 
                      button 
                      onClick={() => setShowEndTimePicker(true)}
                      style={{ 
                        '--background': 'transparent', 
                        borderRadius: '12px', 
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <IonLabel>
                        <div style={{ fontWeight: '500', color: '#64748b', fontSize: '14px' }}>End Time</div>
                        <div style={{ color: '#1e293b', fontSize: '16px', marginTop: '4px' }}>
                          {formatDisplayTime(endTime)}
                        </div>
                      </IonLabel>
                    </IonItem>

                    {showEndTimePicker && (
                      <IonDatetime
                        presentation="time"
                        value={`2000-01-01T${endTime}`}
                        onIonChange={handleEndTimeChange}
                        style={{ 
                          borderRadius: '12px', 
                          border: '1px solid #e2e8f0',
                          marginTop: '10px'
                        }}
                      />
                    )}
                  </IonCol>
                </IonRow>
              </IonGrid>

              {/* Duration Display */}
              <IonCard style={{ borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', marginTop: '20px' }}>
                <IonCardContent style={{ padding: '15px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: '0', fontSize: '14px', color: '#3b82f6', fontWeight: '500' }}>
                      Duration: {calculateDuration()}
                    </p>
                  </div>
                </IonCardContent>
              </IonCard>

              <IonButton 
                expand="block" 
                onClick={handleContinue}
                style={{ 
                  '--background': '#10B981',
                  '--background-hover': '#059669',
                  '--background-activated': '#059669',
                  '--border-radius': '12px',
                  '--padding-top': '18px',
                  '--padding-bottom': '18px',
                  marginTop: '30px',
                  fontWeight: 'bold'
                }}
              >
                View Available Parking
              </IonButton>
            </IonCardContent>
          </IonCard>

          {/* Display user info */}
          {location.state && (
            <IonCard style={{ borderRadius: '15px', background: 'rgba(59, 130, 246, 0.1)' }}>
              <IonCardContent style={{ padding: '15px' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0', fontSize: '14px', color: '#3b82f6', fontWeight: '500' }}>
                    User: {location.state?.userType === 'oku' ? 'OKU User' : 'Normal User'}
                    {location.state?.zoneName && ` • Zone: ${location.state?.zoneName}`}
                  </p>
                </div>
              </IonCardContent>
            </IonCard>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DateTimeSelection;