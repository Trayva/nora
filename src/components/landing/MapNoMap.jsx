import { useEffect, useState } from "react";
import { getSlotColor } from "../../utils/string";

export default function Map({ markers = [], onMarkerClick, isOpened }) {
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation({ latitude, longitude });
        },
        () => {
          // fallback: Dubai coords
          setUserLocation({ latitude: 25.1972, longitude: 55.2744 });
        }
      );
    }
  }, []);

  // Colors pool
  //   const colors = ["#f44336", "#ff9800", "#4caf50"];

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: `calc(100% - ${isOpened ? 45 : 20}px)`,
        background:
          "linear-gradient(to bottom right, var(--map-g1), var(--map-g2))",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    >
      {/* User marker */}
      {userLocation && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "glow 2s infinite ease-in-out",
              color: "#3b82f6",
              margin: "0 auto",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "#ffffff",
              }}
            ></div>
          </div>
          <div
            className="text-black"
            style={{
              marginTop: "4px",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            You are here
          </div>
        </div>
      )}

      {/* Render markers */}
      {markers.map(({ id, ...props }, index) => {
        // Random scatter position
        const angle = (index / markers.length) * 2 * Math.PI;
        const radius = 80 + Math.random() * 120;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const color = getSlotColor(props.totalSlots, props.availableSlots);

        return (
          <div
            key={id}
            onClick={() =>
              onMarkerClick && onMarkerClick({ id, color, ...props })
            }
            style={{
              position: "absolute",
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "17px",
                height: "17px",
                borderRadius: "50%",
                backgroundColor: color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "glow 2s infinite ease-in-out",
                color: color,
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: darkenColor(color),
                  position: "absolute",
                  bottom: -10,
                }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Helper: darken color slightly for inner dot
function darkenColor(hex, percent = -30) {
  const num = parseInt(hex.replace("#", ""), 16);
  let r = (num >> 16) + percent;
  let g = ((num >> 8) & 0x00ff) + percent;
  let b = (num & 0x0000ff) + percent;
  r = Math.max(Math.min(255, r), 0);
  g = Math.max(Math.min(255, g), 0);
  b = Math.max(Math.min(255, b), 0);
  return `rgb(${r},${g},${b})`;
}
