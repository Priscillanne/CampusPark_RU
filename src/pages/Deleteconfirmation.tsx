import React from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from '@ionic/react';

const styles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  .delete-page-container {
    min-height: 100vh;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
  }

  .delete-modal {
    max-width: 400px;
    width: 100%;
    background: white;
    border-radius: 20px;
    padding: 32px 24px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  }

  .delete-title {
    font-size: 24px;
    font-weight: 700;
    color: #000;
    text-align: center;
    margin-bottom: 16px;
  }

  .delete-message {
    font-size: 15px;
    color: #666;
    text-align: center;
    line-height: 1.6;
    margin-bottom: 32px;
  }

  .delete-button-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .delete-btn {
    height: 56px;
    border-radius: 16px;
    font-size: 18px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-cancel {
    background: white;
    border: 3px solid #ffd700;
    color: #000;
  }

  .btn-cancel:hover {
    background: #fffef5;
  }

  .btn-confirm-delete {
    background: #dc3545;
    color: white;
  }

  .btn-confirm-delete:hover {
    background: #c82333;
  }
`;

if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = styles;
  document.head.appendChild(styleTag);
}

interface DeleteConfirmationProps {
  bookingData?: {
    zone: string;
    lotNumber: string;
  };
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = () => {
  // Get booking data from localStorage
  const deletingBookingData = localStorage.getItem('deletingBooking');
  let bookingInfo = { zone: 'Zone A', lotNumber: 'A-127' };
  
  if (deletingBookingData) {
    try {
      const parsed = JSON.parse(deletingBookingData);
      bookingInfo = {
        zone: parsed.zone || 'Zone A',
        lotNumber: parsed.lotNumber || 'A-127'
      };
    } catch (e) {
      console.error('Error parsing deleting booking:', e);
    }
  }

  const handleCancel = () => {
    console.log('❌ Delete cancelled');
    localStorage.removeItem('deletingBooking');
    window.location.replace('/booking-confirmation');
  };

  const handleConfirmDelete = async () => {
    console.log('✅ Delete confirmed');

    try {
      const deletingBooking = localStorage.getItem('deletingBooking');
      if (!deletingBooking) {
        window.location.href = '/booking';
        return;
      }

      const bookingToDelete = JSON.parse(deletingBooking);

      // Import Firebase dynamically - FIXED IMPORT PATH
      const { doc, deleteDoc } = await import('firebase/firestore');
      const { db, auth } = await import('../firebaseConfig');

      // Check if user is authenticated
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('No user logged in');
        window.location.replace('/login');
        return;
      }

      // Verify the booking belongs to the current user
      if (bookingToDelete.userId !== currentUser.uid) {
        console.error('Unauthorized: booking does not belong to current user');
        alert('You can only delete your own bookings');
        localStorage.removeItem('deletingBooking');
        window.location.replace('/booking-confirmation');
        return;
      }

      // Delete from Firestore
      await deleteDoc(doc(db, 'parkingBookings', bookingToDelete.bookingId));
      
      // Update localStorage - filter by userId as well
      const cached = localStorage.getItem('bookings');
      if (cached) {
        const bookings = JSON.parse(cached);
        const updated = bookings.filter((b: any) => b.bookingId !== bookingToDelete.bookingId);
        localStorage.setItem('bookings', JSON.stringify(updated));
      }
      
      // Clear deleting flag
      localStorage.removeItem('deletingBooking');
      
      // Navigate to homepage
      console.log('🏠 Navigating to homepage');
      window.location.replace('/home');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete booking');
      localStorage.removeItem('deletingBooking');
      window.location.href = '/booking-confirmation';
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Delete Booking</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="delete-page-container">
          <div className="delete-modal">
            <h2 className="delete-title">Delete Booking?</h2>
            <p className="delete-message">
              Are you sure you want to cancel this booking for {bookingInfo.zone} • Lot {bookingInfo.lotNumber}? 
              This bay will become available to others.
            </p>
            
            <div className="delete-button-group">
              <button className="delete-btn btn-cancel" onClick={handleCancel}>
                Cancel
              </button>
              <button className="delete-btn btn-confirm-delete" onClick={handleConfirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DeleteConfirmation;