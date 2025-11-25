import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonContent,
  IonButton,
  IonText,
  IonCard,
  IonCardContent,
  IonIcon,
  IonAlert,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
} from "@ionic/react";
import {
  car,
  timeOutline,
  warningOutline,
  checkmarkCircleOutline,
  cardOutline,
  locationOutline,
  receiptOutline,
  speedometerOutline,
  shieldCheckmarkOutline
} from "ionicons/icons";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

const Home: React.FC = () => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [hasCompletedBooking, setHasCompletedBooking] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [showPenaltyAlert, setShowPenaltyAlert] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [penaltyAmount, setPenaltyAmount] = useState(0);
  const [overtimeMinutes, setOvertimeMinutes] = useState(0);
  const [isInOvertime, setIsInOvertime] = useState(false);
  const [carRemoved, setCarRemoved] = useState(false);
  const [bookingEndTime, setBookingEndTime] = useState<Date | null>(null);
  const [alertShown, setAlertShown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentBooking, setCurrentBooking] = useState<any>(null);
  const [userId, setUserId] = useState<string>("");

  /* ----------------------------------------
   * 🔥 GET CURRENT USER
   * --------------------------------------*/
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUserId(currentUser.uid);
      loadUserData(currentUser.uid);
    } else {
      setLoading(false);
    }
  }, []);

  /* ----------------------------------------
   * 🔥 LOAD REAL BOOKING DATA
   * --------------------------------------*/
  const loadUserData = async (userId: string) => {
    try {
      setLoading(true);

      // 1. Load penalty payment status
      const paymentRef = doc(db, "penaltyPayments", userId);
      const paymentSnap = await getDoc(paymentRef);

      if (paymentSnap.exists()) {
        const paymentData = paymentSnap.data();
        setIsPaid(paymentData.isPaid || false);
        setHasCompletedBooking(paymentData.hasCompletedBooking || false);
        setCarRemoved(paymentData.carRemoved || false);
        setPenaltyAmount(paymentData.penaltyAmount || 0);

        // If already paid and completed, stop here - SHOW NO PARKING
        if (paymentData.isPaid && paymentData.hasCompletedBooking) {
          setIsSessionActive(false);
          setLoading(false);
          return;
        }
      }

      // 2. Load ACTIVE booking from parkingBookings
      const bookingsRef = collection(db, "parkingBookings");
      const activeBookingQuery = query(
        bookingsRef,
        where("userId", "==", userId),
        where("status", "in", ["booked", "confirmed", "active"])
      );

      const activeBookingSnapshot = await getDocs(activeBookingQuery);

      if (!activeBookingSnapshot.empty) {
        const bookingDoc = activeBookingSnapshot.docs[0];
        const bookingData = {
          id: bookingDoc.id,
          ...bookingDoc.data(),
        };

        console.log("🎯 ACTIVE BOOKING FOUND:", bookingData);
        setCurrentBooking(bookingData);
        setIsSessionActive(true);
        setHasCompletedBooking(false);

        // 🕒 SET REAL BOOKING TIMES
        const today = new Date().toISOString().split("T")[0];
        const bookingDate = (bookingData as any).date || today;

        const realEndTime = new Date(
          `${bookingDate}T${(bookingData as any).timeOut}:00`
        );

        console.log("📅 REAL END TIME:", realEndTime);
        setBookingEndTime(realEndTime);

        // Calculate initial remaining time
        const now = new Date();
        const diffMs = realEndTime.getTime() - now.getTime();
        const remainingMins = Math.max(0, Math.floor(diffMs / (1000 * 60)));
        setRemainingTime(remainingMins);
      } else {
        console.log("❌ NO ACTIVE BOOKINGS FOUND");
        setIsSessionActive(false);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------------
   * 🔥 FIREBASE: Save payment status
   * --------------------------------------*/
  const savePaymentStatus = async (updates: any) => {
    try {
      const paymentRef = doc(db, "penaltyPayments", userId);
      await setDoc(
        paymentRef,
        {
          userId,
          ...updates,
          lastUpdated: new Date(),
        },
        { merge: true }
      );
      console.log("✅ Firebase updated:", updates);
    } catch (error) {
      console.error("Error saving payment status:", error);
    }
  };

  /* ----------------------------------------
   * ⏰ REAL TIMER based on ACTUAL booking times
   * --------------------------------------*/
  useEffect(() => {
    if (!bookingEndTime || carRemoved || !isSessionActive || isPaid) return;

    const interval = setInterval(() => {
      const now = new Date();

      if (now >= bookingEndTime) {
        // ⚠️ TIME'S UP - START PENALTY
        if (!isInOvertime && !alertShown) {
          console.log("🚨 TIME EXPIRED - STARTING PENALTY");
          setIsInOvertime(true);
          setShowPenaltyAlert(true);
          setAlertShown(true);
        }

        // Calculate REAL overtime
        const overtimeMins = Math.floor(
          (now.getTime() - bookingEndTime.getTime()) / (1000 * 60)
        );
        setOvertimeMinutes(overtimeMins);

        // Calculate penalty (RM10 every 5 minutes)
        const penalty = Math.floor(overtimeMins / 5) * 10;
        setPenaltyAmount(penalty);

        savePaymentStatus({
          isInOvertime: true,
          penaltyAmount: penalty,
          overtimeMinutes: overtimeMins,
        });
      } else {
        // ⏳ STILL IN BOOKING TIME - REAL COUNTDOWN
        const remainingMins = Math.floor(
          (bookingEndTime.getTime() - now.getTime()) / (1000 * 60)
        );
        setRemainingTime(remainingMins);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [bookingEndTime, carRemoved, isSessionActive, isInOvertime, isPaid, alertShown]);

  /* ----------------------------------------
   * 🚗 USER CLICKS "I'VE REMOVED CAR"
   * --------------------------------------*/
  const handleCarRemoved = async () => {
    setCarRemoved(true);

    // Update booking status in parkingBookings
    if (currentBooking && currentBooking.id) {
      try {
        const bookingRef = doc(db, "parkingBookings", currentBooking.id);
        await setDoc(
          bookingRef,
          {
            status: "completed",
            hasRemovedCar: true,
            carRemovedAt: new Date(),
            finalPenalty: penaltyAmount,
          },
          { merge: true }
        );
      } catch (error) {
        console.log("Error updating booking:", error);
      }
    }

    // Save to penalty payments
    await savePaymentStatus({
      carRemoved: true,
      carRemovedAt: new Date(),
      penaltyAmount: penaltyAmount,
    });

    // Show payment modal if penalty exists
    if (penaltyAmount > 0) {
      setShowPaymentModal(true);
    } else {
      // No penalty - complete immediately
      await handlePaymentComplete();
    }
  };

  /* ----------------------------------------
   * ✅ PAYMENT COMPLETE
   * --------------------------------------*/
  const handlePaymentComplete = async () => {
    console.log("💰 PAYMENT COMPLETED - Updating Firebase...");

    // 1. Update Firebase with payment status
    await savePaymentStatus({
      isPaid: true,
      hasCompletedBooking: true,
      isSessionActive: false,
      isInOvertime: false,
      paymentCompletedAt: new Date(),
      finalAmount: penaltyAmount,
    });

    // 2. Update UI state
    setIsPaid(true);
    setHasCompletedBooking(true);
    setIsSessionActive(false);
    setIsInOvertime(false);
    setShowPaymentModal(false);

    console.log("✅ Payment completed - Now showing 'No Parking'");
  };

  /* ----------------------------------------
   * 🆕 NEW BOOKING
   * --------------------------------------*/
  const handleNewBooking = () => {
    window.location.href = "/zone";
  };

  /* ----------------------------------------
   * LOADING STATE
   * --------------------------------------*/
  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>CampusPark RU</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100vh",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <IonIcon icon={car} style={{ fontSize: "2.5rem", color: "#3B82F6" }} />
            <IonText>Loading your parking session...</IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  /* ----------------------------------------
   * MAIN RENDER
   * --------------------------------------*/
  return (
    <IonPage>
      {/* App Header */}
      <IonHeader>
        <IonToolbar
          style={{
            "--background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            "--border-width": "0",
          }}
        >
          <IonTitle>
            <span style={{ fontWeight: 800, color: "white", fontSize: "1.2rem" }}>
              CampusPark RU
            </span>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        style={{
          "--background": "linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)",
        }}
      >
        <div style={{ padding: "16px" }}>
          {/* HERO SECTION - KEEPING YOUR ORIGINAL DESIGN */}
          <IonCard
            style={{
              borderRadius: 20,
              boxShadow: "0 10px 30px rgba(37, 99, 235, 0.18)",
              background:
                "radial-gradient(circle at top left, #DBEAFE 0%, #EFF6FF 35%, #FFFFFF 85%)",
              marginBottom: 20,
            }}
          >
            <IonCardContent style={{ padding: "20px 18px 18px 18px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    background:
                      "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 6px 12px rgba(59,130,246,0.4)",
                  }}
                >
                  <IonIcon icon={car} style={{ color: "white", fontSize: "1.4rem" }} />
                </div>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.9rem",
                      color: "#6B7280",
                      fontWeight: 500,
                    }}
                  >
                    Welcome back to
                  </p>
                  <h1
                    style={{
                      margin: 0,
                      fontSize: "1.35rem",
                      fontWeight: 800,
                      color: "#111827",
                    }}
                  >
                    CampusPark RU
                  </h1>
                </div>
              </div>

              <p
                style={{
                  margin: "6px 0 12px 0",
                  fontSize: "0.9rem",
                  color: "#4B5563",
                }}
              >
                Manage your parking session, check penalties, and book a new spot
                easily.
              </p>

              {/* Little 3D-ish animated car track */}
              <div
                style={{
                  position: "relative",
                  marginTop: 10,
                  background: "#EEF2FF",
                  borderRadius: 999,
                  padding: "12px 16px",
                  overflow: "hidden",
                  border: "1px solid #E0ECFF",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "radial-gradient(circle at 0% 0%, rgba(59,130,246,0.25), transparent 60%)",
                    opacity: 0.9,
                  }}
                />

                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    zIndex: 1,
                  }}
                >
                  {/* Road line */}
                  <div
                    style={{
                      position: "absolute",
                      left: 10,
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      height: 2,
                      background:
                        "repeating-linear-gradient(90deg, #BFDBFE 0, #BFDBFE 10px, transparent 10px, transparent 18px)",
                      opacity: 0.8,
                    }}
                  />

                  {/* Floating car */}
                  <div
                    className="floating-car"
                    style={{
                      position: "relative",
                      width: 54,
                      height: 30,
                      borderRadius: 16,
                      background:
                        "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
                      boxShadow: "0 8px 16px rgba(37,99,235,0.45)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "1.2rem",
                    }}
                  >
                    🚗
                  </div>

                  <div
                    style={{
                      marginLeft: "auto",
                      textAlign: "right",
                      fontSize: "0.8rem",
                    }}
                  >
                    <div style={{ color: "#1D4ED8", fontWeight: 700 }}>
                      Smart Parking Assistant
                    </div>
                    <div style={{ color: "#4B5563" }}>
                      Track time, avoid penalties.
                    </div>
                  </div>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          {/* COMPLETED BOOKING CARD - REDESIGNED */}
          {hasCompletedBooking && isPaid && (
            <IonCard
              style={{
                marginBottom: "20px",
                background: "linear-gradient(135deg, #ECFDF3 0%, #DCFCE7 100%)",
                border: "2px solid #4ADE80",
                borderRadius: "20px",
                boxShadow: "0 8px 25px rgba(16, 185, 129, 0.15)",
                overflow: "hidden"
              }}
            >
              <div style={{
                height: "6px",
                background: "linear-gradient(90deg, #10B981 0%, #059669 100%)",
                width: "100%"
              }}></div>
              <IonCardContent style={{ 
                textAlign: "center", 
                padding: "30px 20px",
                position: "relative"
              }}>
                <div style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  background: "rgba(16, 185, 129, 0.1)",
                  borderRadius: "50%",
                  padding: "8px"
                }}>
                  <IonIcon
                    icon={shieldCheckmarkOutline}
                    style={{
                      fontSize: "1.5rem",
                      color: "#059669",
                    }}
                  />
                </div>
                <div style={{
                  background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                  width: "70px",
                  height: "70px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)"
                }}>
                  <IonIcon
                    icon={checkmarkCircleOutline}
                    style={{
                      fontSize: "2.2rem",
                      color: "white",
                    }}
                  />
                </div>
                <h2 style={{ 
                  margin: "0 0 8px 0", 
                  color: "#065F46",
                  fontSize: "1.4rem",
                  fontWeight: "700"
                }}>
                  Payment Completed! 🎉
                </h2>
                <p style={{ 
                  color: "#047857", 
                  margin: "0 0 20px 0",
                  fontSize: "0.95rem",
                  lineHeight: "1.4"
                }}>
                  {penaltyAmount > 0
                    ? `Payment of RM ${penaltyAmount}.00 received successfully. Thank you for using CampusPark!`
                    : "No penalties applied. Thank you for parking with us!"}
                </p>
                <IonButton 
                  onClick={handleNewBooking} 
                  color="primary" 
                  size="large"
                  style={{
                    '--background': 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                    '--border-radius': '12px',
                    '--padding-top': '16px',
                    '--padding-bottom': '16px',
                    fontWeight: '600',
                    fontSize: '1rem',
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  <IonIcon icon={car} slot="start" />
                  Book New Parking
                </IonButton>
              </IonCardContent>
            </IonCard>
          )}

          {/* ACTIVE SESSION CARD - REDESIGNED */}
          {isSessionActive &&
            currentBooking &&
            !hasCompletedBooking &&
            !isPaid && (
              <IonCard
                style={{
                  marginBottom: "20px",
                  background: isInOvertime 
                    ? "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)" 
                    : "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
                  border: isInOvertime
                    ? "2px solid #F87171"
                    : "2px solid #FACC15",
                  borderRadius: "20px",
                  boxShadow: isInOvertime 
                    ? "0 8px 25px rgba(239, 68, 68, 0.15)"
                    : "0 8px 25px rgba(245, 158, 11, 0.15)",
                  overflow: "hidden"
                }}
              >
                {/* Status Bar */}
                <div style={{
                  height: "6px",
                  background: isInOvertime 
                    ? "linear-gradient(90deg, #EF4444 0%, #DC2626 100%)" 
                    : "linear-gradient(90deg, #3B82F6 0%, #1D4ED8 100%)",
                  width: "100%"
                }}></div>

                <IonCardContent style={{ padding: "24px" }}>
                  {/* Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "20px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          background: isInOvertime 
                            ? "linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)" 
                            : "linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)",
                          padding: "12px",
                          borderRadius: "14px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                        }}
                      >
                        <IonIcon
                          icon={isInOvertime ? warningOutline : speedometerOutline}
                          style={{
                            color: isInOvertime ? "#DC2626" : "#1D4ED8",
                            fontSize: "1.5rem",
                          }}
                        />
                      </div>
                      <div>
                        <h2
                          style={{
                            margin: 0,
                            fontSize: "1.25rem",
                            fontWeight: 700,
                            color: isInOvertime ? "#B91C1C" : "#1E40AF",
                          }}
                        >
                          {isInOvertime ? "⏰ Overtime Parking" : "🚗 Active Parking"}
                        </h2>
                        <p
                          style={{
                            margin: "4px 0 0 0",
                            fontSize: "0.85rem",
                            color: "#6B7280",
                          }}
                        >
                          {currentBooking.zone} • {currentBooking.slotLabel}
                        </p>
                      </div>
                    </div>
                    <div
                      style={{
                        background: isInOvertime 
                          ? "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)" 
                          : "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                        color: "white",
                        padding: "6px 14px",
                        borderRadius: "20px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                      }}
                    >
                      {isInOvertime ? "OVERDUE" : "ACTIVE"}
                    </div>
                  </div>

                  {/* Booking Time Card */}
                  <div
                    style={{
                      marginBottom: "20px",
                      padding: "16px",
                      background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)",
                      borderRadius: "16px",
                      border: "1px solid #E2E8F0",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <IonIcon icon={timeOutline} style={{ color: "#3B82F6", fontSize: "1.2rem" }} />
                      <span style={{ fontSize: "0.9rem", color: "#374151", fontWeight: 600 }}>
                        Booking Period
                      </span>
                    </div>
                    <div style={{ 
                      display: "grid", 
                      gridTemplateColumns: "1fr auto 1fr", 
                      gap: "8px",
                      alignItems: "center",
                      textAlign: "center"
                    }}>
                      <div>
                        <div style={{ fontSize: "0.8rem", color: "#6B7280", marginBottom: "4px" }}>FROM</div>
                        <div style={{ fontSize: "1rem", fontWeight: "700", color: "#1F2937" }}>{currentBooking.timeIn}</div>
                      </div>
                      <div style={{ fontSize: "1.2rem", color: "#9CA3AF", fontWeight: "bold" }}>→</div>
                      <div>
                        <div style={{ fontSize: "0.8rem", color: "#6B7280", marginBottom: "4px" }}>TO</div>
                        <div style={{ fontSize: "1rem", fontWeight: "700", color: "#1F2937" }}>{currentBooking.timeOut}</div>
                      </div>
                    </div>
                    <div style={{ 
                      textAlign: "center", 
                      marginTop: "12px",
                      padding: "8px",
                      background: "white",
                      borderRadius: "8px",
                      border: "1px solid #F1F5F9"
                    }}>
                      <div style={{ fontSize: "0.8rem", color: "#475569", fontWeight: "500" }}>
                        📅 {currentBooking.date}
                      </div>
                    </div>
                  </div>

                  {/* Time Tracking Section */}
                  <div style={{ marginBottom: "20px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "12px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <IonIcon
                          icon={isInOvertime ? warningOutline : timeOutline}
                          style={{
                            color: isInOvertime ? "#EF4444" : "#10B981",
                            fontSize: "1.3rem",
                          }}
                        />
                        <span
                          style={{
                            fontSize: "1rem",
                            fontWeight: 600,
                            color: isInOvertime ? "#EF4444" : "#065F46",
                          }}
                        >
                          {isInOvertime ? "OVERTIME" : "REMAINING TIME"}
                        </span>
                      </div>
                      <div
                        style={{
                          background: isInOvertime
                            ? "linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)"
                            : "linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)",
                          color: isInOvertime ? "#DC2626" : "#065F46",
                          padding: "6px 16px",
                          borderRadius: "20px",
                          fontSize: "0.9rem",
                          fontWeight: 700,
                          border: `2px solid ${isInOvertime ? '#FECACA' : '#BBF7D0'}`,
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                        }}
                      >
                        {isInOvertime ? `+${overtimeMinutes}m` : `${remainingTime}m`}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div
                      style={{
                        width: "100%",
                        height: "12px",
                        background: "#E2E8F0",
                        borderRadius: "10px",
                        overflow: "hidden",
                        marginBottom: "8px",
                        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)"
                      }}
                    >
                      <div
                        style={{
                          width: isInOvertime
                            ? "100%"
                            : `${Math.max(
                                5,
                                (remainingTime /
                                  (remainingTime + Math.max(overtimeMinutes, 1))) *
                                  100
                              )}%`,
                          height: "100%",
                          background: isInOvertime 
                            ? "linear-gradient(90deg, #EF4444 0%, #DC2626 100%)"
                            : "linear-gradient(90deg, #10B981 0%, #059669 100%)",
                          transition: "width 0.3s ease",
                          borderRadius: "10px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.78rem",
                        color: "#64748B",
                        fontWeight: "500"
                      }}
                    >
                      <span>
                        {isInOvertime ? "TIME EXPIRED" : "BOOKED TIME"}
                      </span>
                      <span>
                        {isInOvertime
                          ? `PENALTY: RM ${penaltyAmount}.00`
                          : "NO PENALTIES"}
                      </span>
                    </div>
                  </div>

                  {/* Penalty Info (if overtime) */}
                  {isInOvertime && !carRemoved && (
                    <div
                      style={{
                        background: "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)",
                        border: "2px solid #FECACA",
                        borderRadius: "16px",
                        padding: "20px",
                        marginBottom: "16px",
                        textAlign: "center",
                        boxShadow: "0 4px 12px rgba(239, 68, 68, 0.1)"
                      }}
                    >
                      <IonIcon
                        icon={warningOutline}
                        style={{
                          color: "#DC2626",
                          fontSize: "2.5rem",
                          marginBottom: "12px",
                          filter: "drop-shadow(0 2px 4px rgba(220, 38, 38, 0.2))"
                        }}
                      />
                      <div
                        style={{
                          fontSize: "2rem",
                          fontWeight: 800,
                          color: "#DC2626",
                          margin: "12px 0",
                          textShadow: "0 2px 4px rgba(0,0,0,0.1)"
                        }}
                      >
                        RM {penaltyAmount}.00
                      </div>
                      <p
                        style={{
                          margin: "8px 0 0 0",
                          color: "#B91C1C",
                          fontSize: "0.95rem",
                          fontWeight: 600,
                        }}
                      >
                        ⚠️ Penalty Increasing: RM10 every 5 minutes
                      </p>
                      <p
                        style={{
                          margin: "4px 0 0 0",
                          color: "#EF4444",
                          fontSize: "0.85rem",
                        }}
                      >
                        Remove your car now to stop extra charges
                      </p>
                    </div>
                  )}

                  {/* Car removed message */}
                  {carRemoved && !isPaid && (
                    <div
                      style={{
                        background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
                        border: "2px solid #FCD34D",
                        borderRadius: "16px",
                        padding: "20px",
                        marginBottom: "16px",
                        textAlign: "center"
                      }}
                    >
                      <IonIcon
                        icon={checkmarkCircleOutline}
                        style={{
                          color: "#D97706",
                          fontSize: "2.5rem",
                          marginBottom: "12px"
                        }}
                      />
                      <p
                        style={{
                          margin: 0,
                          color: "#92400E",
                          fontWeight: 600,
                          fontSize: "1.1rem",
                        }}
                      >
                        Car Removed Successfully!
                      </p>
                      {penaltyAmount > 0 && (
                        <p
                          style={{
                            margin: "6px 0 0 0",
                            color: "#DC2626",
                            fontWeight: 700,
                            fontSize: "1rem",
                          }}
                        >
                          Please pay RM {penaltyAmount}.00 to complete
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ marginTop: 10 }}>
                    {!carRemoved ? (
                      <IonButton
                        color="primary"
                        onClick={handleCarRemoved}
                        expand="block"
                        style={{ 
                          height: 50, 
                          fontWeight: 600,
                          '--background': 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                          '--border-radius': '12px',
                          fontSize: '1rem'
                        }}
                      >
                        <IonIcon icon={checkmarkCircleOutline} slot="start" />
                        I've Removed My Car
                      </IonButton>
                    ) : (
                      <IonButton
                        color={penaltyAmount > 0 ? "success" : "primary"}
                        onClick={
                          penaltyAmount > 0
                            ? () => setShowPaymentModal(true)
                            : handlePaymentComplete
                        }
                        expand="block"
                        style={{ 
                          height: 50, 
                          fontWeight: 600,
                          '--background': penaltyAmount > 0 
                            ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                            : 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                          '--border-radius': '12px',
                          fontSize: '1rem'
                        }}
                      >
                        <IonIcon icon={cardOutline} slot="start" />
                        {penaltyAmount > 0
                          ? `Pay RM ${penaltyAmount}.00`
                          : "Complete Booking"}
                      </IonButton>
                    )}
                  </div>
                </IonCardContent>
              </IonCard>
            )}

          {/* QUICK ACCESS SECTION - REDESIGNED */}
          <IonCard style={{
            background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
            borderRadius: "20px",
            boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
            border: "1px solid #E2E8F0",
            overflow: "hidden"
          }}>
            <div style={{
              height: "4px",
              background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
              width: "100%"
            }}></div>
            <IonCardContent style={{ padding: "24px" }}>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <h3
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "1.3rem",
                    fontWeight: 700,
                    color: "#1F2937",
                  }}
                >
                  Quick Actions
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.9rem",
                    color: "#6B7280",
                  }}
                >
                  Everything you need for smart parking
                </p>
              </div>
              
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                {/* Find Parking Card */}
                <div 
                  onClick={() => (window.location.href = "/zone")}
                  style={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: "16px",
                    padding: "20px 16px",
                    textAlign: "center",
                    color: "white",
                    cursor: "pointer",
                    boxShadow: "0 6px 20px rgba(102, 126, 234, 0.3)",
                    transition: "all 0.3s ease",
                    border: "2px solid rgba(255,255,255,0.1)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 12px 25px rgba(102, 126, 234, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.3)";
                  }}
                >
                  <div style={{
                    background: "rgba(255,255,255,0.2)",
                    width: "50px",
                    height: "50px",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                    backdropFilter: "blur(10px)"
                  }}>
                    <IonIcon icon={locationOutline} style={{ fontSize: "1.8rem", color: "white" }} />
                  </div>
                  <h4 style={{ 
                    margin: "0 0 8px 0",
                    fontSize: "1rem",
                    fontWeight: "600"
                  }}>
                    Find Parking
                  </h4>
                  <p style={{ 
                    margin: 0,
                    fontSize: "0.8rem",
                    opacity: 0.9
                  }}>
                    Book new spot
                  </p>
                </div>

                {/* View Sessions Card */}
                <div 
                  onClick={() => (window.location.href = "/sessions")}
                  style={{
                    background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                    borderRadius: "16px",
                    padding: "20px 16px",
                    textAlign: "center",
                    color: "white",
                    cursor: "pointer",
                    boxShadow: "0 6px 20px rgba(16, 185, 129, 0.3)",
                    transition: "all 0.3s ease",
                    border: "2px solid rgba(255,255,255,0.1)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 12px 25px rgba(16, 185, 129, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(16, 185, 129, 0.3)";
                  }}
                >
                  <div style={{
                    background: "rgba(255,255,255,0.2)",
                    width: "50px",
                    height: "50px",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                    backdropFilter: "blur(10px)"
                  }}>
                    <IonIcon icon={receiptOutline} style={{ fontSize: "1.8rem", color: "white" }} />
                  </div>
                  <h4 style={{ 
                    margin: "0 0 8px 0",
                    fontSize: "1rem",
                    fontWeight: "600"
                  }}>
                    My Sessions
                  </h4>
                  <p style={{ 
                    margin: 0,
                    fontSize: "0.8rem",
                    opacity: 0.9
                  }}>
                    View history
                  </p>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          {/* FOOTER */}
          <div
            style={{
              marginTop: "24px",
              textAlign: "center",
              fontSize: "0.75rem",
              color: "#9CA3AF",
              paddingBottom: "16px",
            }}
          >
            CampusPark RU • Smart parking for Raffles University
          </div>
        </div>

        {/* ⚠️ PENALTY ALERT */}
        <IonAlert
          isOpen={showPenaltyAlert}
          onDidDismiss={() => setShowPenaltyAlert(false)}
          header={"⏰ Parking Time Expired"}
          message={
            "Your booking time has ended. Penalties are now accumulating at RM10 every 5 minutes. Please remove your car immediately to avoid extra charges."
          }
          buttons={["OK, I Understand"]}
        />

        {/* 💰 PAYMENT MODAL */}
        <IonModal isOpen={showPaymentModal}>
          <div style={{ padding: 20 }}>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <IonIcon
                icon={cardOutline}
                style={{ fontSize: "2.5rem", color: "#059669" }}
              />
              <h2 style={{ margin: "8px 0", color: "#065F46" }}>
                Penalty Payment
              </h2>
              <p style={{ margin: 0, color: "#6B7280", fontSize: "0.85rem" }}>
                Please complete your bank transfer and confirm once done.
              </p>
            </div>

            <div
              style={{
                background: "#DCFCE7",
                padding: 18,
                borderRadius: 12,
                marginBottom: 18,
                textAlign: "center",
                border: "1px solid #4ADE80",
              }}
            >
              <p
                style={{
                  margin: "0 0 6px 0",
                  color: "#065F46",
                  fontWeight: 500,
                }}
              >
                Total Amount
              </p>
              <div
                style={{
                  fontSize: "2.4rem",
                  fontWeight: 800,
                  color: "#065F46",
                  margin: "6px 0 4px 0",
                }}
              >
                RM {penaltyAmount}.00
              </div>
              <p
                style={{
                  margin: 0,
                  color: "#065F46",
                  fontSize: "0.8rem",
                }}
              >
                {overtimeMinutes} minutes overtime • RM10 per 5 minutes
              </p>
            </div>

            <div
              style={{
                background: "white",
                padding: 16,
                borderRadius: 10,
                marginBottom: 18,
                border: "1px solid #E5E7EB",
              }}
            >
              <p
                style={{
                  fontWeight: 700,
                  textAlign: "center",
                  marginBottom: 12,
                  color: "#111827",
                  fontSize: "0.95rem",
                }}
              >
                Bank Transfer Details
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 10,
                  paddingBottom: 6,
                  borderBottom: "1px solid #F3F4F6",
                  fontSize: "0.85rem",
                }}
              >
                <span style={{ color: "#6B7280" }}>Bank Name</span>
                <span style={{ fontWeight: 600, color: "#111827" }}>Maybank</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 10,
                  paddingBottom: 6,
                  borderBottom: "1px solid #F3F4F6",
                  fontSize: "0.85rem",
                }}
              >
                <span style={{ color: "#6B7280" }}>Account Name</span>
                <span style={{ fontWeight: 600, color: "#111827" }}>
                  CampusPark RU
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 10,
                  paddingBottom: 6,
                  borderBottom: "1px solid #F3F4F6",
                  fontSize: "0.85rem",
                }}
              >
                <span style={{ color: "#6B7280" }}>Account Number</span>
                <span style={{ fontWeight: 600, color: "#111827" }}>
                  1234 5678 9012
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: 4,
                  fontSize: "0.85rem",
                }}
              >
                <span style={{ color: "#6B7280" }}>Reference</span>
                <span style={{ fontWeight: 600, color: "#111827" }}>
                  PARK-REF
                </span>
              </div>
            </div>

            <p
              style={{
                textAlign: "center",
                color: "#6B7280",
                fontSize: "0.78rem",
                marginBottom: 18,
              }}
            >
              After completing the transfer, tap{" "}
              <strong>"I've Paid"</strong> to confirm your payment.
            </p>

            <IonButton
              onClick={handlePaymentComplete}
              color="success"
              expand="block"
              style={{
                height: 48,
                fontSize: "1.05rem",
                fontWeight: 600,
              }}
            >
              <IonIcon icon={checkmarkCircleOutline} slot="start" />
              I've Paid
            </IonButton>
          </div>
        </IonModal>

        {/* Small CSS for the floating car animation */}
        <style>
          {`
            .floating-car {
              animation: carFloat 3s ease-in-out infinite;
            }
            @keyframes carFloat {
              0% { transform: translateX(0) translateY(0); }
              25% { transform: translateX(12px) translateY(-2px); }
              50% { transform: translateX(24px) translateY(0); }
              75% { transform: translateX(12px) translateY(2px); }
              100% { transform: translateX(0) translateY(0); }
            }
          `}
        </style>
      </IonContent>
    </IonPage>
  );
};

export default Home;