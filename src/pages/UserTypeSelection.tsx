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
  IonInput, 
  IonLabel,
  IonItem,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';

// Add interface for location state
interface LocationState {
  zoneId?: string;
  zoneName?: string;
}

const UserTypeSelection: React.FC = () => {
  const history = useHistory();
  const location = useLocation<LocationState>();
  const [selectedUserType, setSelectedUserType] = useState<'normal' | 'oku' | null>(null);
  const [okuId, setOkuId] = useState('');

  const handleUserTypeSelect = (type: 'normal' | 'oku') => {
    setSelectedUserType(type);
    // Clear OKU ID when switching to normal user
    if (type === 'normal') {
      setOkuId('');
    }
  };

  const handleContinue = () => {
    if (!selectedUserType) {
      alert('Please select your user type');
      return;
    }

    if (selectedUserType === 'oku' && !okuId) {
      alert('Please enter your OKU ID');
      return;
    }

    if (selectedUserType === 'oku' && okuId.length !== 6) {
      alert('OKU ID must be 6 digits');
      return;
    }

    // Pass data to next screen using state
    history.push({
      pathname: '/date-time',
      state: {
        userType: selectedUserType,
        okuId: selectedUserType === 'oku' ? okuId : '',
        zoneId: location.state?.zoneId,
        zoneName: location.state?.zoneName
      }
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ "--background": "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)", "--border-color": "transparent" }}>
          <IonTitle className="ion-text-center" style={{ color: "white", fontWeight: "700", fontSize: "20px" }}>
            User Type
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ "--background": "linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%)" }}>
        <div style={{ padding: '20px' }}>
          <IonCard style={{ borderRadius: '20px', marginBottom: '20px', background: 'white' }}>
            <IonCardContent style={{ padding: '20px' }}>
              <h2 style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold', marginBottom: '30px', color: '#1e293b' }}>
                Select Your User Type
              </h2>

              <IonGrid style={{ padding: '0' }}>
                <IonRow>
                  <IonCol size="12" style={{ padding: '8px' }}>
                    <IonCard 
                      button 
                      onClick={() => handleUserTypeSelect('normal')}
                      style={{ 
                        borderRadius: '15px', 
                        background: selectedUserType === 'normal' ? '#3b82f6' : '#e0e0e0',
                        transition: 'all 0.3s ease',
                        border: selectedUserType === 'normal' ? '2px solid #1e40af' : '2px solid transparent'
                      }}
                    >
                      <IonCardContent style={{ padding: '20px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <h3 style={{ 
                            fontSize: '18px', 
                            fontWeight: '700', 
                            margin: '0 0 8px', 
                            color: selectedUserType === 'normal' ? 'white' : '#1e293b' 
                          }}>
                            Normal User
                          </h3>
                          <p style={{ 
                            margin: '0', 
                            fontSize: '14px', 
                            color: selectedUserType === 'normal' ? 'rgba(255,255,255,0.9)' : '#64748b' 
                          }}>
                            Standard parking access
                          </p>
                        </div>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>

                  <IonCol size="12" style={{ padding: '8px' }}>
                    <IonCard 
                      button 
                      onClick={() => handleUserTypeSelect('oku')}
                      style={{ 
                        borderRadius: '15px', 
                        background: selectedUserType === 'oku' ? '#3b82f6' : '#e0e0e0',
                        transition: 'all 0.3s ease',
                        border: selectedUserType === 'oku' ? '2px solid #1e40af' : '2px solid transparent'
                      }}
                    >
                      <IonCardContent style={{ padding: '20px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <h3 style={{ 
                            fontSize: '18px', 
                            fontWeight: '700', 
                            margin: '0 0 8px', 
                            color: selectedUserType === 'oku' ? 'white' : '#1e293b' 
                          }}>
                            OKU User
                          </h3>
                          <p style={{ 
                            margin: '0', 
                            fontSize: '14px', 
                            color: selectedUserType === 'oku' ? 'rgba(255,255,255,0.9)' : '#64748b' 
                          }}>
                            Accessible parking with OKU ID
                          </p>
                        </div>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                </IonRow>
              </IonGrid>

              {selectedUserType === 'oku' && (
                <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                  <IonItem style={{ '--background': 'transparent', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <IonLabel position="stacked" style={{ fontWeight: '500', color: '#1e293b' }}>
                      OKU ID Number (6 digits)
                    </IonLabel>
                    <IonInput
                      type="number"
                      placeholder="Enter OKU ID"
                      value={okuId}
                      onIonInput={(e) => setOkuId(e.detail.value!)}
                      maxlength={6}
                      style={{ '--padding-start': '10px' }}
                    />
                  </IonItem>
                </div>
              )}

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
                  marginTop: '20px',
                  fontWeight: 'bold'
                }}
              >
                Continue
              </IonButton>
            </IonCardContent>
          </IonCard>

          {/* Display selected zone info */}
          {location.state?.zoneName && (
            <IonCard style={{ borderRadius: '15px', background: 'rgba(59, 130, 246, 0.1)' }}>
              <IonCardContent style={{ padding: '15px' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0', fontSize: '14px', color: '#3b82f6', fontWeight: '500' }}>
                    Selected Zone: {location.state?.zoneName}
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

export default UserTypeSelection;