import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonSpinner,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';

const LogoPage: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const history = useHistory();

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const styles = `
    .splash-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      position: relative;
      overflow: hidden;
    }

    .logo-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      padding: 40px 30px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      max-width: 400px;
      width: 100%;
    }

    .logo-image {
      width: 120px;
      height: 120px;
      margin: 0 auto 20px;
      border-radius: 20px;
      background: linear-gradient(135deg, #FFD700, #F97316);
      padding: 20px;
      box-shadow: 0 8px 25px rgba(249, 115, 22, 0.3);
    }

    .logo-image img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .app-title {
      font-size: 2.5rem;
      font-weight: 800;
      margin: 0 0 10px 0;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .app-subtitle {
      color: #666;
      font-size: 1rem;
      margin-bottom: 30px;
      font-weight: 500;
    }

    .progress-container {
      width: 100%;
      height: 6px;
      background: rgba(102, 126, 234, 0.2);
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 15px;
    }

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .progress-text {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .progress-percent {
      font-size: 0.9rem;
      font-weight: 600;
      color: #667eea;
    }

    .loading-text {
      font-size: 0.9rem;
      color: #666;
      margin: 0;
    }

    .university-brand {
      margin-top: 30px;
      text-align: center;
    }

    .university-name {
      font-size: 1.5rem;
      font-weight: 700;
      color: #FFD700;
      margin: 0 0 5px 0;
    }

    .university-tagline {
      font-size: 0.9rem;
      color: white;
      margin: 0;
      opacity: 0.9;
    }

    .floating-shapes {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .shape {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      animation: float 6s ease-in-out infinite;
    }

    .shape-1 {
      width: 80px;
      height: 80px;
      top: 20%;
      left: 10%;
      animation-delay: 0s;
    }

    .shape-2 {
      width: 120px;
      height: 120px;
      top: 60%;
      right: 10%;
      animation-delay: 2s;
    }

    .shape-3 {
      width: 60px;
      height: 60px;
      bottom: 20%;
      left: 20%;
      animation-delay: 4s;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(180deg); }
    }

    .loading-spinner {
      color: #667eea;
      --color: #667eea;
      margin-top: 10px;
    }
  `;

  // Inject styles
  if (typeof document !== 'undefined') {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = styles;
    document.head.appendChild(styleTag);
  }

  return (
    <IonPage>
      <IonContent>
        <div className="splash-container">
          {/* Floating Background Shapes */}
          <div className="floating-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>

          {/* Main Logo Card */}
          <div className="logo-card">
            {/* Logo */}
            <div className="logo-image">
              <img
                src="/raffleslogo.png"
                alt="Campus Park Logo"
              />
            </div>

            {/* App Title */}
            <h1 className="app-title">Campus Park</h1>
            <p className="app-subtitle">Smart Parking Solution</p>

            {/* Progress Bar */}
            <div className="progress-container">
              <div
                className="progress-bar"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            {/* Progress Text */}
            <div className="progress-text">
              <span className="loading-text">Loading parking system...</span>
              <span className="progress-percent">{progress}%</span>
            </div>

            {/* Loading Spinner */}
            <IonSpinner name="crescent" className="loading-spinner" />
          </div>

          {/* University Branding */}
          <div className="university-brand">
            <p className="university-name">RU</p>
            <p className="university-tagline">Raffles University</p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LogoPage;