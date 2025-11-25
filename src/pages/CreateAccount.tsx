import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonButton,
  IonItem,
  IonLabel,
  IonText,
  IonCheckbox,
  IonCard,
  IonCardContent,
  IonImg,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonGrid,
  IonRow,
  IonCol,
} from "@ionic/react";
import {
  eye,
  eyeOff,
  personOutline,
  idCardOutline,
  mailOutline,
  lockClosedOutline,
  carOutline,
  accessibilityOutline,
  arrowBack
} from "ionicons/icons";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { setDoc, doc } from "firebase/firestore";
import { useHistory } from "react-router-dom";

const CreateAccount: React.FC = () => {
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isOKU, setIsOKU] = useState<boolean | null>(null);
  const [okuId, setOkuId] = useState("");

  const history = useHistory();

  // Enhanced Validation
  const validate = (): boolean => {
    if (!fullName.trim()) return setMsg("⚠️ Please enter your full name.");
    if (!/^[a-zA-Z\s]+$/.test(fullName.trim())) return setMsg("⚠️ Name must contain only letters and spaces.");
    if (fullName.trim().length < 2) return setMsg("⚠️ Name must be at least 2 characters long.");
    
    if (!studentId.trim()) return setMsg("⚠️ Student ID is required.");
    if (!/^[a-zA-Z0-9]+$/.test(studentId.trim())) return setMsg("⚠️ Student ID must contain only letters and numbers.");
    
    if (!email.trim()) return setMsg("⚠️ Email is required.");
    if (!email.endsWith("@raffles.university")) return setMsg("⚠️ Email must end with @raffles.university.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setMsg("⚠️ Please enter a valid email address.");
    
    if (password.length < 6) return setMsg("⚠️ Password must be at least 6 characters.");
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) return setMsg("⚠️ Password must contain both letters and numbers.");
    
    if (isOKU === null) return setMsg("⚠️ Please select if you are an OKU cardholder.");
    if (isOKU && !okuId.trim()) return setMsg("⚠️ Please enter your OKU ID.");
    if (isOKU && okuId.trim().length < 3) return setMsg("⚠️ OKU ID must be at least 3 characters.");
    
    if (vehicle && !/^[a-zA-Z0-9\s]+$/.test(vehicle)) return setMsg("⚠️ Vehicle plate must contain only letters, numbers and spaces.");
    
    if (!agree) return setMsg("⚠️ You must agree to the campus parking rules.");
    return true;
  };

  const setMsg = (msg: string) => {
    setMessage(msg);
    return false;
  };

  const handleSignUp = async () => {
    setMessage("");

    if (!validate()) return;

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Save profile to Firestore with UID as doc ID - ADDED profileImage FIELD
      const userData = {
        uid,
        fullName: fullName.trim(),
        studentId: studentId.trim(),
        email: email.trim(),
        carPlate: vehicle.trim(),
        isOKU,
        okuId: okuId.trim(),
        profileImage: "", // ← ADDED THIS FIELD - empty string by default
        phone: "", // ← ADDED THIS FIELD for profile page compatibility
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(doc(db, "users", uid), userData);

      setMessage("✅ Account created successfully! Redirecting...");
      setTimeout(() => history.push("/home"), 2000);
    } catch (error: any) {
      console.error("Signup error:", error);
      if (error.code === 'auth/email-already-in-use') {
        setMessage("❌ This email is already registered. Please use a different email.");
      } else if (error.code === 'auth/invalid-email') {
        setMessage("❌ Invalid email format.");
      } else if (error.code === 'auth/weak-password') {
        setMessage("❌ Password is too weak. Please use a stronger password.");
      } else {
        setMessage("❌ " + error.message);
      }
    }
  };

  const handleOKUSelection = (value: string) => {
    if (value === "yes") setIsOKU(true);
    else if (value === "no") {
      setIsOKU(false);
      setOkuId("");
    } else setIsOKU(null);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{
          "--background": "linear-gradient(135deg, #F97316, #EA580C)"
        }}>
          <IonButton fill="clear" slot="start" onClick={() => history.push("/login")} style={{ color: "white" }}>
            <IonIcon icon={arrowBack} />
          </IonButton>
          <IonTitle style={{ color: "white", fontWeight: "700" }}>Create Account</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{
        "--background": "linear-gradient(180deg, #bc92edff, #ddcfcfff)"
      }}>
        {/* Hero Section */}
        <div className="ion-text-center" style={{ padding: "20px 0" }}>
          <IonImg
            src="raffleslogo.png"
            style={{ width: "100px", height: "100px", margin: "0 auto", borderRadius: "20px" }}
          />
          <IonText>
            <h1 style={{
              fontWeight: "700",
              fontSize: "24px",
              background: "linear-gradient(135deg, #F97316, #EA580C)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>
              Join Raffles University
            </h1>
          </IonText>
          <IonText color="medium">
            <p>Create your parking management account</p>
          </IonText>
        </div>

        <IonCard style={{ borderRadius: "20px" }}>
          <IonCardContent>
            <IonGrid>
              <IonRow>
                <IonCol>

                  {/* Full Name */}
                  <IonItem>
                    <IonIcon icon={personOutline} slot="start" style={{ color: "#F97316" }} />
                    <IonLabel position="stacked">Full Name *</IonLabel>
                    <IonInput 
                      value={fullName} 
                      onIonInput={e => setFullName(e.detail.value!)} 
                      placeholder="Enter your full name"
                    />
                  </IonItem>

                  {/* Student ID */}
                  <IonItem>
                    <IonIcon icon={idCardOutline} slot="start" style={{ color: "#F97316" }} />
                    <IonLabel position="stacked">Student ID *</IonLabel>
                    <IonInput 
                      value={studentId} 
                      onIonInput={e => setStudentId(e.detail.value!)} 
                      placeholder="e.g., RU12345"
                    />
                  </IonItem>

                  {/* Email */}
                  <IonItem>
                    <IonIcon icon={mailOutline} slot="start" style={{ color: "#F97316" }} />
                    <IonLabel position="stacked">RU Email *</IonLabel>
                    <IonInput 
                      value={email} 
                      type="email" 
                      onIonInput={e => setEmail(e.detail.value!)} 
                      placeholder="name@raffles.university"
                    />
                  </IonItem>

                  {/* Password */}
                  <IonItem>
                    <IonIcon icon={lockClosedOutline} slot="start" style={{ color: "#F97316" }} />
                    <IonLabel position="stacked">Password *</IonLabel>
                    <IonInput
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onIonInput={(e) => setPassword(e.detail.value!)}
                      placeholder="At least 6 characters with letters & numbers"
                    />
                    <IonIcon
                      icon={showPassword ? eyeOff : eye}
                      slot="end"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ cursor: "pointer" }}
                    />
                  </IonItem>

                  {/* OKU Selection */}
                  <IonItem>
                    <IonIcon icon={accessibilityOutline} slot="start" style={{ color: "#F97316" }} />
                    <IonLabel position="stacked">Are you an OKU cardholder? *</IonLabel>
                    <IonSelect 
                      value={isOKU ? "yes" : isOKU === false ? "no" : ""} 
                      onIonChange={e => handleOKUSelection(e.detail.value)}
                      placeholder="Select option"
                    >
                      <IonSelectOption value="yes">Yes</IonSelectOption>
                      <IonSelectOption value="no">No</IonSelectOption>
                    </IonSelect>
                  </IonItem>

                  {isOKU && (
                    <IonItem>
                      <IonIcon icon={accessibilityOutline} slot="start" style={{ color: "#F97316" }} />
                      <IonLabel position="stacked">OKU ID *</IonLabel>
                      <IonInput 
                        value={okuId} 
                        onIonInput={(e) => setOkuId(e.detail.value!)} 
                        placeholder="Enter your OKU ID"
                      />
                    </IonItem>
                  )}

                  {/* Vehicle */}
                  <IonItem>
                    <IonIcon icon={carOutline} slot="start" style={{ color: "#F97316" }} />
                    <IonLabel position="stacked">Vehicle Plate (optional)</IonLabel>
                    <IonInput 
                      value={vehicle} 
                      onIonInput={(e) => setVehicle(e.detail.value!)} 
                      placeholder="e.g., ABC 1234"
                    />
                  </IonItem>

                  {/* Agreement */}
                  <IonItem lines="none">
                    <IonCheckbox checked={agree} onIonChange={(e) => setAgree(e.detail.checked)} slot="start" />
                    <IonLabel style={{ fontSize: "14px" }}>
                      I agree to the campus parking guidelines and terms of service
                    </IonLabel>
                  </IonItem>

                  {/* Button */}
                  <IonButton 
                    expand="block" 
                    shape="round" 
                    onClick={handleSignUp}
                    style={{ marginTop: "20px" }}
                  >
                    Create Account
                  </IonButton>

                  {/* Message */}
                  {message && (
                    <div style={{ 
                      marginTop: "16px", 
                      padding: "10px",
                      borderRadius: "8px",
                      textAlign: "center",
                      fontWeight: "bold",
                      backgroundColor: message.includes("✅") ? "#d4edda" : "#f8d7da",
                      color: message.includes("✅") ? "#155724" : "#721c24",
                      border: `1px solid ${message.includes("✅") ? "#c3e6cb" : "#f5c6cb"}`
                    }}>
                      {message}
                    </div>
                  )}

                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>

      </IonContent>
    </IonPage>
  );
};

export default CreateAccount;