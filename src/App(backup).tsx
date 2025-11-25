import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

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

/* Import your pages */
import BookingForm from './pages/BookingForm';
import BookingConfirmation from './pages/BookingConfirmation';
import DeleteConfirmation from './pages/DeleteConfirmation';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        {/* Home page - redirect to booking form */}
        <Route exact path="/">
          <Redirect to="/booking" />
        </Route>
        
        {/* Booking Form - Create new bookings */}
        <Route exact path="/booking" component={BookingForm} />
        
        {/* Booking Confirmation - Show booking details */}
        <Route exact path="/booking-confirmation" component={BookingConfirmation} />
        
        {/* Delete Confirmation - Delete popup page */}
        <Route exact path="/delete-confirmation" component={DeleteConfirmation} />
        
        {/* Catch all - redirect to booking */}
        <Route>
          <Redirect to="/booking" />
        </Route>
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;