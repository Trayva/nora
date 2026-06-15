import { useState, useEffect, useRef } from "react";
import { MdLocationOn } from "react-icons/md";

export default function MapPicker({ lat, lng, onPick }) {
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const markerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const DEFAULT_LAT = 9.0765;
  const DEFAULT_LNG = 7.3986;
  const initLat = lat && !isNaN(Number(lat)) ? Number(lat) : DEFAULT_LAT;
  const initLng = lng && !isNaN(Number(lng)) ? Number(lng) : DEFAULT_LNG;

  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const loadLeaflet = () => {
      if (window.L) {
        initMap();
        return;
      }
      if (document.getElementById("leaflet-js")) {
        const wait = setInterval(() => {
          if (window.L) {
            clearInterval(wait);
            initMap();
          }
        }, 100);
        return;
      }
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initMap;
      script.onerror = () => setLoadError(true);
      document.head.appendChild(script);
    };

    const initMap = () => {
      if (!mapRef.current || leafletRef.current) return;
      const L = window.L;
      const map = L.map(mapRef.current).setView([initLat, initLng], 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: `<div style="width:22px;height:22px;background:#cb6cdc;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(203,108,220,0.5)"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 22],
      });

      const marker = L.marker([initLat, initLng], {
        icon,
        draggable: true,
      }).addTo(map);
      markerRef.current = marker;
      leafletRef.current = map;

      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        onPick(lat, lng);
      });

      marker.on("dragend", (e) => {
        const { lat, lng } = e.target.getLatLng();
        onPick(lat, lng);
      });

      setMapReady(true);
    };

    loadLeaflet();

    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!markerRef.current || !leafletRef.current) return;
    const newLat = Number(lat);
    const newLng = Number(lng);
    if (!isNaN(newLat) && !isNaN(newLng) && newLat !== 0 && newLng !== 0) {
      markerRef.current.setLatLng([newLat, newLng]);
      leafletRef.current.setView(
        [newLat, newLng],
        leafletRef.current.getZoom(),
      );
    }
  }, [lat, lng]);

  if (loadError)
    return (
      <div
        style={{
          height: 220,
          background: "var(--bg-hover)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 8,
          color: "var(--text-muted)",
          fontSize: "0.8rem",
        }}
      >
        <MdLocationOn size={24} style={{ opacity: 0.3 }} />
        Map failed to load — enter coordinates manually
      </div>
    );

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid var(--border)",
      }}
    >
      <div
        ref={mapRef}
        style={{ height: 240, width: "100%", background: "var(--bg-hover)" }}
      />
      {!mapReady && (
        <div
          className="skeleton_shimmer"
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--bg-hover)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.78rem",
            color: "var(--text-muted)",
            fontWeight: 700,
          }}
        >
          Loading map…
        </div>
      )}
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(4px)",
          borderRadius: 6,
          padding: "4px 10px",
          fontSize: "0.65rem",
          color: "rgba(255,255,255,0.85)",
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        Click map or drag pin to set location
      </div>
    </div>
  );
}
