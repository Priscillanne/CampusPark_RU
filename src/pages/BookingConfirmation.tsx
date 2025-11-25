import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonToast,
  IonLoading,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import { collection, onSnapshot, query, where, doc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { useHistory, useLocation } from 'react-router-dom';
import { NotificationService } from '../services/notificationService';
import { FileSystemService, BookingReceipt } from '../services/fileSystemService';
import { download, checkmarkCircle, time, location, person, car, calendar, school } from 'ionicons/icons';

interface Booking {
  bookingId: string;
  userId: string;
  fullName: string;
  studentId: string;
  carPlate: string;
  date: string;
  timeIn: string;
  timeOut: string;
  duration: string;
  zone: string;
  slotLabel: string;
  slotId: string;
  bookedBayType: string;
  parkingType: string;
  status?: string;
  createdAt?: any;
  hasPenalty?: boolean;
  penaltyAmount?: number;
  penalties?: any[];
  totalPenalty?: number;
  hasRemovedCar?: boolean;
}

const BookingConfirmation: React.FC = () => {
  const history = useHistory();
  const location = useHistory().location as any;
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingBooking, setSavingBooking] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      window.location.replace('/login');
      return;
    }

    if (location.state?.bookingData) {
      const newBooking = location.state.bookingData;
      handleNewBooking(newBooking);
      return;
    }

    fetchUserBookings(currentUser.uid);
  }, [location.state]);

  const handleNewBooking = async (newBooking: Booking) => {
    try {
      setSavingBooking(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        setToastMessage('Please log in to book parking');
        setToastColor('danger');
        setShowToast(true);
        return;
      }

      const bookingId = newBooking.bookingId || `booking_${currentUser.uid}_${Date.now()}`;

      const bookingDoc = {
        ...newBooking,
        bookingId: bookingId,
        userId: currentUser.uid,
        status: 'confirmed',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        hasParked: false,
        hasRemovedCar: false,
        penalties: [],
        totalPenalty: 0
      };

      await setDoc(doc(db, 'parkingBookings', bookingId), bookingDoc);

      // Schedule notifications
      try {
        const startDateTime = new Date(`${newBooking.date}T${newBooking.timeIn}`);
        const endDateTime = new Date(`${newBooking.date}T${newBooking.timeOut}`);

        if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
          throw new Error('Invalid date format');
        }

        const notificationData = {
          zone: newBooking.zone,
          lot: newBooking.slotLabel,
          startTime: startDateTime,
          endTime: endDateTime,
          bookingId: bookingId
        };

        await NotificationService.scheduleParkingReminders(notificationData);
      } catch (notificationError) {
        console.error('Notification scheduling failed:', notificationError);
      }

      // Update parking slot
      try {
        const parkingSlotRef = doc(db, 'parkingSlots', `${newBooking.zone}_${newBooking.slotId}`);
        await setDoc(parkingSlotRef, {
          status: 'booked',
          bookedBy: currentUser.uid,
          bookingId: bookingId,
          bookedUntil: newBooking.timeOut,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (slotError) {
        console.error('Parking slot update failed:', slotError);
      }

      setCurrentBooking({ ...newBooking, bookingId });
      setUserBookings(prev => [...prev, { ...newBooking, bookingId }]);
      
      setToastMessage('Parking reservation confirmed successfully');
      setToastColor('success');
      setShowToast(true);

    } catch (error: any) {
      setToastMessage('Reservation failed: ' + error.message);
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setLoading(false);
      setSavingBooking(false);
    }
  };

  // Download PDF Receipt
  const handleDownloadReceipt = async () => {
    if (!currentBooking) return;
    
    setGeneratingPDF(true);
    try {
      const receiptData: BookingReceipt = {
        ...currentBooking,
        createdAt: currentBooking.createdAt?.toDate?.()?.toLocaleString() || new Date().toLocaleString()
      };

      await FileSystemService.exportBookingReceipt(receiptData);
      
      setToastMessage('Official receipt downloaded');
      setToastColor('success');
      setShowToast(true);
      
    } catch (error: any) {
      setToastMessage('Download failed: ' + error.message);
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Download PDF History
  const handleDownloadHistory = async () => {
    if (userBookings.length === 0) return;
    
    setGeneratingPDF(true);
    try {
      const historyData: BookingReceipt[] = userBookings.map(booking => ({
        ...booking,
        createdAt: booking.createdAt?.toDate?.()?.toLocaleString() || new Date().toLocaleString()
      }));

      await FileSystemService.exportBookingHistory(historyData);
      
      setToastMessage(`Booking history exported (${userBookings.length} records)`);
      setToastColor('success');
      setShowToast(true);
      
    } catch (error: any) {
      setToastMessage('Export failed: ' + error.message);
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setGeneratingPDF(false);
    }
  };

  const fetchUserBookings = (userId: string) => {
    try {
      const bookingsRef = collection(db, 'parkingBookings');
      const q = query(bookingsRef, where('userId', '==', userId));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const bookings: Booking[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          bookings.push({
            bookingId: doc.id,
            ...data
          } as Booking);
        });

        bookings.sort((a, b) => {
          const timeA = a.createdAt?.toDate?.() || new Date(0);
          const timeB = b.createdAt?.toDate?.() || new Date(0);
          return timeB.getTime() - timeA.getTime();
        });

        setUserBookings(bookings);

        if (bookings.length > 0) {
          setCurrentBooking(bookings[0]);
        }

        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up Firestore listener:', error);
      setLoading(false);
    }
  };

  const handleDone = () => {
    history.replace('/home');
  };

  if (loading || savingBooking) {
    return (
      <IonPage>
        <IonContent className="elegant-background">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            flexDirection: 'column'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '40px',
              borderRadius: '20px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              minWidth: '300px'
            }}>
              <IonLoading isOpen={true} message={savingBooking ? "Securing your reservation..." : "Loading your details..."} />
              <p style={{ marginTop: '20px', color: '#666', fontSize: '14px' }}>
                {savingBooking ? "Processing your parking reservation..." : "Retrieving your booking information..."}
              </p>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!currentBooking || userBookings.length === 0) {
    return (
      <IonPage>
        <IonContent className="elegant-background">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            flexDirection: 'column',
            padding: '20px'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '50px 40px',
              borderRadius: '20px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              maxWidth: '400px',
              width: '100%'
            }}>
              <div style={{
                fontSize: '64px',
                marginBottom: '20px',
                opacity: '0.7'
              }}>
                🚗
              </div>
              <h2 style={{ 
                margin: '0 0 15px 0',
                color: '#2c3e50',
                fontWeight: '300',
                fontSize: '24px'
              }}>
                No Active Reservations
              </h2>
              <p style={{ 
                color: '#7f8c8d',
                margin: '0 0 30px 0',
                lineHeight: '1.5'
              }}>
                You haven't made any parking reservations yet.
              </p>
              <IonButton 
                onClick={() => history.replace('/zone')}
                style={{
                  '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '--border-radius': '12px',
                  '--padding-top': '18px',
                  '--padding-bottom': '18px',
                  'font-weight': '500'
                }}
                expand="block"
              >
                Reserve Parking Space
              </IonButton>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader className="elegant-header">
        <IonToolbar style={{
          '--background': 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
          '--border-width': '0'
        }}>
          <IonTitle style={{
            'color': 'white',
            'font-weight': '300',
            'font-size': '18px'
          }}>
            Booking Confirmation
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="elegant-background">
        <div style={{ padding: '0' }}>
          
          {/* Hero Section */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '40px 20px',
            textAlign: 'center'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              backdropFilter: 'blur(10px)'
            }}>
              <IonIcon icon={checkmarkCircle} style={{ fontSize: '40px', color: 'white' }} />
            </div>
            <h1 style={{ 
              margin: '0 0 10px 0',
              fontSize: '28px',
              fontWeight: '300',
              letterSpacing: '0.5px'
            }}>
              Reservation Confirmed
            </h1>
            <p style={{ 
              margin: '0',
              opacity: '0.9',
              fontSize: '16px',
              fontWeight: '300'
            }}>
              Your parking space has been secured
            </p>
          </div>

          {/* Main Content */}
          <div style={{ padding: '30px 20px' }}>
            
            {/* Booking Summary Card */}
            <IonCard style={{
              margin: '0 0 30px 0',
              borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
              background: 'white',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                padding: '25px',
                borderBottom: '1px solid rgba(0,0,0,0.05)'
              }}>
                <IonGrid style={{ padding: '0' }}>
                  <IonRow>
                    <IonCol size="8">
                      <h3 style={{ 
                        margin: '0 0 5px 0',
                        color: '#2c3e50',
                        fontSize: '20px',
                        fontWeight: '400'
                      }}>
                        {currentBooking.zone} • {currentBooking.slotLabel}
                      </h3>
                      <p style={{ 
                        margin: '0',
                        color: '#7f8c8d',
                        fontSize: '14px'
                      }}>
                        Reserved Parking Spot
                      </p>
                    </IonCol>
                    <IonCol size="4" style={{ textAlign: 'right' }}>
                      <div style={{
                        background: 'rgba(52, 152, 219, 0.1)',
                        color: '#3498db',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        display: 'inline-block'
                      }}>
                        CONFIRMED
                      </div>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </div>

              <IonCardContent style={{ padding: '0' }}>
                <IonGrid style={{ padding: '0' }}>
                  
                  <IonRow style={{ 
                    padding: '20px 25px',
                    borderBottom: '1px solid rgba(0,0,0,0.05)'
                  }}>
                    <IonCol size="auto" style={{ padding: '0 15px 0 0' }}>
                      <IonIcon icon={person} style={{ 
                        color: '#3498db',
                        fontSize: '20px'
                      }} />
                    </IonCol>
                    <IonCol>
                      <IonLabel style={{ fontSize: '14px', color: '#7f8c8d' }}>Student</IonLabel>
                      <div style={{ fontSize: '16px', color: '#2c3e50', fontWeight: '500' }}>
                        {currentBooking.fullName}
                      </div>
                    </IonCol>
                  </IonRow>

                  <IonRow style={{ 
                    padding: '20px 25px',
                    borderBottom: '1px solid rgba(0,0,0,0.05)'
                  }}>
                    <IonCol size="auto" style={{ padding: '0 15px 0 0' }}>
                      <IonIcon icon={school} style={{ 
                        color: '#9b59b6',
                        fontSize: '20px'
                      }} />
                    </IonCol>
                    <IonCol>
                      <IonLabel style={{ fontSize: '14px', color: '#7f8c8d' }}>Student ID</IonLabel>
                      <div style={{ fontSize: '16px', color: '#2c3e50', fontWeight: '500' }}>
                        {currentBooking.studentId}
                      </div>
                    </IonCol>
                  </IonRow>

                  <IonRow style={{ 
                    padding: '20px 25px',
                    borderBottom: '1px solid rgba(0,0,0,0.05)'
                  }}>
                    <IonCol size="auto" style={{ padding: '0 15px 0 0' }}>
                      <IonIcon icon={car} style={{ 
                        color: '#e74c3c',
                        fontSize: '20px'
                      }} />
                    </IonCol>
                    <IonCol>
                      <IonLabel style={{ fontSize: '14px', color: '#7f8c8d' }}>Vehicle</IonLabel>
                      <div style={{ fontSize: '16px', color: '#2c3e50', fontWeight: '500' }}>
                        {currentBooking.carPlate}
                      </div>
                    </IonCol>
                  </IonRow>

                  <IonRow style={{ 
                    padding: '20px 25px',
                    borderBottom: '1px solid rgba(0,0,0,0.05)'
                  }}>
                    <IonCol size="auto" style={{ padding: '0 15px 0 0' }}>
                      <IonIcon icon={calendar} style={{ 
                        color: '#27ae60',
                        fontSize: '20px'
                      }} />
                    </IonCol>
                    <IonCol>
                      <IonLabel style={{ fontSize: '14px', color: '#7f8c8d' }}>Date & Time</IonLabel>
                      <div style={{ fontSize: '16px', color: '#2c3e50', fontWeight: '500' }}>
                        {currentBooking.date} • {currentBooking.timeIn} - {currentBooking.timeOut}
                      </div>
                    </IonCol>
                  </IonRow>

                  <IonRow style={{ padding: '20px 25px' }}>
                    <IonCol size="auto" style={{ padding: '0 15px 0 0' }}>
                      <IonIcon icon={location} style={{ 
                        color: '#f39c12',
                        fontSize: '20px'
                      }} />
                    </IonCol>
                    <IonCol>
                      <IonLabel style={{ fontSize: '14px', color: '#7f8c8d' }}>Parking Type</IonLabel>
                      <div style={{ fontSize: '16px', color: '#2c3e50', fontWeight: '500' }}>
                        {currentBooking.bookedBayType}
                      </div>
                    </IonCol>
                  </IonRow>

                </IonGrid>
              </IonCardContent>
            </IonCard>

            {/* Document Downloads */}
            <IonCard style={{
              borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
              background: 'white',
              marginBottom: '30px'
            }}>
              <IonCardContent style={{ padding: '30px' }}>
                <h3 style={{ 
                  margin: '0 0 25px 0',
                  color: '#2c3e50',
                  fontSize: '20px',
                  fontWeight: '400',
                  textAlign: 'center'
                }}>
                  Download Documents
                </h3>
                
                <div style={{ marginBottom: '20px' }}>
                  <IonButton 
                    expand="block" 
                    onClick={handleDownloadReceipt}
                    disabled={generatingPDF}
                    style={{
                      '--background': 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                      '--border-radius': '12px',
                      '--padding-top': '20px',
                      '--padding-bottom': '20px',
                      'font-weight': '500',
                      'margin': '0'
                    }}
                  >
                    <IonIcon icon={download} slot="start" />
                    {generatingPDF ? 'Generating Document...' : 'Download Receipt'}
                  </IonButton>
                </div>
                
                {userBookings.length > 0 && (
                  <IonButton 
                    expand="block" 
                    onClick={handleDownloadHistory}
                    disabled={generatingPDF}
                    fill="outline"
                    style={{
                      '--border-radius': '12px',
                      '--padding-top': '20px',
                      '--padding-bottom': '20px',
                      '--border-color': '#bdc3c7',
                      '--color': '#7f8c8d',
                      'font-weight': '500'
                    }}
                  >
                    <IonIcon icon={download} slot="start" />
                    {generatingPDF ? 'Compiling Records...' : 'Export History'}
                  </IonButton>
                )}
                
                <p style={{ 
                  fontSize: '12px', 
                  color: '#95a5a6', 
                  marginTop: '20px',
                  textAlign: 'center',
                  lineHeight: '1.5'
                }}>
                  Professional PDF documents with official university branding
                </p>
              </IonCardContent>
            </IonCard>

            {/* Completion Action */}
            <IonButton 
              expand="block" 
              onClick={handleDone}
              style={{
                '--background': 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
                '--border-radius': '12px',
                '--padding-top': '20px',
                '--padding-bottom': '20px',
                'font-weight': '500',
                'margin': '0'
              }}
            >
              Complete Reservation
            </IonButton>

          </div>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
          style={{ 
            '--border-radius': '12px',
            '--box-shadow': '0 10px 30px rgba(0, 0, 0, 0.1)'
          }}
        />
        
        <IonLoading 
          isOpen={generatingPDF} 
          message="Preparing your document..." 
          spinner="crescent"
        />
        
      </IonContent>

      <style>{`
        .elegant-background {
          --background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
        
        .elegant-header {
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
        }
        
        ion-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        ion-card:active {
          transform: translateY(2px);
        }
        
        .ios ion-title {
          text-align: center;
        }
      `}</style>
    </IonPage>
  );
};

export default BookingConfirmation;