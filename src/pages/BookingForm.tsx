import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonToast,
  IonIcon,
  IonText,
} from '@ionic/react';
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where, getDocs, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { useHistory, useLocation } from 'react-router-dom';
import { car, time, calendar, person, card, navigate, checkmarkCircle, alertCircle } from 'ionicons/icons';

const styles = `
  .app-container { 
    min-height: 100vh; 
    padding: 20px 16px; 
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    position: relative;
  }
  
  .app-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 40%;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
    clip-path: polygon(0 0, 100% 0, 100% 70%, 0 100%);
    z-index: 1;
  }
  
  .form-container { 
    max-width: 500px; 
    margin: 0 auto; 
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 24px; 
    padding: 32px 24px; 
    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    border: 1px solid rgba(255, 255, 255, 0.2);
    position: relative;
    z-index: 2;
  }
  
  .form-header {
    text-align: center;
    margin-bottom: 32px;
  }
  
  .form-icon {
    background: linear-gradient(135deg, #FFD700, #F97316);
    width: 64px;
    height: 64px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    box-shadow: 0 8px 25px rgba(249, 115, 22, 0.3);
  }
  
  .form-title { 
    font-size: 28px; 
    font-weight: 800; 
    color: #0F172A;
    margin: 0 0 8px 0;
  }
  
  .form-subtitle {
    color: #64748B;
    font-size: 16px;
    font-weight: 500;
  }
  
  .input-group {
    margin-bottom: 20px;
    position: relative;
  }
  
  .input-label { 
    font-size: 14px; 
    color: #374151; 
    margin: 0 0 8px 0; 
    display: block; 
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .input-wrapper {
    position: relative;
  }
  
  .input-box { 
    width: 100%; 
    padding: 16px 16px 16px 48px; 
    border: 2px solid #E5E7EB; 
    border-radius: 16px; 
    font-size: 16px; 
    background: white; 
    transition: all 0.3s ease; 
    color: #1F2937;
    font-weight: 500;
  }
  
  .input-box:focus { 
    outline: none; 
    border-color: #F97316;
    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
  }
  
  .input-box.error-input { 
    border-color: #EF4444; 
    background: #FEF2F2; 
  }
  
  .input-box.success-input {
    border-color: #10B981;
    background: #F0FDF4;
  }
  
  .input-box.readonly { 
    background: #F9FAFB; 
    color: #6B7280; 
    cursor: not-allowed;
    border-color: #D1D5DB;
  }
  
  .input-icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: #9CA3AF;
    font-size: 20px;
    z-index: 3;
  }
  
  .time-row { 
    display: grid; 
    grid-template-columns: 1fr 1fr; 
    gap: 16px; 
  }
  
  .parking-type-label { 
    font-size: 14px; 
    color: #374151; 
    margin: 24px 0 12px 0; 
    display: block; 
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .parking-buttons { 
    display: grid; 
    grid-template-columns: 1fr 1fr; 
    gap: 12px; 
    margin-bottom: 24px; 
  }
  
  .parking-btn { 
    height: 56px; 
    border-radius: 16px; 
    font-size: 16px; 
    font-weight: 600; 
    border: 2px solid; 
    cursor: pointer; 
    background: white; 
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  
  .parking-btn.normal { 
    border-color: #E5E7EB; 
    color: #6B7280; 
  }
  
  .parking-btn.normal.selected { 
    background: linear-gradient(135deg, #FFD700, #F97316);
    border-color: transparent;
    color: white;
  }
  
  .parking-btn.oku { 
    border-color: #E5E7EB;
    color: #6B7280;
  }
  
  .parking-btn.oku.selected { 
    background: linear-gradient(135deg, #10B981, #059669);
    border-color: transparent;
    color: white;
  }
  
  .action-buttons { 
    display: grid; 
    grid-template-columns: 1fr 1fr; 
    gap: 12px; 
    margin-top: 32px; 
  }
  
  .btn { 
    height: 56px; 
    border-radius: 16px; 
    font-size: 16px; 
    font-weight: 600; 
    border: none; 
    cursor: pointer; 
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  
  .btn-back { 
    background: white; 
    border: 2px solid #E5E7EB; 
    color: #6B7280; 
  }
  
  .btn-submit { 
    background: linear-gradient(135deg, #FFD700, #F97316);
    color: white;
  }
  
  .btn:disabled { 
    opacity: 0.6; 
    cursor: not-allowed;
  }
  
  .error { 
    color: #EF4444; 
    font-size: 13px; 
    margin: 8px 0 0 8px; 
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .success { 
    color: #10B981; 
    font-size: 13px; 
    margin: 8px 0 0 8px; 
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .duration { 
    color: #10B981; 
    font-weight: 600; 
    text-align: center; 
    margin: 16px 0; 
    font-size: 16px;
    background: rgba(16, 185, 129, 0.1);
    padding: 12px 16px;
    border-radius: 12px;
  }
  
  .zone-info {
    background: linear-gradient(135deg, #3B82F6, #1D4ED8);
    color: white;
    padding: 20px;
    border-radius: 16px;
    margin: 20px 0;
    text-align: center;
  }
  
  .zone-title {
    font-size: 20px;
    font-weight: 700;
    margin: 0 0 8px 0;
  }
  
  .zone-subtitle {
    font-size: 16px;
    opacity: 0.9;
    margin: 0;
  }
`;

if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = styles;
  document.head.appendChild(styleTag);
}

interface BookingData {
  bookingId?: string;
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
  parkingType: string;
  bookedBayType: string;
  isOKUBay: boolean;
  status: string;
  createdAt?: any;
  updatedAt?: any;
}

interface Errors {
  fullName?: string;
  studentId?: string;
  carPlate?: string;
  time?: string;
}

const BookingForm: React.FC = () => {
  const history = useHistory();
  const location = useHistory().location as any;
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [carPlate, setCarPlate] = useState('');
  const [parkingType, setParkingType] = useState('Normal');
  
  const [errors, setErrors] = useState<Errors>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string>('');

  // Get data from previous screens
  const { 
    userType = 'normal',
    zoneName = '',
    date = new Date().toISOString().split('T')[0],
    timeIn = '09:00',
    timeOut = '17:00',
    slotId = '',
    slotLabel = ''
  } = location.state || {};

  // Auto-set parking type based on user type
  useEffect(() => {
    if (userType === 'oku') {
      setParkingType('OKU');
    }
  }, [userType]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUserId(currentUser.uid);

      const fetchUserData = async () => {
        try {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('uid', '==', currentUser.uid));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            setFullName(userData.fullName || '');
            setStudentId(userData.studentId || '');
            setCarPlate(userData.carPlate || '');
          } else {
            setFullName(currentUser.email?.split('@')[0] || '');
          }
        } catch (error) {
          setFullName(currentUser.email?.split('@')[0] || '');
        }
      };

      fetchUserData();
    } else {
      window.location.replace('/login');
    }
  }, []);

  // VALIDATION FUNCTIONS
  const validateName = (name: string): string => {
    if (!name.trim()) return 'Full name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    const nameRegex = /^[a-zA-Z\s.'-]+$/;
    if (!nameRegex.test(name.trim())) {
      return 'Name can only contain letters, spaces, and basic punctuation';
    }
    return '';
  };

  const validateStudentId = (id: string): string => {
    if (!id.trim()) return 'Student ID is required';
    const studentIdRegex = /^[A-Z]{3}\d{6,8}$/;
    const cleanedId = id.trim().toUpperCase();
    if (!studentIdRegex.test(cleanedId)) {
      return 'Student ID must be 3 letters followed by 6-8 numbers (e.g., BAI123456)';
    }
    return '';
  };

  const validateCarPlate = (plate: string): string => {
    if (!plate.trim()) return 'Car plate is required';
    const carPlateRegex = /^[A-Z]{1,3}\s?\d{1,4}\s?[A-Z]{0,2}$/;
    const cleanedPlate = plate.trim().toUpperCase().replace(/\s+/g, ' ');
    if (!carPlateRegex.test(cleanedPlate)) {
      return 'Please enter a valid car plate (e.g., ABC 1234, W 1234 A)';
    }
    return '';
  };

  const validateTime = (): string => {
    if (!timeIn || !timeOut) return 'Both start and end times are required';
    const [inH, inM] = timeIn.split(':').map(Number);
    const [outH, outM] = timeOut.split(':').map(Number);
    const diff = (outH * 60 + outM) - (inH * 60 + inM);
    if (diff <= 0) return 'End time must be after start time';
    if (diff < 60) return 'Minimum booking duration is 1 hour';
    if (diff > 480) return 'Maximum booking duration is 8 hours';
    return '';
  };

  const handleNameChange = (value: string) => {
    setFullName(value);
    const error = validateName(value);
    setErrors(prev => ({ ...prev, fullName: error }));
  };

  const handleStudentIdChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setStudentId(upperValue);
    const error = validateStudentId(upperValue);
    setErrors(prev => ({ ...prev, studentId: error }));
  };

  const handleCarPlateChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setCarPlate(upperValue);
    const error = validateCarPlate(upperValue);
    setErrors(prev => ({ ...prev, carPlate: error }));
  };

  const getDuration = (): string => {
    if (!timeIn || !timeOut) return '';
    const [inH, inM] = timeIn.split(':').map(Number);
    const [outH, outM] = timeOut.split(':').map(Number);
    const diff = (outH * 60 + outM) - (inH * 60 + inM);
    if (diff <= 0) return '';
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`.trim();
  };

  const validateAll = (): boolean => {
    const newErrors: Errors = {
      fullName: validateName(fullName),
      studentId: validateStudentId(studentId),
      carPlate: validateCarPlate(carPlate),
      time: validateTime()
    };
    
    Object.keys(newErrors).forEach(key => {
      if (!newErrors[key as keyof Errors]) {
        delete newErrors[key as keyof Errors];
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    console.log('🔵 Submit clicked');
    
    if (isSubmitting) {
      return;
    }
    
    if (!validateAll()) {
      setToastMessage('⚠️ Please fix all errors before submitting');
      setToastColor('danger');
      setShowToast(true);
      return;
    }
    
    setIsSubmitting(true);

    try {
      const bookedBayType = parkingType;
      const bookingData: BookingData = {
        userId,
        fullName: fullName.trim(),
        studentId: studentId.trim().toUpperCase(),
        carPlate: carPlate.trim().toUpperCase(),
        date,
        timeIn,
        timeOut,
        duration: getDuration(),
        zone: zoneName,
        slotLabel: slotLabel,
        slotId: slotId,
        parkingType: parkingType,
        bookedBayType: bookedBayType,
        isOKUBay: bookedBayType === 'OKU',
        status: 'booked'
      };

      // Update the parking slot status to 'booked'
      const slotRef = doc(db, 'parkingSlots', slotId);
      await updateDoc(slotRef, {
        status: 'booked'
      });

      if (isEditMode && editingBookingId) {
        const bookingRef = doc(db, 'parkingBookings', editingBookingId);
        await updateDoc(bookingRef, {
          ...bookingData,
          updatedAt: serverTimestamp()
        });
        setToastMessage('✅ Booking updated successfully!');
        setToastColor('success');
        setShowToast(true);
        setTimeout(() => {
          window.location.href = '/sessions';
        }, 1500);
      } else {
        const bookingsRef = collection(db, 'parkingBookings');
        const docRef = await addDoc(bookingsRef, {
          ...bookingData,
          createdAt: serverTimestamp()
        });
        
        console.log('✅ Created with ID:', docRef.id);
        
        // 🔥🔥🔥 CREATE PENALTY DOCUMENT AUTOMATICALLY
        try {
          const penaltyRef = doc(db, 'penaltyPayments', userId);
          await setDoc(penaltyRef, {
            userId: userId,
            isPaid: false,
            hasCompletedBooking: false,
            isSessionActive: true,
            carRemoved: false,
            isInOvertime: false,
            penaltyAmount: 0,
            currentBookingId: docRef.id,
            zone: zoneName,
            slotLabel: slotLabel,
            bookingStartTime: timeIn,
            bookingEndTime: timeOut,
            bookingDate: date,
            lastUpdated: new Date()
          }, { merge: true });
          console.log('✅ Penalty document created for user:', userId);
        } catch (penaltyError) {
          console.error('❌ Error creating penalty document:', penaltyError);
        }
        
        setToastMessage('✅ Booking created successfully!');
        setToastColor('success');
        setShowToast(true);
        setTimeout(() => {
          history.push('/booking-confirmation', {
            bookingData: { ...bookingData, bookingId: docRef.id }
          });
        }, 1500);
      }
    } catch (error: any) {
      console.error('❌ Booking error:', error);
      setToastMessage('❌ Error: ' + error.message);
      setToastColor('danger');
      setShowToast(true);
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    history.goBack();
  };

  const durationDisplay = getDuration();
  
  const isFormValid = 
    fullName.trim().length >= 2 && 
    validateStudentId(studentId) === '' && 
    validateCarPlate(carPlate) === '' && 
    !errors.time;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar 
          style={{
            "--background": "linear-gradient(135deg, #F97316 0%, #FB923C 100%)"
          }}
        >
          <IonTitle 
            style={{ 
              color: "white",
              fontWeight: "700",
              textAlign: "center"
            }}
          >
            {isEditMode ? 'Edit Booking' : 'Confirm Booking'}
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="app-container">
          <div className="form-container">
            {/* Header */}
            <div className="form-header">
              <div className="form-icon">
                <IonIcon icon={car} style={{ fontSize: "32px", color: "white" }} />
              </div>
              <h1 className="form-title">{isEditMode ? 'Edit Booking' : 'Confirm Booking'}</h1>
              <p className="form-subtitle">
                {isEditMode ? 'Update your parking details' : 'Review and confirm your booking'}
              </p>
            </div>

            {/* Parking Spot Information */}
            <div className="zone-info">
              <div className="zone-title">{zoneName}</div>
              <div className="zone-subtitle">Parking Spot: {slotLabel}</div>
              <div className="zone-details">
                {userType === 'oku' ? '♿ OKU Parking' : '🅿️ Regular Parking'}
              </div>
            </div>

            {/* Personal Information */}
            <div className="input-group">
              <label className="input-label">
                <IonIcon icon={person} />
                Full Name
              </label>
              <div className="input-wrapper">
                <input
                  className={`input-box ${errors.fullName ? 'error-input' : fullName ? 'success-input' : ''}`}
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
                <IonIcon icon={person} className="input-icon" />
              </div>
              {errors.fullName && (
                <div className="error">
                  <IonIcon icon={alertCircle} />
                  {errors.fullName}
                </div>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">
                <IonIcon icon={card} />
                Student ID
              </label>
              <div className="input-wrapper">
                <input
                  className={`input-box ${errors.studentId ? 'error-input' : studentId ? 'success-input' : ''}`}
                  type="text"
                  placeholder="BAI123456"
                  value={studentId}
                  onChange={(e) => handleStudentIdChange(e.target.value)}
                  maxLength={11}
                />
                <IonIcon icon={card} className="input-icon" />
              </div>
              {errors.studentId && (
                <div className="error">
                  <IonIcon icon={alertCircle} />
                  {errors.studentId}
                </div>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">
                <IonIcon icon={car} />
                Car Plate
              </label>
              <div className="input-wrapper">
                <input
                  className={`input-box ${errors.carPlate ? 'error-input' : carPlate ? 'success-input' : ''}`}
                  type="text"
                  placeholder="ABC 1234"
                  value={carPlate}
                  onChange={(e) => handleCarPlateChange(e.target.value)}
                  maxLength={10}
                />
                <IonIcon icon={car} className="input-icon" />
              </div>
              {errors.carPlate && (
                <div className="error">
                  <IonIcon icon={alertCircle} />
                  {errors.carPlate}
                </div>
              )}
            </div>

            {/* Date and Time */}
            <div className="input-group">
              <label className="input-label">
                <IonIcon icon={calendar} />
                Date
              </label>
              <div className="input-wrapper">
                <input
                  className="input-box readonly"
                  type="text"
                  value={date}
                  readOnly
                />
                <IonIcon icon={calendar} className="input-icon" />
              </div>
            </div>

            <div className="time-row">
              <div className="input-group">
                <label className="input-label">Start Time</label>
                <div className="input-wrapper">
                  <input
                    className="input-box readonly"
                    type="text"
                    value={timeIn}
                    readOnly
                  />
                  <IonIcon icon={time} className="input-icon" />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">End Time</label>
                <div className="input-wrapper">
                  <input
                    className="input-box readonly"
                    type="text"
                    value={timeOut}
                    readOnly
                  />
                  <IonIcon icon={time} className="input-icon" />
                </div>
              </div>
            </div>
            
            {errors.time && (
              <div className="error">
                <IonIcon icon={alertCircle} />
                {errors.time}
              </div>
            )}
            
            {durationDisplay && (
              <div className="duration">
                <IonIcon icon={checkmarkCircle} />
                Total Duration: {durationDisplay}
              </div>
            )}

            {/* Parking Type */}
            <div className="input-group">
              <span className="parking-type-label">
                <IonIcon icon={navigate} />
                Parking Type
              </span>
              <div className="parking-buttons">
                <button
                  type="button"
                  className={`parking-btn normal ${parkingType === 'Normal' ? 'selected' : ''} ${userType === 'oku' ? 'readonly' : ''}`}
                  onClick={() => userType !== 'oku' && setParkingType('Normal')}
                  disabled={userType === 'oku'}
                >
                  {userType === 'oku' ? '♿ OKU Only' : 'Normal'}
                </button>
                <button
                  type="button"
                  className={`parking-btn oku ${parkingType === 'OKU' ? 'selected' : ''}`}
                  onClick={() => setParkingType('OKU')}
                >
                  OKU
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button
                type="button"
                className="btn btn-back"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                <IonIcon icon={navigate} />
                Back
              </button>
              <button
                type="button"
                className="btn btn-submit"
                onClick={handleSubmit}
                disabled={isSubmitting || !isFormValid}
              >
                {isSubmitting ? (
                  <>Processing...</>
                ) : isEditMode ? (
                  <>
                    <IonIcon icon={checkmarkCircle} />
                    Update Booking
                  </>
                ) : (
                  <>
                    <IonIcon icon={checkmarkCircle} />
                    Confirm Booking
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

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

export default BookingForm;