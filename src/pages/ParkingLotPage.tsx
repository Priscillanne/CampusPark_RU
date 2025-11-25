import { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import { db } from "../firebaseConfig"; // ✅ make sure this is the correct import
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { saveToCache, getFromCache } from "../utils/storage"; // Import cache helper functions

type ParkingSpot = {
  id: string;
  status: "available" | "booked" | "disabled";
  type: "regular" | "disabled";
};

export default function ParkingLotPage() {
  const { id } = useParams<{ id: string }>(); // zoneId from URL
  const history = useHistory();
  const [zone, setZone] = useState<{ name: string } | null>(null);
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    vehicleNumber: "",
    duration: "",
  });

  // 🔥 Fetch zone and its parking spots
  useEffect(() => {
    const fetchZoneAndSpots = async () => {
      // First, try to get cached data
      const zoneCacheKey = `zone_${id}`;
      const spotsCacheKey = `spots_${id}`;
      const cachedZone = await getFromCache(zoneCacheKey);
      const cachedSpots = await getFromCache(spotsCacheKey);
      if (cachedZone && cachedSpots) {
        setZone(cachedZone);
        setSpots(cachedSpots);
        setLoading(false);
      }

      // Now fetch live data from Firestore
      try {
        const zoneRef = doc(db, "zones", id);
        const zoneDoc = await getDoc(zoneRef);

        if (zoneDoc.exists()) {
          const zoneData = zoneDoc.data() as { name: string };
          setZone(zoneData);
          // Save zone data to cache
          saveToCache(zoneCacheKey, zoneData);

          const spotsRef = collection(db, "zones", id, "parkingSpots");
          const snapshot = await getDocs(spotsRef);

          const spotsList: ParkingSpot[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<ParkingSpot, "id">),
          }));

          setSpots(spotsList);
          // Save spots data to cache
          saveToCache(spotsCacheKey, spotsList);
        } else {
          console.error("Zone not found");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchZoneAndSpots();
  }, [id]);

  // 🧠 UI Helpers
  const getSpotDisplay = (spot: ParkingSpot) => {
    if (spot.status === "booked") {
      return { emoji: "🚗", color: "#ef4444", bgColor: "#fecaca" };
    } else if (spot.type === "disabled") {
      return { emoji: "♿", color: "#6b7280", bgColor: "#f3f4f6" };
    } else {
      return { emoji: "", color: "#10b981", bgColor: "#d1fae5" };
    }
  };

  if (loading) {
    return <p>Loading parking lot...</p>;
  }

  if (!zone) {
    return <p>Zone not found!</p>;
  }

  return (
    <div style={{ padding: 24, backgroundColor: "#f9fafb", minHeight: "100vh" }}>
      <h1
        style={{
          fontSize: 32,
          fontWeight: 800,
          color: "#111827",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        {zone.name} Parking Lot
      </h1>
      <p style={{ textAlign: "center", color: "#6b7280", marginBottom: 24 }}>
        Select an available parking spot
      </p>

      {/* Legend */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "center" }}>
          <LegendBox color="#10b981" bgColor="#d1fae5" label="Available" />
          <LegendBox color="#ef4444" bgColor="#fecaca" label="Booked" emoji="🚗" />
          <LegendBox color="#6b7280" bgColor="#f3f4f6" label="Disabled" emoji="♿" />
        </div>
      </div>

      {/* Grid of spots */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 140px)",
          gap: "20px 60px",
          maxWidth: "900px",
          margin: "0 auto",
          padding: "20px",
          backgroundColor: "white",
          borderRadius: "16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        {spots.map((spot) => {
          const display = getSpotDisplay(spot);
          return (
            <div
              key={spot.id}
              style={{
                width: "120px",
                height: "120px",
                backgroundColor: display.bgColor,
                border: `3px solid ${display.color}`,
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
                fontWeight: "bold",
                color: display.color,
                cursor: spot.status === "available" ? "pointer" : "default",
              }}
              onClick={() => {
                if (spot.status === "available") {
                  if (spot.type === "disabled") {
                    alert("This parking bay is reserved for OKU permit holders.");
                  } else {
                    setSelectedSpot(spot);
                    setShowForm(true);
                  }
                }
              }}
            >
              {display.emoji}
              <span style={{ fontSize: "16px", marginTop: "4px", fontWeight: "600" }}>{spot.id}</span>
            </div>
          );
        })}
      </div>

      {/* Booking modal */}
      {showForm && selectedSpot && (
        <BookingModal
          selectedSpot={selectedSpot}
          formData={formData}
          setFormData={setFormData}
          setShowForm={setShowForm}
          setSelectedSpot={setSelectedSpot}
        />
      )}

      {/* Back button */}
      <div style={{ textAlign: "center", marginTop: 32 }}>
        <button
          onClick={() => history.goBack()}
          style={{
            background: "#fde047",
            border: "none",
            borderRadius: 12,
            padding: "12px 24px",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "16px",
            boxShadow: "0 2px 8px rgba(253, 224, 71, 0.3)",
          }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}

/* ---------- Small UI Components ---------- */
function LegendBox({
  color,
  bgColor,
  label,
  emoji,
}: {
  color: string;
  bgColor: string;
  label: string;
  emoji?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <div
        style={{
          width: 24,
          height: 24,
          backgroundColor: bgColor,
          border: `2px solid ${color}`,
          borderRadius: 4,
          marginRight: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
        }}
      >
        {emoji}
      </div>
      <span style={{ fontSize: 14, color: "#374151" }}>{label}</span>
    </div>
  );
}

function BookingModal({
  selectedSpot,
  formData,
  setFormData,
  setShowForm,
  setSelectedSpot,
}: any) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "16px",
          maxWidth: "400px",
          width: "90%",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
        }}
      >
        <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "16px", textAlign: "center" }}>
          Book Spot {selectedSpot.id}
        </h2>

        {/* Name */}
        <label style={{ display: "block", fontWeight: "600", marginBottom: "8px" }}>Name:</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            marginBottom: "16px",
          }}
        />

        {/* Vehicle Number */}
        <label style={{ display: "block", fontWeight: "600", marginBottom: "8px" }}>Vehicle Number:</label>
        <input
          type="text"
          value={formData.vehicleNumber}
          onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            marginBottom: "16px",
          }}
        />

        {/* Duration */}
        <label style={{ display: "block", fontWeight: "600", marginBottom: "8px" }}>Duration (hours):</label>
        <select
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            marginBottom: "24px",
          }}
        >
          <option value="">Select duration</option>
          <option value="1">1 hour</option>
          <option value="2">2 hours</option>
          <option value="3">3 hours</option>
          <option value="4">4 hours</option>
        </select>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => {
              setShowForm(false);
              setSelectedSpot(null);
            }}
            style={{
              flex: 1,
              background: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "12px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>

          <button
            onClick={() => {
              if (formData.name && formData.vehicleNumber && formData.duration) {
                alert(
                  `Booking confirmed!\nSpot: ${selectedSpot.id}\nName: ${formData.name}\nVehicle: ${formData.vehicleNumber}\nDuration: ${formData.duration} hours`
                );
                setShowForm(false);
                setSelectedSpot(null);
              } else {
                alert("Please fill in all fields");
              }
            }}
            style={{
              flex: 1,
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "12px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
}
