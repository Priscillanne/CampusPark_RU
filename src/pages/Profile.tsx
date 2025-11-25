import React, { useState, useRef, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonCard,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonAvatar,
  IonIcon,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonToast,
  IonLoading,
  IonActionSheet,
  IonAlert,
  IonText
} from '@ionic/react';
import { camera, save, close, person, images, logOut, mail, call, card, car } from 'ionicons/icons';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { useHistory } from 'react-router-dom';

interface ProfileData {
  name: string;
  email: string;
  studentId: string;
  phone: string;
  carPlate: string;
  profileImage?: string;
}

// Check if Capacitor Camera is available
let Camera: any = null;
let CameraResultType: any = null;
let CameraSource: any = null;

try {
  const cameraModule = require('@capacitor/camera');
  Camera = cameraModule.Camera;
  CameraResultType = cameraModule.CameraResultType;
  CameraSource = cameraModule.CameraSource;
  console.log('✅ Camera module loaded successfully');
} catch (error) {
  console.log('⚠️ Camera module not available, using fallback');
}

const ProfilePage: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const history = useHistory();
  
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    studentId: '',
    phone: '',
    carPlate: '',
    profileImage: ''
  });

  const [originalProfile, setOriginalProfile] = useState<ProfileData>({
    name: '',
    email: '',
    studentId: '',
    phone: '',
    carPlate: '',
    profileImage: ''
  });

  // Image compression function
  const compressImage = (dataUrl: string, maxWidth: number = 500, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Add better image quality
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = dataUrl;
    });
  };

  // LOGOUT FUNCTION
  const handleLogout = async () => {
    try {
      await auth.signOut();
      setToastMessage('✅ Logged out successfully!');
      setToastColor('success');
      setShowToast(true);
      setTimeout(() => history.push('/login'), 1500);
    } catch (error: any) {
      setToastMessage('Failed to logout: ' + (error.message || 'Unknown error'));
      setToastColor('danger');
      setShowToast(true);
    }
  };

  // Create user document if it doesn't exist
  const createUserDocumentIfMissing = async (currentUser: any) => {
    if (!currentUser) return false;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          fullName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
          email: currentUser.email || '',
          studentId: 'Not set',
          phone: 'Not set',
          carPlate: 'Not set',
          profileImage: '',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        return true;
      }
      return true;
    } catch (error) {
      console.error('Failed to create user document:', error);
      return false;
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setToastMessage('Please log in to view profile');
        setToastColor('danger');
        setShowToast(true);
        setLoading(false);
        return;
      }

      const documentReady = await createUserDocumentIfMissing(currentUser);
      
      if (documentReady) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const profileData: ProfileData = {
            name: userData.fullName || currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
            email: currentUser.email || '',
            studentId: userData.studentId || 'Not set',
            phone: userData.phone || 'Not set',
            carPlate: userData.carPlate || 'Not set',
            profileImage: userData.profileImage || ''
          };

          setProfile(profileData);
          setOriginalProfile(profileData);
        }
      }
    } catch (error) {
      setToastMessage('Failed to load profile');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  // CAMERA API FUNCTIONS
  const takePhotoNative = async () => {
    if (!Camera) {
      fileInputRef.current?.click();
      return;
    }

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image && image.dataUrl) {
        await handleImageUpload(image.dataUrl);
      }
    } catch (error: any) {
      if (!error.message?.includes('canceled')) {
        setToastMessage('Failed to take photo');
        setToastColor('danger');
        setShowToast(true);
      }
    }
  };

  const chooseFromGalleryNative = async () => {
    if (!Camera) {
      fileInputRef.current?.click();
      return;
    }

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });

      if (image && image.dataUrl) {
        await handleImageUpload(image.dataUrl);
      }
    } catch (error: any) {
      if (!error.message?.includes('canceled')) {
        setToastMessage('Failed to choose photo');
        setToastColor('danger');
        setShowToast(true);
      }
    }
  };

  // UPDATED: WORKING IMAGE UPLOAD with better error handling
  const handleImageUpload = async (dataUrl: string) => {
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      setToastMessage('Invalid image format');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    try {
      setUploadingImage(true);
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No user logged in');

      console.log('🔄 Uploading profile picture...');

      // Compress image to reduce size (higher quality for better display)
      const compressedDataUrl = await compressImage(dataUrl, 500, 0.8);

      // First, ensure user document exists
      await createUserDocumentIfMissing(currentUser);

      // Store base64 image directly in Firestore
      await updateDoc(doc(db, 'users', currentUser.uid), {
        profileImage: compressedDataUrl,
        updatedAt: new Date()
      });

      // Update local state
      setProfile(prev => ({ ...prev, profileImage: compressedDataUrl }));
      
      setToastMessage('✅ Profile photo updated!');
      setToastColor('success');
      setShowToast(true);

    } catch (error: any) {
      console.error('Upload error:', error);
      
      if (error.code === 'permission-denied') {
        setToastMessage('Permission denied - Please check Firestore security rules');
        setToastColor('danger');
        setShowToast(true);
      } else {
        setToastMessage('Failed to upload photo: ' + (error.message || 'Unknown error'));
        setToastColor('danger');
        setShowToast(true);
      }
    } finally {
      setUploadingImage(false);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setToastMessage('Please select an image file');
        setToastColor('danger');
        setShowToast(true);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          handleImageUpload(dataUrl);
        }
      };
      reader.onerror = () => {
        setToastMessage('Failed to read file');
        setToastColor('danger');
        setShowToast(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const showPhotoOptions = () => {
    if (uploadingImage) {
      setToastMessage('Please wait, image upload in progress');
      setToastColor('danger');
      setShowToast(true);
      return;
    }
    
    if (Camera) {
      setShowActionSheet(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No user logged in');

      if (!profile.name.trim()) {
        setToastMessage('Name is required');
        setToastColor('danger');
        setShowToast(true);
        return;
      }

      await updateDoc(doc(db, 'users', currentUser.uid), {
        fullName: profile.name.trim(),
        studentId: profile.studentId.trim(),
        phone: profile.phone.trim(),
        carPlate: profile.carPlate.trim(),
        updatedAt: new Date()
      });

      setOriginalProfile(profile);
      setIsEditing(false);
      
      setToastMessage('✅ Profile updated successfully!');
      setToastColor('success');
      setShowToast(true);
      
    } catch (error: any) {
      setToastMessage('Failed to save profile: ' + (error.message || 'Unknown error'));
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setProfile(originalProfile);
    setIsEditing(false);
    setToastMessage('Changes cancelled');
    setToastColor('danger');
    setShowToast(true);
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar style={{ '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" style={{ '--color': 'white' }} />
            </IonButtons>
            <IonTitle style={{ '--color': 'white', fontWeight: 'bold' }}>Profile</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonLoading isOpen={loading} message="Loading your profile..." />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" style={{ '--color': 'white' }} />
          </IonButtons>
          <IonTitle style={{ '--color': 'white', fontWeight: 'bold' }}>My Profile</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={() => setShowLogoutAlert(true)} style={{ '--color': 'white' }}>
              <IonIcon icon={logOut} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        {/* Header Section */}
        <div className="profile-header">
          <div className="header-background"></div>
          <div className="profile-image-section">
            <div className="avatar-container" onClick={showPhotoOptions}>
              <IonAvatar className="profile-avatar">
                {profile.profileImage ? (
                  <img src={profile.profileImage} alt="Profile" className="profile-image" />
                ) : (
                  <div className="default-avatar">
                    <IonIcon icon={person} className="avatar-icon" />
                  </div>
                )}
                {uploadingImage && (
                  <div className="uploading-overlay">
                    <div className="spinner"></div>
                    <span>Uploading...</span>
                  </div>
                )}
              </IonAvatar>
              <div className="camera-badge">
                <IonIcon icon={camera} />
              </div>
            </div>
            
            <IonText color="light">
              <h2 className="user-name">{profile.name}</h2>
              <p className="user-email">{profile.email}</p>
            </IonText>

            <IonButton 
              className="change-photo-btn"
              onClick={showPhotoOptions}
              disabled={uploadingImage}
              fill="outline"
              color="light"
            >
              <IonIcon icon={camera} slot="start" />
              {uploadingImage ? 'Uploading...' : 'Change Photo'}
            </IonButton>
            
            <input
              type="file"
              ref={fileInputRef}
              className="file-input"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Profile Information Card */}
        <div className="content-container">
          <IonCard className="profile-card">
            <div className="card-header">
              <IonText color="primary">
                <h3>Personal Information</h3>
              </IonText>
              <p>Manage your account details</p>
            </div>

            <div className="profile-fields">
              {/* Name Field */}
              <div className="profile-field">
                <div className="field-header">
                  <IonIcon icon={person} className="field-icon" />
                  <IonLabel className="field-label">Full Name</IonLabel>
                </div>
                {isEditing ? (
                  <IonInput
                    className="profile-input"
                    value={profile.name}
                    onIonInput={(e) => setProfile({...profile, name: e.detail.value!})}
                    placeholder="Enter your full name"
                  />
                ) : (
                  <div className="field-value">{profile.name}</div>
                )}
              </div>

              {/* Email Field */}
              <div className="profile-field">
                <div className="field-header">
                  <IonIcon icon={mail} className="field-icon" />
                  <IonLabel className="field-label">Email Address</IonLabel>
                </div>
                <div className="field-value email-value">
                  {profile.email}
                  <span className="read-only-badge">Read Only</span>
                </div>
              </div>

              {/* Student ID Field */}
              <div className="profile-field">
                <div className="field-header">
                  <IonIcon icon={card} className="field-icon" />
                  <IonLabel className="field-label">Student ID</IonLabel>
                </div>
                {isEditing ? (
                  <IonInput
                    className="profile-input"
                    value={profile.studentId}
                    onIonInput={(e) => setProfile({...profile, studentId: e.detail.value!})}
                    placeholder="Enter your student ID"
                  />
                ) : (
                  <div className="field-value">{profile.studentId}</div>
                )}
              </div>

              {/* Phone Field */}
              <div className="profile-field">
                <div className="field-header">
                  <IonIcon icon={call} className="field-icon" />
                  <IonLabel className="field-label">Phone Number</IonLabel>
                </div>
                {isEditing ? (
                  <IonInput
                    className="profile-input"
                    value={profile.phone}
                    onIonInput={(e) => setProfile({...profile, phone: e.detail.value!})}
                    type="tel"
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <div className="field-value">{profile.phone}</div>
                )}
              </div>

              {/* Car Plate Field */}
              <div className="profile-field">
                <div className="field-header">
                  <IonIcon icon={car} className="field-icon" />
                  <IonLabel className="field-label">Car Plate</IonLabel>
                </div>
                {isEditing ? (
                  <IonInput
                    className="profile-input"
                    value={profile.carPlate}
                    onIonInput={(e) => setProfile({...profile, carPlate: e.detail.value!})}
                    placeholder="Enter your car plate"
                  />
                ) : (
                  <div className="field-value">{profile.carPlate}</div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              {!isEditing ? (
                <>
                  <IonButton 
                    className="edit-btn"
                    expand="block"
                    onClick={handleEditClick}
                    disabled={uploadingImage}
                  >
                    <IonIcon icon={save} slot="start" />
                    Edit Profile
                  </IonButton>
                  
                  <IonButton 
                    className="logout-btn"
                    expand="block"
                    fill="outline"
                    onClick={() => setShowLogoutAlert(true)}
                  >
                    <IonIcon icon={logOut} slot="start" />
                    Logout
                  </IonButton>
                </>
              ) : (
                <div className="save-cancel-buttons">
                  <IonButton 
                    className="cancel-btn"
                    expand="block"
                    fill="outline"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    <IonIcon icon={close} slot="start" />
                    Cancel
                  </IonButton>
                  <IonButton 
                    className="save-btn"
                    expand="block"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <IonIcon icon={save} slot="start" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </IonButton>
                </div>
              )}
            </div>
          </IonCard>
        </div>

        {/* Camera Action Sheet */}
        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          buttons={[
            {
              text: 'Take Photo',
              icon: camera,
              handler: takePhotoNative
            },
            {
              text: 'Choose from Gallery',
              icon: images,
              handler: chooseFromGalleryNative
            },
            {
              text: 'Cancel',
              icon: close,
              role: 'cancel'
            }
          ]}
        />

        {/* Logout Confirmation Alert */}
        <IonAlert
          isOpen={showLogoutAlert}
          onDidDismiss={() => setShowLogoutAlert(false)}
          header={'Confirm Logout'}
          message={'Are you sure you want to logout?'}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              cssClass: 'secondary'
            },
            {
              text: 'Logout',
              role: 'confirm',
              cssClass: 'danger',
              handler: handleLogout
            }
          ]}
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
          style={{ '--width': 'fit-content' }}
        />

        <IonLoading isOpen={uploadingImage} message="Uploading profile photo..." />
        <IonLoading isOpen={saving} message="Saving profile..." />

        <style>{`
          .profile-header {
            position: relative;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px 20px 100px 20px;
            border-radius: 0 0 30px 30px;
            margin-bottom: 80px;
          }

          .header-background {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%);
            border-radius: 0 0 30px 30px;
          }

          .profile-image-section {
            position: relative;
            z-index: 2;
            text-align: center;
            margin-top: 20px;
          }

          .avatar-container {
            position: relative;
            display: inline-block;
            cursor: pointer;
            transition: transform 0.3s ease;
          }

          .avatar-container:hover {
            transform: scale(1.05);
          }

          .profile-avatar {
            width: 150px !important;
            height: 150px !important;
            margin: 0 auto;
            border: 4px solid white;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            transition: all 0.3s ease;
          }

          .profile-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .default-avatar {
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
          }

          .avatar-icon {
            font-size: 4rem;
            color: white;
          }

          .camera-badge {
            position: absolute;
            bottom: 10px;
            right: 10px;
            background: #4CAF50;
            color: white;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid white;
            box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
          }

          .uploading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            font-size: 0.8rem;
          }

          .spinner {
            width: 30px;
            height: 30px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top: 3px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 8px;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .user-name {
            margin: 20px 0 5px 0;
            font-size: 1.5rem;
            font-weight: bold;
            color: white;
          }

          .user-email {
            margin: 0 0 20px 0;
            color: rgba(255, 255, 255, 0.8);
            font-size: 1rem;
          }

          .change-photo-btn {
            --border-radius: 20px;
            --padding-start: 20px;
            --padding-end: 20px;
            margin-top: 10px;
          }

          .content-container {
            padding: 0 20px 40px 20px;
          }

          .profile-card {
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            margin-top: -60px;
            position: relative;
            z-index: 3;
          }

          .card-header {
            padding: 25px 25px 15px 25px;
            border-bottom: 1px solid #f0f0f0;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          }

          .card-header h3 {
            margin: 0 0 5px 0;
            font-size: 1.3rem;
            font-weight: 600;
          }

          .card-header p {
            margin: 0;
            color: #6c757d;
            font-size: 0.9rem;
          }

          .profile-fields {
            padding: 20px 25px;
          }

          .profile-field {
            margin-bottom: 25px;
            padding: 15px;
            border-radius: 12px;
            background: #f8f9fa;
            transition: all 0.3s ease;
            border: 1px solid #e9ecef;
          }

          .profile-field:hover {
            background: #ffffff;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
            transform: translateY(-2px);
          }

          .field-header {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
          }

          .field-icon {
            font-size: 1.2rem;
            color: #667eea;
            margin-right: 10px;
          }

          .field-label {
            font-weight: 600;
            color: #495057;
            font-size: 0.9rem;
          }

          .field-value {
            font-size: 1.1rem;
            color: #212529;
            font-weight: 500;
            padding: 8px 0;
          }

          .email-value {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .read-only-badge {
            background: #6c757d;
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.7rem;
            font-weight: 500;
          }

          .profile-input {
            --padding-start: 12px;
            --padding-end: 12px;
            --background: white;
            border-radius: 8px;
            border: 1px solid #dee2e6;
          }

          .action-buttons {
            padding: 20px 25px;
            border-top: 1px solid #f0f0f0;
            background: #f8f9fa;
          }

          .edit-btn {
            --border-radius: 12px;
            --padding-top: 15px;
            --padding-bottom: 15px;
            --background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin-bottom: 12px;
          }

          .logout-btn {
            --border-radius: 12px;
            --padding-top: 15px;
            --padding-bottom: 15px;
            --color: #dc3545;
            --border-color: #dc3545;
          }

          .save-cancel-buttons {
            display: flex;
            gap: 12px;
          }

          .cancel-btn {
            --border-radius: 12px;
            --padding-top: 15px;
            --padding-bottom: 15px;
            flex: 1;
            --color: #6c757d;
            --border-color: #6c757d;
          }

          .save-btn {
            --border-radius: 12px;
            --padding-top: 15px;
            --padding-bottom: 15px;
            flex: 1;
            --background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          }

          .file-input {
            display: none;
          }
        `}</style>
      </IonContent>
    </IonPage>
  );
};

export default ProfilePage;