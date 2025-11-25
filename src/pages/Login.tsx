import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonInput,
  IonButton,
  IonItem,
  IonLabel,
  IonText,
  IonIcon,
  IonCheckbox,
  IonImg,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
} from "@ionic/react";
import {
  eye,
  eyeOff,
  mailOutline,
  lockClosedOutline
} from "ionicons/icons";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "firebase/auth";

import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

import { useHistory } from "react-router-dom";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const history = useHistory();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        history.push("/home");
      }
    });
    return unsubscribe;
  }, [history]);

  const handleLogin = async () => {
    setMessage("");

    if (!email && !password)
      return setMessage("❌ Please enter both email and password.");
    if (!email)
      return setMessage("❌ Please enter your email.");
    if (!password)
      return setMessage("❌ Please enter your password.");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch Firestore user profile
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setMessage("❌ Account data missing. Please recreate your account.");
        await auth.signOut();
        return;
      }

      setMessage("✅ Login successful! Redirecting...");

      setEmail("");
      setPassword("");

      setTimeout(() => history.push("/home"), 1500);

    } catch (error: any) {
      let errorMessage = "❌ Login failed.";

      if (error.code === "auth/invalid-email")
        errorMessage = "❌ Invalid email format.";
      else if (error.code === "auth/user-not-found")
        errorMessage = "❌ No account found with this email.";
      else if (error.code === "auth/wrong-password")
        errorMessage = "❌ Incorrect password.";
      else if (error.code === "auth/too-many-requests")
        errorMessage = "❌ Too many attempts. Try again later.";

      setMessage(errorMessage);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar
          style={{
            "--background": "linear-gradient(135deg, #F97316, #EA580C)"
          }}
        >
          <IonTitle
            className="ion-text-center"
            style={{ color: "white", fontWeight: "700" }}
          >
            Login
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        className="ion-padding"
        style={{
          "--background": "linear-gradient(180deg, #bc92edff, #ddcfcfff)"
        }}
      >
        {/* HERO */}
        <div className="ion-text-center" style={{ padding: "20px 0" }}>
          <IonImg
            src="raffleslogo.png"
            style={{
              width: "100px",
              height: "100px",
              margin: "0 auto",
              borderRadius: "20px"
            }}
          />

          <IonText>
            <h1
              style={{
                fontWeight: "700",
                fontSize: "24px",
                background: "linear-gradient(135deg, #F97316, #EA580C)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              Welcome Back
            </h1>
          </IonText>

          <IonText color="medium">
            <p>Sign in to your CampusPark account</p>
          </IonText>
        </div>

        <IonCard style={{ borderRadius: "20px" }}>
          <IonCardContent>
            <IonGrid>
              <IonRow>
                <IonCol>

                  {/* EMAIL */}
                  <IonItem>
                    <IonIcon
                      icon={mailOutline}
                      slot="start"
                      style={{ color: "#F97316" }}
                    />
                    <IonLabel position="stacked">RU Email</IonLabel>
                    <IonInput
                      type="email"
                      value={email}
                      placeholder="yourname@raffles-university.edu.my"
                      onIonInput={(e) => setEmail(e.detail.value!)}
                      onKeyPress={handleKeyPress}
                    />
                  </IonItem>

                  {/* PASSWORD */}
                  <IonItem>
                    <IonIcon
                      icon={lockClosedOutline}
                      slot="start"
                      style={{ color: "#F97316" }}
                    />
                    <IonLabel position="stacked">Password</IonLabel>
                    <IonInput
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onIonInput={(e) => setPassword(e.detail.value!)}
                      placeholder="Enter your password"
                      onKeyPress={handleKeyPress}
                    />
                    <IonIcon
                      icon={showPassword ? eyeOff : eye}
                      slot="end"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ cursor: "pointer" }}
                    />
                  </IonItem>

                  {/* REMEMBER ME */}
                  <IonItem lines="none">
                    <IonCheckbox
                      checked={rememberMe}
                      onIonChange={(e) => setRememberMe(e.detail.checked)}
                      slot="start"
                    />
                    <IonLabel>Remember me</IonLabel>
                  </IonItem>

                  <IonButton expand="block" shape="round" onClick={handleLogin}>
                    Login
                  </IonButton>

                  {/* CREATE ACCOUNT LINK */}
                  <IonText>
                    <p className="ion-text-center">
                      Don’t have an account?{" "}
                      <span
                        style={{
                          color: "#F97316",
                          cursor: "pointer",
                          textDecoration: "underline"
                        }}
                        onClick={() => history.push("/createaccount")}
                      >
                        Create Account
                      </span>
                    </p>
                  </IonText>

                  {/* MESSAGE */}
                  {message && (
                    <div
                      style={{
                        marginTop: "16px",
                        padding: "12px",
                        borderRadius: "10px",
                        background: message.startsWith("❌")
                          ? "#dc2626"
                          : "#10b981",
                        color: "white",
                        textAlign: "center"
                      }}
                    >
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

export default Login;
