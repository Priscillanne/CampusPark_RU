import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonText,
  IonToast,
  IonBadge,
  IonSpinner,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonButtons,
  IonItem
} from '@ionic/react';
import { create, trash, time, calendar, car, navigate, flash, close, save } from 'ionicons/icons';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useCachedData } from '../hook';

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
  lotNumber: string;
  parkingType: string;
  bookedBayType: string;
  isOKUBay: boolean;
  status: string;
  createdAt: any;
  updatedAt: any;
}

const Sessions: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [historyBookings, setHistoryBookings] = useState<Booking[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<'active' | 'history'>('active');
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');
  
  // Edit Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editFormData, setEditFormData] = useState({
    date: '',
    timeIn: '',
    timeOut: '',
    zone: '',
    lotNumber: '',
    carPlate: ''
  });
  const [updating, setUpdating] = useState(false);

  // Use the caching hook for bookings data
  const { data: allBookings, loading: dataLoading } = useCachedData({
    collectionName: 'parkingBookings',
    storageKey: 'cachedBookings',
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        processBookings(currentUser.uid);
      } else {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [allBookings, dataLoading]);

  const processBookings = (userId: string) => {
    try {
      if (dataLoading) {
        setLoading(true);
        return;
      }

      // Filter bookings by current user
      const userBookings = allBookings.filter((booking: Booking) => booking.userId === userId);
      
      const now = new Date();
      const active: Booking[] = [];
      const history: Booking[] = [];

      userBookings.forEach((booking: Booking) => {
        const bookingDateTime = new Date(`${booking.date}T${booking.timeOut}`);
        if (bookingDateTime > now) {
          active.push(booking);
        } else {
          history.push(booking);
        }
      });

      setActiveBookings(active);
      setHistoryBookings(history);
    } catch (error) {
      console.error('Error processing bookings:', error);
      setToastMessage('Failed to load bookings');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (booking: Booking) => {
    console.log('Editing booking:', booking);
    
    // Validate booking data
    if (!booking.bookingId) {
      console.error('No booking ID found!');
      setToastMessage('Error: Invalid booking data');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    setEditingBooking(booking);
    setEditFormData({
      date: booking.date || '',
      timeIn: booking.timeIn || '',
      timeOut: booking.timeOut || '',
      zone: booking.zone || '',
      lotNumber: booking.lotNumber || '',
      carPlate: booking.carPlate || ''
    });
    setShowEditModal(true);
  };

  const handleDelete = (booking: Booking) => {
    localStorage.setItem('deletingBooking', JSON.stringify(booking));
    window.location.href = '/delete-confirmation';
  };

  const handleUpdateBooking = async () => {
    if (!editingBooking) return;

    // Validate required fields
    if (!editFormData.date || !editFormData.timeIn || !editFormData.timeOut || 
        !editFormData.zone || !editFormData.lotNumber || !editFormData.carPlate) {
      setToastMessage('Please fill in all fields');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    setUpdating(true);
    try {
      console.log('Starting update for booking:', editingBooking.bookingId);
      
      // Check if document exists first
      const bookingRef = doc(db, 'parkingBookings', editingBooking.bookingId);
      
      // Try to get the document first to verify it exists
      const bookingSnap = await getDoc(bookingRef);
      
      if (!bookingSnap.exists()) {
        throw new Error('Booking document does not exist');
      }

      console.log('Document exists, proceeding with update...');

      // Prepare update data
      const updateData = {
        date: editFormData.date,
        timeIn: editFormData.timeIn,
        timeOut: editFormData.timeOut,
        zone: editFormData.zone,
        slotLabel: editFormData.lotNumber,
        lotNumber: editFormData.lotNumber,
        carPlate: editFormData.carPlate,
        updatedAt: new Date()
      };

      console.log('Update data to be sent:', updateData);

      // Perform the update
      await updateDoc(bookingRef, updateData);
      console.log('Update successful!');

      // Update local state
      const updatedBookings = activeBookings.map(booking => 
        booking.bookingId === editingBooking.bookingId 
          ? { ...booking, ...updateData }
          : booking
      );
      setActiveBookings(updatedBookings);

      // Reset states
      setShowEditModal(false);
      setEditingBooking(null);
      
      setToastMessage('Booking updated successfully! 🎉');
      setToastColor('success');
      setShowToast(true);

    } catch (error: any) {
      console.error('❌ Error updating booking:', error);
      
      // Detailed error logging
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        name: error.name
      });

      // User-friendly error messages
      let errorMessage = 'Failed to update booking';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'You do not have permission to update this booking. Please check if you are logged in.';
      } else if (error.code === 'not-found') {
        errorMessage = 'Booking not found. It may have been deleted.';
      } else if (error.message?.includes('document does not exist')) {
        errorMessage = 'This booking no longer exists.';
      } else {
        errorMessage = `Update failed: ${error.message || 'Unknown error'}`;
      }

      setToastMessage(errorMessage);
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setUpdating(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return '#10B981';
      case 'active': return '#3B82F6';
      case 'completed': return '#6B7280';
      case 'cancelled': return '#EF4444';
      default: return '#F97316';
    }
  };

  const getZoneColor = (zone: string) => {
    const zoneColors: { [key: string]: string } = {
      'A': '#3B82F6',
      'B': '#10B981',
      'C': '#F59E0B',
      'D': '#EF4444',
      'E': '#8B5CF6',
      'F': '#EC4899'
    };
    return zoneColors[zone] || '#6B7280';
  };

  const styles = `
    .sessions-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      position: relative;
      overflow: hidden;
    }

    .sessions-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 40%;
      background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
      clip-path: polygon(0 0, 100% 0, 100% 70%, 0 100%);
    }

    .header-content {
      position: relative;
      z-index: 2;
      padding: 20px 16px 0;
    }

    .page-title {
      color: white;
      font-size: 2.5rem;
      font-weight: 800;
      margin: 0 0 8px 0;
      text-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }

    .page-subtitle {
      color: rgba(255, 255, 255, 0.9);
      font-size: 1rem;
      margin: 0 0 20px 0;
      font-weight: 400;
    }

    .stats-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 20px;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      padding: 16px;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .stat-number {
      color: white;
      font-size: 2rem;
      font-weight: 800;
      margin: 0;
      line-height: 1;
    }

    .stat-label {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.8rem;
      margin: 4px 0 0 0;
      font-weight: 500;
    }

    .segment-container {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      margin: 0 16px;
      border-radius: 16px;
      padding: 8px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .custom-segment {
      --background: transparent;
    }

    .segment-button {
      --background-checked: linear-gradient(135deg, #667eea, #764ba2);
      --color-checked: white;
      --border-radius: 12px;
      --padding-top: 12px;
      --padding-bottom: 12px;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .bookings-container {
      padding: 20px 16px;
    }

    .booking-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 20px;
      margin: 0 0 16px 0;
      box-shadow: 
        0 8px 32px rgba(0,0,0,0.1),
        0 4px 16px rgba(0,0,0,0.08);
      border: 1px solid rgba(255, 255, 255, 0.2);
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .booking-card:hover {
      transform: translateY(-4px);
      box-shadow: 
        0 12px 40px rgba(0,0,0,0.15),
        0 6px 20px rgba(0,0,0,0.1);
    }

    .booking-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #FFD700, #F97316, #667eea);
    }

    .booking-header {
      display: flex;
      justify-content: between;
      align-items: center;
      margin-bottom: 16px;
    }

    .zone-badge {
      background: linear-gradient(135deg, #3B82F6, #1D4ED8);
      color: white;
      padding: 8px 16px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 1.1rem;
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
    }

    .status-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      color: white;
    }

    .booking-details {
      display: grid;
      gap: 12px;
    }

    .detail-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .detail-icon {
      color: #667eea;
      font-size: 1.2rem;
      min-width: 24px;
    }

    .detail-text {
      color: #1a1a1a;
      font-size: 0.95rem;
      font-weight: 500;
    }

    .car-plate {
      background: linear-gradient(135deg, #FFD700, #F97316);
      color: white;
      padding: 4px 12px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.9rem;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }

    .action-btn {
      flex: 1;
      --border-radius: 12px;
      --padding-top: 12px;
      --padding-bottom: 12px;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .edit-btn {
      --background: linear-gradient(135deg, #3B82F6, #1D4ED8);
      --box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
    }

    .delete-btn {
      --background: linear-gradient(135deg, #EF4444, #DC2626);
      --box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
    }

    .action-btn:hover {
      transform: translateY(-2px);
    }

    .edit-btn:hover {
      --box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
    }

    .delete-btn:hover {
      --box-shadow: 0 6px 20px rgba(239, 68, 68, 0.6);
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: white;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 16px;
      opacity: 0.7;
    }

    .empty-text {
      font-size: 1.2rem;
      margin-bottom: 8px;
      font-weight: 600;
    }

    .empty-subtext {
      opacity: 0.8;
      margin-bottom: 24px;
    }

    .new-booking-btn {
      --background: linear-gradient(135deg, #FFD700, #F97316);
      --border-radius: 16px;
      --padding-top: 16px;
      --padding-bottom: 16px;
      --box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
      font-weight: 700;
    }

    .floating-elements {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    }

    .floating-element {
      position: absolute;
      font-size: 2rem;
      opacity: 0.1;
      animation: float 6s ease-in-out infinite;
    }

    /* Edit Modal Styles */
    .edit-modal-content {
      --background: white;
    }

    .modal-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .form-container {
      padding: 20px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-label {
      color: #374151;
      font-weight: 600;
      margin-bottom: 8px;
      display: block;
    }

    .time-inputs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    .save-btn {
      --background: linear-gradient(135deg, #10B981, #059669);
      flex: 1;
    }

    .cancel-btn {
      --background: linear-gradient(135deg, #6B7280, #4B5563);
      flex: 1;
    }

    .original-booking-info {
      background: #f3f4f6;
      padding: 12px;
      border-radius: 8px;
      margin-top: 16px;
      border-left: 4px solid #667eea;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(10deg); }
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 60vh;
      color: white;
    }

    .loading-spinner {
      color: white;
      --color: white;
      margin-bottom: 16px;
    }

    @media (max-width: 480px) {
      .stats-container {
        grid-template-columns: 1fr;
      }
      
      .action-buttons {
        flex-direction: column;
      }

      .time-inputs {
        grid-template-columns: 1fr;
      }

      .modal-actions {
        flex-direction: column;
      }
    }
  `;

  // Inject styles
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleTag = document.createElement('style');
      styleTag.innerHTML = styles;
      document.head.appendChild(styleTag);
      
      return () => {
        document.head.removeChild(styleTag);
      };
    }
  }, []);

  const renderBookingCard = (booking: Booking, isActive: boolean) => (
    <IonCard key={booking.bookingId} className="booking-card">
      <IonCardContent style={{ padding: '20px' }}>
        {/* Header */}
        <div className="booking-header">
          <div className="zone-badge" style={{ background: `linear-gradient(135deg, ${getZoneColor(booking.zone)}, ${getZoneColor(booking.zone)}CC)` }}>
            {booking.zone} • Lot {booking.lotNumber}
          </div>
          <div 
            className="status-badge" 
            style={{ backgroundColor: getStatusColor(booking.status) }}
          >
            {isActive ? 'ACTIVE' : 'COMPLETED'}
          </div>
        </div>

        {/* Details */}
        <div className="booking-details">
          <div className="detail-row">
            <IonIcon icon={calendar} className="detail-icon" />
            <IonText className="detail-text">{booking.date}</IonText>
          </div>
          
          <div className="detail-row">
            <IonIcon icon={time} className="detail-icon" />
            <IonText className="detail-text">{booking.timeIn} - {booking.timeOut}</IonText>
          </div>
          
          <div className="detail-row">
            <IonIcon icon={car} className="detail-icon" />
            <div className="car-plate">{booking.carPlate}</div>
          </div>
          
          <div className="detail-row">
            <IonIcon icon={navigate} className="detail-icon" />
            <IonText className="detail-text">{booking.parkingType} • {booking.bookedBayType}</IonText>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          {isActive && (
            <IonButton
              className="action-btn edit-btn"
              onClick={() => handleEdit(booking)}
            >
              <IonIcon icon={create} slot="start" />
              Edit
            </IonButton>
          )}
          <IonButton
            className="action-btn delete-btn"
            onClick={() => handleDelete(booking)}
          >
            <IonIcon icon={trash} slot="start" />
            Delete
          </IonButton>
        </div>
      </IonCardContent>
    </IonCard>
  );

  // Edit Modal Component
  const EditModal = () => (
    <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
      <IonHeader>
        <IonToolbar className="modal-header">
          <IonTitle>Edit Booking</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowEditModal(false)}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="edit-modal-content">
        <div className="form-container">
          {/* Date Field */}
          <IonItem>
            <IonLabel position="stacked">Date</IonLabel>
            <IonInput
              type="date"
              value={editFormData.date}
              onIonInput={(e) => handleInputChange('date', e.detail.value!)}
            />
          </IonItem>

          {/* Time Fields */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <IonItem style={{ flex: 1 }}>
              <IonLabel position="stacked">Time In</IonLabel>
              <IonInput
                type="time"
                value={editFormData.timeIn}
                onIonInput={(e) => handleInputChange('timeIn', e.detail.value!)}
              />
            </IonItem>
            <IonItem style={{ flex: 1 }}>
              <IonLabel position="stacked">Time Out</IonLabel>
              <IonInput
                type="time"
                value={editFormData.timeOut}
                onIonInput={(e) => handleInputChange('timeOut', e.detail.value!)}
              />
            </IonItem>
          </div>

          {/* Zone Field */}
          <IonItem style={{ marginTop: '20px' }}>
            <IonLabel position="stacked">Zone</IonLabel>
            <IonSelect
              value={editFormData.zone}
              onIonChange={(e) => handleInputChange('zone', e.detail.value)}
              interface="action-sheet"
            >
              <IonSelectOption value="A">Zone A</IonSelectOption>
              <IonSelectOption value="B">Zone B</IonSelectOption>
              <IonSelectOption value="C">Zone C</IonSelectOption>
              <IonSelectOption value="D">Zone D</IonSelectOption>
              <IonSelectOption value="E">Zone E</IonSelectOption>
              <IonSelectOption value="F">Zone F</IonSelectOption>
            </IonSelect>
          </IonItem>

          {/* Lot Number Field */}
          <IonItem style={{ marginTop: '20px' }}>
            <IonLabel position="stacked">Lot Number</IonLabel>
            <IonInput
              type="text"
              value={editFormData.lotNumber}
              onIonInput={(e) => handleInputChange('lotNumber', e.detail.value!)}
              placeholder="Enter lot number"
            />
          </IonItem>

          {/* Car Plate Field */}
          <IonItem style={{ marginTop: '20px' }}>
            <IonLabel position="stacked">Car Plate</IonLabel>
            <IonInput
              type="text"
              value={editFormData.carPlate}
              onIonInput={(e) => handleInputChange('carPlate', e.detail.value!)}
              placeholder="Enter car plate"
            />
          </IonItem>

          {/* Original Booking Info */}
          {editingBooking && (
            <IonCard style={{ marginTop: '20px' }}>
              <IonCardContent>
                <IonText color="medium">
                  <small>
                    <strong>Original Booking:</strong><br />
                    Zone {editingBooking.zone} • Lot {editingBooking.lotNumber}<br />
                    {editingBooking.date} • {editingBooking.timeIn} - {editingBooking.timeOut}<br />
                    Car: {editingBooking.carPlate}
                  </small>
                </IonText>
              </IonCardContent>
            </IonCard>
          )}

          {/* Action Buttons */}
          <div className="modal-actions">
            <IonButton 
              className="cancel-btn" 
              onClick={() => setShowEditModal(false)}
              disabled={updating}
              expand="block"
            >
              <IonIcon icon={close} slot="start" />
              Cancel
            </IonButton>
            <IonButton 
              className="save-btn" 
              onClick={handleUpdateBooking}
              disabled={updating}
              expand="block"
            >
              <IonIcon icon={save} slot="start" />
              {updating ? 'Updating...' : 'Save Changes'}
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );

  if (loading) {
    return (
      <IonPage>
        <IonContent className="sessions-container">
          <div className="loading-container">
            <IonSpinner className="loading-spinner" />
            <IonText>Loading your sessions...</IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!user) {
    return (
      <IonPage>
        <IonContent className="sessions-container">
          <div className="empty-state">
            <IonIcon icon={flash} className="empty-icon" />
            <div className="empty-text">Authentication Required</div>
            <div className="empty-subtext">Please log in to view your sessions</div>
            <IonButton 
              className="new-booking-btn"
              onClick={() => window.location.href = '/login'}
            >
              Go to Login
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent className="sessions-container">
        {/* Floating Elements */}
        <div className="floating-elements">
          <div className="floating-element" style={{ top: '15%', left: '5%' }}>🚗</div>
          <div className="floating-element" style={{ top: '25%', right: '8%' }}>🅿️</div>
          <div className="floating-element" style={{ bottom: '30%', left: '10%' }}>📍</div>
        </div>

        {/* Header Content */}
        <div className="header-content">
          <h1 className="page-title">My Sessions</h1>
          <p className="page-subtitle">Manage your parking bookings</p>
          
          {/* Stats */}
          <div className="stats-container">
            <div className="stat-card">
              <div className="stat-number">{activeBookings.length}</div>
              <div className="stat-label">Active</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{historyBookings.length}</div>
              <div className="stat-label">History</div>
            </div>
          </div>

          {/* Segment Control */}
          <div className="segment-container">
            <IonSegment 
              value={selectedSegment}
              onIonChange={(e) => setSelectedSegment(e.detail.value as 'active' | 'history')}
              className="custom-segment"
            >
              <IonSegmentButton value="active" className="segment-button">
                <IonLabel style={{ color: 'black' }}>Active</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="history" className="segment-button">
                <IonLabel style={{ color: 'black' }}>History</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </div>
        </div>

        {/* Bookings List */}
        <div className="bookings-container">
          {selectedSegment === 'active' && (
            <>
              {activeBookings.length === 0 ? (
                <div className="empty-state">
                  <IonIcon icon={time} className="empty-icon" />
                  <div className="empty-text">No Active Bookings</div>
                  <div className="empty-subtext">You don't have any active parking sessions</div>
                  <IonButton 
                    className="new-booking-btn"
                    onClick={() => window.location.href = '/booking'}
                  >
                    Book New Parking
                  </IonButton>
                </div>
              ) : (
                activeBookings.map((booking) => renderBookingCard(booking, true))
              )}
            </>
          )}

          {selectedSegment === 'history' && (
            <>
              {historyBookings.length === 0 ? (
                <div className="empty-state">
                  <IonIcon icon={calendar} className="empty-icon" />
                  <div className="empty-text">No History</div>
                  <div className="empty-subtext">Your past bookings will appear here</div>
                </div>
              ) : (
                historyBookings.map((booking) => renderBookingCard(booking, false))
              )}
            </>
          )}
        </div>

        {/* Edit Modal */}
        <EditModal />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          color={toastColor}
        />
      </IonContent>
    </IonPage>
  );
};

export default Sessions;