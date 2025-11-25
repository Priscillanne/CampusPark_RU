import React, { useState, useEffect } from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { home, person, calendarOutline, locationOutline } from 'ionicons/icons';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebaseConfig';

/* PAGES */
import Tab2 from './pages/Tab2';
import Tab3 from './pages/Tab3';
import Home from './pages/home';
import Login from './pages/Login';
import LogoPage from './pages/LogoPage';
import CreateAccount from './pages/CreateAccount';
import Profile from './pages/Profile';
import ZonePage from './pages/ZonePage';
import ZoneDetail from './pages/ZoneDetail';
import ParkingPage from './pages/ParkingPage';
import BookingForm from './pages/BookingForm';
import BookingConfirmation from './pages/BookingConfirmation';
import DeleteConfirmation from './pages/Deleteconfirmation';
import Sessions from './pages/Sessions';

/* ZONE PAGES */
import zoneA from './pages/zoneA';
import zoneB from './pages/zoneB';
import zoneC from './pages/zoneC';

/* NEW FLOW PAGES */
import UserTypeSelection from './pages/UserTypeSelection';
import DateTimeSelection from './pages/DateTimeSelection';
import ParkingVisualization from './pages/ParkingVisualization';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Dark Mode */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showLogo, setShowLogo] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Show logo for 3 seconds on app start
    const timer = setTimeout(() => {
      setShowLogo(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (showLogo) {
    return (
      <IonApp>
        <LogoPage />
      </IonApp>
    );
  }

  return (
    <IonApp>
      <IonReactRouter>
        {!user ? (
          /* -------------------------------------------
             🔒 LOGIN + AUTH ROUTES
          ------------------------------------------- */
          <IonRouterOutlet>
            <Route exact path="/login">
              <Login />
            </Route>
            <Route exact path="/createaccount">
              <CreateAccount />
            </Route>
            <Route exact path="/">
              <Redirect to="/login" />
            </Route>
          </IonRouterOutlet>
        ) : (
          /* -------------------------------------------
             🔓 AUTHENTICATED ROUTES (TABS)
          ------------------------------------------- */
          <IonTabs>
            <IonRouterOutlet>
              {/* 🏠 HOME TAB */}
              <Route exact path="/home">
                <Home />
              </Route>

              {/* 👤 PROFILE TAB */}
              <Route exact path="/profile">
                <Profile />
              </Route>

              {/* 📍 ZONE TAB */}
              <Route exact path="/zone">
                <ZonePage />
              </Route>

              {/* 🅿️ ZONE DETAIL (standalone page) */}
              <Route exact path="/zone-detail/:zoneId">
                <ZoneDetail />
              </Route>

              {/* 🚗 PARKING PAGE (standalone page) */}
              <Route exact path="/parking-lot/:zoneId">
                <ParkingPage />
              </Route>

              {/* 📋 BOOKING ROUTES */}
              <Route exact path="/booking">
                <BookingForm />
              </Route>
              <Route exact path="/booking-confirmation">
                <BookingConfirmation />
              </Route>
              <Route exact path="/delete-confirmation">
                <DeleteConfirmation />
              </Route>

              {/* 🕒 SESSIONS TAB */}
              <Route exact path="/sessions">
                <Sessions />
              </Route>

              {/* ✅ ZONE ROUTES */}
              <Route exact path="/zoneA">
                <zoneA />
              </Route>
              <Route exact path="/zoneB">
                <zoneB />
              </Route>
              <Route exact path="/zoneC">
                <zoneC />
              </Route>

              {/* 🆕 NEW BOOKING FLOW ROUTES */}
              <Route exact path="/user-type">
                <UserTypeSelection />
              </Route>
              <Route exact path="/date-time">
                <DateTimeSelection />
              </Route>
              <Route exact path="/parking-visualization">
                <ParkingVisualization />
              </Route>

              {/* DEFAULT REDIRECT */}
              <Route exact path="/">
                <Redirect to="/home" />
              </Route>
            </IonRouterOutlet>

            {/* -------------------------------------------
               🚀 BOTTOM TAB BAR
            ------------------------------------------- */}
            <IonTabBar slot="bottom">
              <IonTabButton tab="home" href="/home">
                <IonIcon aria-hidden="true" icon={home} />
                <IonLabel>Home</IonLabel>
              </IonTabButton>

              <IonTabButton tab="zone" href="/zone">
                <IonIcon aria-hidden="true" icon={locationOutline} />
                <IonLabel>Zone</IonLabel>
              </IonTabButton>

              <IonTabButton tab="sessions" href="/sessions">
                <IonIcon aria-hidden="true" icon={calendarOutline} />
                <IonLabel>Sessions</IonLabel>
              </IonTabButton>

              <IonTabButton tab="profile" href="/profile">
                <IonIcon aria-hidden="true" icon={person} />
                <IonLabel>Profile</IonLabel>
              </IonTabButton>
            </IonTabBar>
          </IonTabs>
        )}
      </IonReactRouter>
    </IonApp>
  );
};

export default App;