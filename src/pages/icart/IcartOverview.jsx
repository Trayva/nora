import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  MdWifi,
  MdWifiOff,
  MdLock,
  MdLockOpen,
  MdLocationOn,
  MdEdit,
  MdAdd,
  MdStorefront,
  MdSignalCellularAlt,
  MdPerson,
  MdVerified,
  MdExpandMore,
  MdExpandLess,
  MdImage,
  MdRestaurantMenu,
  MdVideocam,
  MdClose,
} from "react-icons/md";
import api from "../../api/axios";
import Modal from "../../components/Modal";

const LOCATION_TYPES = ["ACTIVE", "POTENTIAL", "INACTIVE", "RESTRICTED"];
const BLANK_LOCATION = {
  name: "",
  address: "",
  city: "",
  lga: "",
  country: "",
  stateName: "",
  latitude: "",
  longitude: "",
  locationIdType: "ACTIVE",
  notes: "",
};

function ToggleRow({ icon, label, value, loading, onToggle }) {
  return (
    <div className="icart_toggle_row">
      <div className="icart_toggle_left">
        <span className="profile_phone_date_icon">{icon}</span>
        <span className="icart_toggle_label">{label}</span>
      </div>
      <button
        className={`icart_toggle_switch ${value ? "icart_toggle_on" : ""}`}
        onClick={onToggle}
        disabled={loading}
      >
        <span className="icart_toggle_knob" />
      </button>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="icart_meta_row">
      <span className="icart_meta_key">{label}</span>
      <span className="icart_meta_val">
        {value || <span className="icart_meta_muted">—</span>}
      </span>
    </div>
  );
}

/* ── Live Stream Modal ─────────────────────────────────────── */
function LiveStreamModal({ onClose }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } catch {
        /* browser may deny */
      }
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Sync state when user presses Escape to exit fullscreen
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Close modal on Escape (only when not fullscreen — browser handles Escape in fullscreen)
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && !document.fullscreenElement) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(3px)",
        }}
      />
      <div
        ref={containerRef}
        style={{
          position: "relative",
          zIndex: 1,
          width: "min(520px, 92vw)",
          background: "var(--bg-card)",
          borderRadius: isFullscreen ? 0 : 18,
          overflow: "hidden",
          boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
          ...(isFullscreen
            ? {
                width: "100vw",
                height: "100vh",
                display: "flex",
                flexDirection: "column",
              }
            : {}),
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MdVideocam size={16} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: "0.9rem",
                fontWeight: 800,
                color: "var(--text-heading)",
              }}
            >
              Live Stream
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              Kitchen camera feed
            </div>
          </div>
          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
              marginRight: 4,
              fontSize: "0.9rem",
            }}
          >
            {isFullscreen ? "⤡" : "⤢"}
          </button>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
            }}
          >
            <MdClose size={15} />
          </button>
        </div>

        {/* Video placeholder */}
        <div
          style={{
            position: "relative",
            background: "#0a0a0a",
            ...(isFullscreen ? { flex: 1 } : { aspectRatio: "16/9" }),
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          {/* Scanlines */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(239,68,68,0.1)",
              border: "2px solid rgba(239,68,68,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MdVideocam size={28} style={{ color: "rgba(239,68,68,0.6)" }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "0.88rem",
                fontWeight: 700,
                color: "rgba(255,255,255,0.7)",
                marginBottom: 4,
              }}
            >
              No Feed Available
            </div>
            <div
              style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)" }}
            >
              Live stream will appear here when the camera is connected
            </div>
          </div>
          {/* Status badge */}
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 8px",
              background: "rgba(0,0,0,0.5)",
              borderRadius: 6,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#ef4444",
                opacity: 0.5,
              }}
            />
            <span
              style={{
                fontSize: "0.65rem",
                color: "rgba(255,255,255,0.5)",
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              OFFLINE
            </span>
          </div>
          {/* Fullscreen hint */}
          {!isFullscreen && (
            <button
              onClick={toggleFullscreen}
              style={{
                position: "absolute",
                bottom: 10,
                right: 10,
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                background: "rgba(0,0,0,0.5)",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                color: "rgba(255,255,255,0.6)",
                fontSize: "0.65rem",
                fontWeight: 700,
              }}
            >
              ⤢ Fullscreen
            </button>
          )}
        </div>

        <div
          style={{
            padding: "12px 20px",
            fontSize: "0.74rem",
            color: "var(--text-muted)",
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          Camera integration coming soon
        </div>
      </div>
    </div>
  );
}

/* ── Location Form ─────────────────────────────────────────── */
/* ── Map Picker ──────────────────────────────────────────────── */
function MapPicker({ lat, lng, onPick }) {
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const markerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Default center: Abuja, Nigeria
  const DEFAULT_LAT = 9.0765;
  const DEFAULT_LNG = 7.3986;
  const initLat = lat && !isNaN(Number(lat)) ? Number(lat) : DEFAULT_LAT;
  const initLng = lng && !isNaN(Number(lng)) ? Number(lng) : DEFAULT_LNG;

  useEffect(() => {
    // Load Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    const loadLeaflet = () => {
      if (window.L) {
        initMap();
        return;
      }
      if (document.getElementById("leaflet-js")) {
        // already loading — wait
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

      // Custom accent-colored marker
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

      // Click map → move marker
      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        onPick(lat, lng);
      });

      // Drag marker
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

  // Keep marker in sync when lat/lng are typed manually
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
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--bg-hover)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontSize: "0.78rem",
            color: "var(--text-muted)",
          }}
        >
          <div
            className="page_loader_spinner"
            style={{ width: 18, height: 18 }}
          />{" "}
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

function LocationForm({ cartId, onSaved, onCancel }) {
  const [form, setForm] = useState(BLANK_LOCATION);
  const [saving, setSaving] = useState(false);
  const [states, setStates] = useState([]);
  const [statesLoading, setStatesLoading] = useState(true);
  const [detectingGPS, setDetectingGPS] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    api
      .get("/config/state")
      .then((res) => setStates(res.data.data || []))
      .catch(() => toast.error("Failed to load states"))
      .finally(() => setStatesLoading(false));
  }, []);

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));
  const handleStateChange = (stateId) => {
    const selected = states.find((s) => s.id === stateId);
    setForm((p) => ({
      ...p,
      _selectedStateId: stateId,
      stateName: selected?.name || p.stateName,
      country: selected?.country || p.country,
    }));
  };

  const detectGPS = () => {
    if (!navigator.geolocation)
      return toast.error("Geolocation not supported in this browser");
    setDetectingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setForm((p) => ({
          ...p,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
        }));
        setShowMap(true);
        toast.success("Location detected!");
        setDetectingGPS(false);
      },
      (err) => {
        setDetectingGPS(false);
        const msgs = {
          1: "Location permission denied",
          2: "Location unavailable",
          3: "Location request timed out",
        };
        toast.error(msgs[err.code] || "Failed to detect location");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleMapPick = (lat, lng) => {
    setForm((p) => ({
      ...p,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));
  };

  const handleSubmit = async () => {
    const required = [
      "name",
      "address",
      "city",
      "lga",
      "country",
      "latitude",
      "longitude",
      "locationIdType",
    ];
    for (const key of required) {
      if (!String(form[key]).trim()) return toast.error(`${key} is required`);
    }
    if (isNaN(form.latitude) || isNaN(form.longitude))
      return toast.error("Latitude and longitude must be valid numbers");
    if (!form._selectedStateId) return toast.error("Please select a state");
    setSaving(true);
    try {
      const locRes = await api.post("/icart/location", {
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        lga: form.lga.trim(),
        country: form.country.trim(),
        stateId: form._selectedStateId,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        locationIdType: form.locationIdType,
        notes: form.notes.trim() || undefined,
      });
      const locationId = locRes.data.data?.id;
      if (!locationId) throw new Error("No location ID returned");
      await api.post(`/icart/${cartId}/change-location`, { locationId });
      toast.success("Location created and assigned");
      onSaved(locRes.data.data);
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Failed to save location",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="icart_location_form">
      <div className="icart_location_form_grid">
        <div className="form-field" style={{ gridColumn: "1 / -1" }}>
          <label className="modal-label">Location Name *</label>
          <input
            className="modal-input"
            placeholder="e.g. Wuse Market Stand"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>
        <div className="form-field" style={{ gridColumn: "1 / -1" }}>
          <label className="modal-label">Address *</label>
          <input
            className="modal-input"
            placeholder="Street address"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="modal-label">City *</label>
          <input
            className="modal-input"
            placeholder="e.g. Abuja"
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="modal-label">LGA *</label>
          <input
            className="modal-input"
            placeholder="e.g. Wuse"
            value={form.lga}
            onChange={(e) => set("lga", e.target.value)}
          />
        </div>
        <div className="form-field" style={{ gridColumn: "1 / -1" }}>
          <label className="modal-label">State *</label>
          <select
            className="modal-input"
            value={form._selectedStateId || ""}
            onChange={(e) => handleStateChange(e.target.value)}
            disabled={statesLoading}
          >
            <option value="">
              {statesLoading ? "Loading states…" : "Select a state"}
            </option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code}) — {s.country}
              </option>
            ))}
          </select>
        </div>

        {/* Coordinates section */}
        <div className="form-field" style={{ gridColumn: "1 / -1" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <label className="modal-label" style={{ margin: 0 }}>
              Coordinates *
            </label>
            <div style={{ display: "flex", gap: 6 }}>
              {/* Detect GPS */}
              <button
                onClick={detectGPS}
                disabled={detectingGPS}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  height: 28,
                  padding: "0 10px",
                  borderRadius: 7,
                  border: "1px solid rgba(59,130,246,0.3)",
                  background: "rgba(59,130,246,0.06)",
                  color: "#3b82f6",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                }}
              >
                {detectingGPS ? (
                  <>
                    <div
                      className="page_loader_spinner"
                      style={{
                        width: 11,
                        height: 11,
                        borderColor: "#3b82f6",
                        borderTopColor: "transparent",
                      }}
                    />{" "}
                    Detecting…
                  </>
                ) : (
                  <>
                    <MdLocationOn size={13} /> Detect Location
                  </>
                )}
              </button>
              {/* Toggle map */}
              <button
                onClick={() => setShowMap((v) => !v)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  height: 28,
                  padding: "0 10px",
                  borderRadius: 7,
                  border: `1px solid ${showMap ? "rgba(203,108,220,0.4)" : "var(--border)"}`,
                  background: showMap ? "var(--bg-active)" : "var(--bg-hover)",
                  color: showMap ? "var(--accent)" : "var(--text-muted)",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                }}
              >
                🗺 {showMap ? "Hide Map" : "Pick on Map"}
              </button>
            </div>
          </div>

          {/* Map */}
          {showMap && (
            <div style={{ marginBottom: 10 }}>
              <MapPicker
                lat={form.latitude}
                lng={form.longitude}
                onPick={handleMapPick}
              />
            </div>
          )}

          {/* Lat/Lng manual inputs */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            <div>
              <label className="modal-label" style={{ fontSize: "0.65rem" }}>
                Latitude
              </label>
              <input
                className="modal-input"
                type="number"
                step="any"
                placeholder="e.g. 9.0765"
                value={form.latitude}
                onChange={(e) => {
                  set("latitude", e.target.value);
                }}
                style={{ marginBottom: 0 }}
              />
            </div>
            <div>
              <label className="modal-label" style={{ fontSize: "0.65rem" }}>
                Longitude
              </label>
              <input
                className="modal-input"
                type="number"
                step="any"
                placeholder="e.g. 7.3986"
                value={form.longitude}
                onChange={(e) => {
                  set("longitude", e.target.value);
                }}
                style={{ marginBottom: 0 }}
              />
            </div>
          </div>
          {form.latitude &&
            form.longitude &&
            !isNaN(Number(form.latitude)) &&
            !isNaN(Number(form.longitude)) && (
              <div
                style={{
                  marginTop: 6,
                  fontSize: "0.68rem",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <MdLocationOn size={12} style={{ color: "var(--accent)" }} />
                {Number(form.latitude).toFixed(4)},{" "}
                {Number(form.longitude).toFixed(4)}
                <a
                  href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    marginLeft: 4,
                    color: "var(--accent)",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Verify on Google Maps ↗
                </a>
              </div>
            )}
        </div>

        <div className="form-field">
          <label className="modal-label">Location Type *</label>
          <select
            className="modal-input"
            value={form.locationIdType}
            onChange={(e) => set("locationIdType", e.target.value)}
          >
            {LOCATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label className="modal-label">Notes</label>
          <input
            className="modal-input"
            placeholder="Optional"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button
          className={`app_btn app_btn_confirm ${saving ? "btn_loading" : ""}`}
          style={{ flex: 1, height: 40 }}
          onClick={handleSubmit}
          disabled={saving || statesLoading}
        >
          <span className="btn_text">Create & Assign</span>
          {saving && (
            <span className="btn_loader" style={{ width: 14, height: 14 }} />
          )}
        </button>
        <button
          className="app_btn app_btn_cancel"
          style={{ flex: 1, height: 40 }}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ── Vendor & Menu Section ──────────────────────────────────── */
const MAX_MENU_ITEMS = 5;
const VENDOR_PAGE_SIZE = 6;
const MENU_PAGE_SIZE = 8;

const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Angola",
  "Argentina",
  "Australia",
  "Austria",
  "Bangladesh",
  "Belgium",
  "Bolivia",
  "Brazil",
  "Cameroon",
  "Canada",
  "Chile",
  "China",
  "Colombia",
  "Congo",
  "Côte d'Ivoire",
  "Croatia",
  "Czech Republic",
  "Denmark",
  "Ecuador",
  "Egypt",
  "Ethiopia",
  "Finland",
  "France",
  "Germany",
  "Ghana",
  "Greece",
  "Guatemala",
  "Honduras",
  "Hungary",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kuwait",
  "Lebanon",
  "Libya",
  "Malaysia",
  "Mexico",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "Norway",
  "Pakistan",
  "Panama",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Romania",
  "Russia",
  "Saudi Arabia",
  "Senegal",
  "Sierra Leone",
  "Somalia",
  "South Africa",
  "South Korea",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Sweden",
  "Switzerland",
  "Syria",
  "Tanzania",
  "Thailand",
  "Tunisia",
  "Turkey",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

/* ── Invoice Payment Modal ───────────────────────────────────── */
function InvoicePayModal({ invoice, application, onPaid, onClose }) {
  const [paying, setPaying] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });

  useEffect(() => {
    api
      .get("/finance/wallet")
      .then((r) => setWallet(r.data.data))
      .catch(() => {})
      .finally(() => setWalletLoading(false));
  }, []);

  const handlePay = async () => {
    setPaying(true);
    try {
      await api.get(
        `/finance/invoice/${invoice.id}/pay?method=wallet&shouldRedirect=false`,
      );
      toast.success("Payment successful!");
      onPaid();
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const sufficient = wallet && wallet.balance >= invoice.total;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(3px)",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "min(400px, 94vw)",
          background: "var(--bg-card)",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 20px 0" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <div
              style={{
                fontSize: "1rem",
                fontWeight: 900,
                color: "var(--text-heading)",
              }}
            >
              Invoice
            </div>
            <span
              style={{
                fontSize: "0.65rem",
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: 999,
                background: "rgba(234,179,8,0.1)",
                color: "#ca8a04",
                border: "1px solid rgba(234,179,8,0.25)",
              }}
            >
              {invoice.status}
            </span>
          </div>
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              marginBottom: 16,
            }}
          >
            {application?.vendor?.businessName} · {invoice.currency}
          </div>

          {/* Invoice items */}
          <div
            style={{
              background: "var(--bg-hover)",
              borderRadius: 10,
              overflow: "hidden",
              marginBottom: 14,
            }}
          >
            {invoice.items?.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 13px",
                  borderBottom:
                    i < invoice.items.length - 1
                      ? "1px solid var(--border)"
                      : "none",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: "var(--text-body)",
                    }}
                  >
                    {item.title}
                  </div>
                  {item.description && (
                    <div
                      style={{
                        fontSize: "0.70rem",
                        color: "var(--text-muted)",
                        marginTop: 1,
                      }}
                    >
                      {item.description}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div
                    style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}
                  >
                    × {item.quantity}
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 800,
                      color: "var(--text-heading)",
                    }}
                  >
                    ₦{fmt(item.amount * item.quantity)}
                  </div>
                </div>
              </div>
            ))}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "11px 13px",
                borderTop: "1px solid var(--border)",
                background: "var(--bg-card)",
              }}
            >
              <span
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                }}
              >
                Total
              </span>
              <span
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 900,
                  color: "var(--accent)",
                }}
              >
                ₦{fmt(invoice.total)}
              </span>
            </div>
          </div>

          {/* Wallet balance */}
          <div
            style={{
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "10px 13px",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 4,
              }}
            >
              Wallet Balance
            </div>
            {walletLoading ? (
              <div
                className="page_loader_spinner"
                style={{ width: 16, height: 16 }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: "1rem",
                    fontWeight: 900,
                    color: sufficient ? "#16a34a" : "#ef4444",
                  }}
                >
                  ₦{fmt(wallet?.balance || 0)}
                </span>
                {!sufficient && (
                  <span
                    style={{
                      fontSize: "0.68rem",
                      color: "#ef4444",
                      fontWeight: 700,
                    }}
                  >
                    Insufficient balance
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "0 20px 20px", display: "flex", gap: 8 }}>
          <button
            className="app_btn app_btn_cancel"
            style={{ flex: 1, height: 42 }}
            onClick={onClose}
            disabled={paying}
          >
            Later
          </button>
          <button
            className={`app_btn app_btn_confirm${paying ? " btn_loading" : ""}`}
            style={{
              flex: 2,
              height: 42,
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              opacity: !sufficient && !walletLoading ? 0.5 : 1,
            }}
            onClick={handlePay}
            disabled={
              paying || walletLoading || (!sufficient && wallet !== null)
            }
          >
            <span className="btn_text">
              Pay ₦{fmt(invoice.total)} from Wallet
            </span>
            {paying && (
              <span className="btn_loader" style={{ width: 14, height: 14 }} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── VendorMenuSection ───────────────────────────────────────── */
function VendorMenuSection({ cart, onUpdate, onRefresh }) {
  // phase: idle | picking-vendor | terms | vendor-detail
  const [phase, setPhase] = useState("idle");

  // vendor picking
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorPage, setVendorPage] = useState(1);
  const [vendorSearch, setVendorSearch] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(null);

  // browse-menu (preview only)
  const [browseItems, setBrowseItems] = useState([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browsePage, setBrowsePage] = useState(1);
  const [browseSearch, setBrowseSearch] = useState("");
  const [showBrowseModal, setShowBrowseModal] = useState(false);

  // terms
  const [termsData, setTermsData] = useState(null);
  const [termsLoading, setTermsLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // confirmation + invoice
  const [confirming, setConfirming] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null); // { invoice, application }

  // vendor-detail (manage existing menus)
  const [cartMenuItems, setCartMenuItems] = useState(cart.menuItems || []);
  const [vendorMenuItems, setVendorMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuPage, setMenuPage] = useState(1);
  const [menuSearch, setMenuSearch] = useState("");
  const [pendingAdd, setPendingAdd] = useState([]);
  const [markupValues, setMarkupValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  const assignedVendor = cart.vendor;
  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });

  // ── Fetch vendors ──
  const fetchVendors = async () => {
    setVendorsLoading(true);
    try {
      const res = await api.get("/vendor/profile");
      const d = res.data.data;
      setVendors(Array.isArray(d) ? d : d?.vendors || []);
    } catch {
      toast.error("Failed to load vendors");
    } finally {
      setVendorsLoading(false);
    }
  };

  // ── Fetch vendor menu for browsing (preview) ──
  const fetchBrowseMenu = async (vendorId) => {
    setBrowseLoading(true);
    setBrowseItems([]);
    setBrowsePage(1);
    setBrowseSearch("");
    try {
      const res = await api.get(
        `/vendor/menu?vendorId=${vendorId}&page=1&limit=100`,
      );
      const d = res.data.data;
      setBrowseItems(Array.isArray(d) ? d : d?.items || d?.menuItems || []);
      setShowBrowseModal(true);
    } catch {
      toast.error("Failed to load menu");
    } finally {
      setBrowseLoading(false);
    }
  };

  // ── Fetch terms (auto, no button) ──
  const fetchTerms = async (country) => {
    if (!country) return;
    setTermsLoading(true);
    setTermsData(null);
    setTermsAccepted(false);
    try {
      const res = await api.get(
        `/icartVendorApplication/settings/country/${encodeURIComponent(country)}`,
      );
      setTermsData(res.data.data);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "No settings found for this country",
      );
    } finally {
      setTermsLoading(false);
    }
  };

  // Auto-load terms when entering terms phase
  useEffect(() => {
    if (phase === "terms") {
      const country = cart.location?.country || "";
      fetchTerms(country);
    }
  }, [phase]);

  // ── Confirm vendor → get invoice ──
  const handleConfirm = async () => {
    if (!termsAccepted) {
      toast.error("Please accept the terms to continue");
      return;
    }
    setConfirming(true);
    try {
      const res = await api.post(`/icart/${cart.id}/change-vendor`, {
        vendorId: selectedVendor.id,
        country: cart.location?.country,
      });
      const { application, invoice } = res.data.data;
      setInvoiceData({ application, invoice });
      // Update cart vendor optimistically
      onUpdate({ ...cart, vendor: selectedVendor });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to set vendor");
    } finally {
      setConfirming(false);
    }
  };

  // ── After payment: reload cart ──
  const handlePaid = () => {
    setInvoiceData(null);
    setPhase("idle");
    onRefresh();
    toast.success("Vendor confirmed! You can now manage your menu items.");
  };

  // ── Open manage-menus (vendor-detail) ──
  const openVendorDetail = () => {
    setPhase("vendor-detail");
    const vendorId = assignedVendor?.id || cart.menuItems?.[0]?.vendorId;
    if (vendorId) {
      setMenuLoading(true);
      setVendorMenuItems([]);
      setMenuPage(1);
      setMenuSearch("");
      api
        .get(`/vendor/menu?vendorId=${vendorId}&page=1&limit=100`)
        .then((r) => {
          const d = r.data.data;
          setVendorMenuItems(
            Array.isArray(d) ? d : d?.items || d?.menuItems || [],
          );
        })
        .catch(() => toast.error("Failed to load menu items"))
        .finally(() => setMenuLoading(false));
    }
    setCartMenuItems(cart.menuItems || []);
    setPendingAdd([]);
    setMarkupValues({});
  };

  // ── Add pending items ──
  const togglePendingAdd = (item) => {
    if (isAdded(item.id)) return;
    setPendingAdd((prev) => {
      const exists = prev.find((p) => p.id === item.id);
      if (exists) return prev.filter((p) => p.id !== item.id);
      if (cartMenuItems.length + prev.length >= MAX_MENU_ITEMS) {
        toast.error(`Maximum ${MAX_MENU_ITEMS} menu items allowed`);
        return prev;
      }
      return [...prev, { id: item.id, markup: 0 }];
    });
    setMarkupValues((prev) => ({ ...prev, [item.id]: prev[item.id] ?? "0" }));
  };

  const isPending = (id) => pendingAdd.some((p) => p.id === id);
  const isAdded = (id) =>
    cartMenuItems.some((m) => m.id === id || m.menuItemId === id);
  const totalSelected = cartMenuItems.length + pendingAdd.length;

  const handleSaveAdditions = async () => {
    if (!pendingAdd.length) return;
    setSaving(true);
    try {
      const items = pendingAdd.map((p) => ({
        id: p.id,
        markup: Number(markupValues[p.id] || 0),
      }));
      await api.post(`/icart/${cart.id}/menu-items`, { items });
      toast.success(
        `${items.length} item${items.length !== 1 ? "s" : ""} added`,
      );
      setPendingAdd([]);
      setMarkupValues({});
      const refreshed = await api.get(`/icart/${cart.id}`);
      const updated = refreshed.data.data;
      setCartMenuItems(updated.menuItems || []);
      onUpdate(updated);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add items");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!confirmRemove) return;
    setRemoving(true);
    try {
      const removeId = confirmRemove.id || confirmRemove.menuItemId;
      await api.delete(`/icart/${cart.id}/menu-items`, {
        data: { ids: [removeId] },
      });
      toast.success("Item removed");
      setConfirmRemove(null);
      setCartMenuItems((prev) =>
        prev.filter(
          (m) => m.id !== confirmRemove.id && m.menuItemId !== confirmRemove.id,
        ),
      );
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove");
    } finally {
      setRemoving(false);
    }
  };

  // ── Paginated/filtered lists ──
  const filteredVendors = vendors.filter(
    (v) =>
      !vendorSearch ||
      v.businessName?.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      v.email?.toLowerCase().includes(vendorSearch.toLowerCase()),
  );
  const vendorTotalPages = Math.max(
    1,
    Math.ceil(filteredVendors.length / VENDOR_PAGE_SIZE),
  );
  const pagedVendors = filteredVendors.slice(
    (vendorPage - 1) * VENDOR_PAGE_SIZE,
    vendorPage * VENDOR_PAGE_SIZE,
  );

  const filteredBrowse = browseItems.filter(
    (m) =>
      !browseSearch ||
      m.name?.toLowerCase().includes(browseSearch.toLowerCase()),
  );
  const browseTotalPages = Math.max(
    1,
    Math.ceil(filteredBrowse.length / MENU_PAGE_SIZE),
  );
  const pagedBrowse = filteredBrowse.slice(
    (browsePage - 1) * MENU_PAGE_SIZE,
    browsePage * MENU_PAGE_SIZE,
  );

  const filteredMenu = vendorMenuItems.filter(
    (m) =>
      !menuSearch || m.name?.toLowerCase().includes(menuSearch.toLowerCase()),
  );
  const menuTotalPages = Math.max(
    1,
    Math.ceil(filteredMenu.length / MENU_PAGE_SIZE),
  );
  const pagedMenu = filteredMenu.slice(
    (menuPage - 1) * MENU_PAGE_SIZE,
    menuPage * MENU_PAGE_SIZE,
  );

  // ── Section header ──
  const sectionHeader = (
    <div className="drawer_section_title" style={{ marginTop: 20 }}>
      <span>Vendor & Menu</span>
      {assignedVendor && phase === "idle" && (
        <button
          className="icart_icon_action_btn"
          style={{ marginLeft: "auto" }}
          onClick={() => {
            setPhase("picking-vendor");
            fetchVendors();
            setVendorSearch("");
            setVendorPage(1);
          }}
        >
          <MdEdit size={14} />
        </button>
      )}
    </div>
  );

  // ── Pagination bar ──
  const Pagination = ({ page, total, setPage }) =>
    total <= 1 ? null : (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          marginTop: 10,
        }}
      >
        <button
          className="biz_icon_btn"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          style={{ width: 28, height: 28 }}
        >
          ‹
        </button>
        <span
          style={{
            fontSize: "0.72rem",
            color: "var(--text-muted)",
            fontWeight: 600,
          }}
        >
          {page} / {total}
        </span>
        <button
          className="biz_icon_btn"
          onClick={() => setPage((p) => Math.min(total, p + 1))}
          disabled={page >= total}
          style={{ width: 28, height: 28 }}
        >
          ›
        </button>
      </div>
    );

  // Invoice modal — always rendered on top regardless of phase
  if (invoiceData) {
    return (
      <InvoicePayModal
        invoice={invoiceData.invoice}
        application={invoiceData.application}
        onPaid={handlePaid}
        onClose={() => setInvoiceData(null)}
      />
    );
  }

  // ─────────────────────────────────────────────────────────────
  // PHASE: idle
  // ─────────────────────────────────────────────────────────────
  if (phase === "idle") {
    const hasMenuItems = cart.menuItems?.length > 0;
    return (
      <>
        {sectionHeader}
        {assignedVendor ? (
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "12px 14px",
              marginBottom: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {assignedVendor.branding?.logo || assignedVendor.brandLogo ? (
                <img
                  src={
                    assignedVendor.branding?.logo || assignedVendor.brandLogo
                  }
                  alt=""
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 9,
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 9,
                    background: "var(--bg-active)",
                    border: "1px solid rgba(203,108,220,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <MdStorefront size={16} style={{ color: "var(--accent)" }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 800,
                    color: "var(--text-heading)",
                  }}
                >
                  {assignedVendor.businessName || assignedVendor.name}
                </div>
                {(assignedVendor.branding?.tagline ||
                  assignedVendor.brandTagline) && (
                  <div
                    style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}
                  >
                    {assignedVendor.branding?.tagline ||
                      assignedVendor.brandTagline}
                  </div>
                )}
              </div>
              <button
                className="app_btn app_btn_confirm"
                style={{
                  height: 32,
                  padding: "0 14px",
                  fontSize: "0.76rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  flexShrink: 0,
                }}
                onClick={openVendorDetail}
              >
                <MdRestaurantMenu size={13} /> Menu
              </button>
            </div>
          </div>
        ) : hasMenuItems ? (
          <div
            style={{
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "10px 13px",
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <MdStorefront
              size={15}
              style={{ color: "var(--text-muted)", flexShrink: 0 }}
            />
            <span
              style={{
                fontSize: "0.78rem",
                color: "var(--text-muted)",
                flex: 1,
              }}
            >
              No vendor profile linked
            </span>
            <button
              className="app_btn app_btn_confirm"
              style={{
                height: 30,
                padding: "0 12px",
                fontSize: "0.74rem",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                flexShrink: 0,
              }}
              onClick={openVendorDetail}
            >
              <MdRestaurantMenu size={13} /> Manage
            </button>
          </div>
        ) : (
          <div
            className="icart_empty_inline"
            style={{ flexDirection: "column", gap: 10, padding: "16px 0" }}
          >
            <MdStorefront size={24} style={{ opacity: 0.3 }} />
            <span>No vendor selected</span>
          </div>
        )}

        {hasMenuItems && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              {cart.menuItems.length} item
              {cart.menuItems.length !== 1 ? "s" : ""} active
            </span>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              ·
            </span>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "var(--accent)",
              }}
            >
              {MAX_MENU_ITEMS - cart.menuItems.length} slot
              {MAX_MENU_ITEMS - cart.menuItems.length !== 1 ? "s" : ""} left
            </span>
          </div>
        )}

        <button
          className="app_btn app_btn_confirm"
          style={{
            height: 36,
            padding: "0 18px",
            fontSize: "0.82rem",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
          onClick={() => {
            setPhase("picking-vendor");
            fetchVendors();
            setVendorSearch("");
            setVendorPage(1);
          }}
        >
          <MdAdd size={15} />{" "}
          {assignedVendor || hasMenuItems ? "Change Vendor" : "Select Vendor"}
        </button>
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // PHASE: picking-vendor
  // ─────────────────────────────────────────────────────────────
  if (phase === "picking-vendor") {
    return (
      <>
        {sectionHeader}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <button
            onClick={() => setPhase("idle")}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "0.78rem",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: 0,
              fontFamily: "inherit",
            }}
          >
            ← Back
          </button>
          <span
            style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "var(--text-heading)",
            }}
          >
            Choose a Vendor
          </span>
        </div>

        <input
          className="modal-input"
          placeholder="Search vendors…"
          value={vendorSearch}
          onChange={(e) => {
            setVendorSearch(e.target.value);
            setVendorPage(1);
          }}
          style={{ marginBottom: 10 }}
        />

        {vendorsLoading ? (
          <div className="drawer_loading">
            <div className="page_loader_spinner" />
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {pagedVendors.length === 0 ? (
                <div className="icart_empty_inline">
                  <MdStorefront size={18} style={{ opacity: 0.3 }} />
                  <span>No vendors found</span>
                </div>
              ) : (
                pagedVendors.map((v) => {
                  const isSel = selectedVendor?.id === v.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVendor(isSel ? null : v)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 12px",
                        background: isSel
                          ? "var(--bg-active)"
                          : "var(--bg-hover)",
                        border: `1px solid ${isSel ? "rgba(203,108,220,0.4)" : "var(--border)"}`,
                        borderRadius: 11,
                        cursor: "pointer",
                        transition: "all 0.12s",
                      }}
                    >
                      {v.branding?.logo ? (
                        <img
                          src={v.branding.logo}
                          alt=""
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            objectFit: "cover",
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            background: "var(--bg-card)",
                            border: "1px solid var(--border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <MdStorefront
                            size={14}
                            style={{ color: "var(--text-muted)" }}
                          />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "0.84rem",
                            fontWeight: 700,
                            color: isSel ? "var(--accent)" : "var(--text-body)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {v.businessName}
                        </div>
                        <div
                          style={{
                            fontSize: "0.68rem",
                            color: "var(--text-muted)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {v.email}
                          {v.branding?.tagline
                            ? ` · ${v.branding.tagline}`
                            : ""}
                        </div>
                      </div>
                      {isSel && (
                        <MdVerified
                          size={16}
                          style={{ color: "var(--accent)", flexShrink: 0 }}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <Pagination
              page={vendorPage}
              total={vendorTotalPages}
              setPage={setVendorPage}
            />
          </>
        )}

        {selectedVendor && (
          <div style={{ marginTop: 14 }}>
            <button
              className="app_btn app_btn_confirm"
              style={{
                width: "100%",
                height: 38,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
              onClick={() => fetchBrowseMenu(selectedVendor.id)}
            >
              {browseLoading ? (
                <>
                  <span
                    className="btn_loader"
                    style={{ width: 14, height: 14 }}
                  />{" "}
                  Loading menu…
                </>
              ) : (
                <>
                  <MdRestaurantMenu size={14} /> View{" "}
                  {selectedVendor.businessName} Menu
                </>
              )}
            </button>
          </div>
        )}

        {/* Browse menu modal — shown on top of vendor list */}
        {showBrowseModal && selectedVendor && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              onClick={() => setShowBrowseModal(false)}
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(3px)",
              }}
            />
            <div
              style={{
                position: "relative",
                zIndex: 1,
                width: "min(440px, 95vw)",
                maxHeight: "80vh",
                background: "var(--bg-card)",
                borderRadius: 18,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
              }}
            >
              {/* Modal header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "16px 18px",
                  borderBottom: "1px solid var(--border)",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "var(--bg-active)",
                    border: "1px solid rgba(203,108,220,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <MdRestaurantMenu
                    size={15}
                    style={{ color: "var(--accent)" }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 800,
                      color: "var(--text-heading)",
                    }}
                  >
                    {selectedVendor.businessName}
                  </div>
                  <div
                    style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}
                  >
                    {browseItems.length} item
                    {browseItems.length !== 1 ? "s" : ""} · preview only
                  </div>
                </div>
                <button
                  onClick={() => setShowBrowseModal(false)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: "var(--bg-hover)",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                    flexShrink: 0,
                  }}
                >
                  <MdClose size={14} />
                </button>
              </div>

              {/* Search */}
              {browseItems.length > MENU_PAGE_SIZE && (
                <div style={{ padding: "10px 18px 0", flexShrink: 0 }}>
                  <input
                    className="modal-input"
                    placeholder="Search menu…"
                    value={browseSearch}
                    onChange={(e) => {
                      setBrowseSearch(e.target.value);
                      setBrowsePage(1);
                    }}
                    style={{ marginBottom: 0 }}
                  />
                </div>
              )}

              {/* Items list */}
              <div style={{ overflowY: "auto", flex: 1, padding: "10px 18px" }}>
                {browseLoading ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      padding: "24px 0",
                    }}
                  >
                    <div className="page_loader_spinner" />
                  </div>
                ) : pagedBrowse.length === 0 ? (
                  <div className="icart_empty_inline">
                    <MdRestaurantMenu size={18} style={{ opacity: 0.3 }} />
                    <span>No items found</span>
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {pagedBrowse.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "9px 12px",
                            background: "var(--bg-hover)",
                            border: "1px solid var(--border)",
                            borderRadius: 10,
                          }}
                        >
                          {item.image ? (
                            <img
                              src={item.image}
                              alt=""
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 8,
                                objectFit: "cover",
                                flexShrink: 0,
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 8,
                                background: "var(--bg-card)",
                                border: "1px solid var(--border)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <MdRestaurantMenu
                                size={14}
                                style={{ color: "var(--text-muted)" }}
                              />
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: "0.83rem",
                                fontWeight: 700,
                                color: "var(--text-body)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.name}
                            </div>
                            {item.description && (
                              <div
                                style={{
                                  fontSize: "0.68rem",
                                  color: "var(--text-muted)",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {item.description}
                              </div>
                            )}
                          </div>
                          {item.sellingPrice > 0 && (
                            <div
                              style={{
                                fontSize: "0.78rem",
                                fontWeight: 800,
                                color: "var(--text-heading)",
                                flexShrink: 0,
                              }}
                            >
                              ₦{fmt(item.sellingPrice)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <Pagination
                      page={browsePage}
                      total={browseTotalPages}
                      setPage={setBrowsePage}
                    />
                  </>
                )}
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: "12px 18px",
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                <button
                  className="app_btn app_btn_cancel"
                  style={{ flex: 1, height: 40 }}
                  onClick={() => setShowBrowseModal(false)}
                >
                  Back
                </button>
                <button
                  className="app_btn app_btn_confirm"
                  style={{
                    flex: 2,
                    height: 40,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                  onClick={() => {
                    setShowBrowseModal(false);
                    setPhase("terms");
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // PHASE: terms
  // ─────────────────────────────────────────────────────────────
  if (phase === "terms") {
    const country = cart.location?.country || "";
    return (
      <>
        {sectionHeader}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <button
            onClick={() => setPhase("browse-menu")}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "0.78rem",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: 0,
              fontFamily: "inherit",
            }}
          >
            ← Back
          </button>
          <span
            style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "var(--text-heading)",
            }}
          >
            Terms & Payments
          </span>
        </div>

        {/* Country indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
            padding: "8px 12px",
            background: "var(--bg-hover)",
            border: "1px solid var(--border)",
            borderRadius: 9,
          }}
        >
          <MdLocationOn
            size={14}
            style={{ color: "var(--accent)", flexShrink: 0 }}
          />
          <span
            style={{
              fontSize: "0.78rem",
              color: "var(--text-body)",
              fontWeight: 600,
            }}
          >
            {country || "No location set on this iCart"}
          </span>
        </div>

        {termsLoading && (
          <div className="drawer_loading">
            <div className="page_loader_spinner" />
          </div>
        )}

        {!termsLoading && !termsData && (
          <div
            className="icart_empty_inline"
            style={{ flexDirection: "column", gap: 8, padding: "16px 0" }}
          >
            <span
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                textAlign: "center",
              }}
            >
              {country
                ? `No vendor settings found for ${country}. An admin needs to add settings for this country.`
                : "Set a location on this iCart first to load terms."}
            </span>
          </div>
        )}

        {termsData && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {termsData.payments?.length > 0 && (
              <div
                style={{
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border)",
                  borderRadius: 11,
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    fontSize: "0.62rem",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--text-muted)",
                    marginBottom: 10,
                  }}
                >
                  Payment Schedule
                </div>
                {termsData.payments.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      paddingBottom: i < termsData.payments.length - 1 ? 8 : 0,
                      marginBottom: i < termsData.payments.length - 1 ? 8 : 0,
                      borderBottom:
                        i < termsData.payments.length - 1
                          ? "1px solid var(--border)"
                          : "none",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          color: "var(--text-body)",
                          marginBottom: 2,
                        }}
                      >
                        {p.title}
                      </div>
                      {p.description && (
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {p.description}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 5, marginTop: 4 }}>
                        {p.recurring && (
                          <span
                            style={{
                              fontSize: "0.62rem",
                              fontWeight: 700,
                              padding: "1px 6px",
                              borderRadius: 4,
                              background: "rgba(59,130,246,0.1)",
                              color: "#3b82f6",
                              border: "1px solid rgba(59,130,246,0.25)",
                            }}
                          >
                            Recurring
                          </span>
                        )}
                        {p.refundable && (
                          <span
                            style={{
                              fontSize: "0.62rem",
                              fontWeight: 700,
                              padding: "1px 6px",
                              borderRadius: 4,
                              background: "rgba(34,197,94,0.1)",
                              color: "#16a34a",
                              border: "1px solid rgba(34,197,94,0.25)",
                            }}
                          >
                            Refundable
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 900,
                        color: "var(--accent)",
                        flexShrink: 0,
                      }}
                    >
                      {termsData.currency} {fmt(p.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {termsData.terms && (
              <div
                style={{
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border)",
                  borderRadius: 11,
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    fontSize: "0.62rem",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--text-muted)",
                    marginBottom: 8,
                  }}
                >
                  Terms & Conditions
                </div>
                <div
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--text-body)",
                    lineHeight: 1.65,
                    maxHeight: 160,
                    overflowY: "auto",
                    paddingRight: 4,
                  }}
                >
                  {termsData.terms}
                </div>
              </div>
            )}

            {/* Accept checkbox — prominent */}
            <button
              onClick={() => setTermsAccepted((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: termsAccepted
                  ? "var(--bg-active)"
                  : "var(--bg-hover)",
                border: `2px solid ${termsAccepted ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 12,
                padding: "12px 14px",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 7,
                  border: `2px solid ${termsAccepted ? "var(--accent)" : "var(--border)"}`,
                  background: termsAccepted ? "var(--accent)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.15s",
                }}
              >
                {termsAccepted && (
                  <MdVerified size={14} style={{ color: "#fff" }} />
                )}
              </div>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: termsAccepted ? "var(--accent)" : "var(--text-body)",
                  }}
                >
                  I agree to the terms and conditions
                </div>
                <div
                  style={{
                    fontSize: "0.68rem",
                    color: "var(--text-muted)",
                    marginTop: 2,
                  }}
                >
                  For {termsData.country} · {termsData.currency}
                </div>
              </div>
            </button>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="app_btn app_btn_cancel"
                style={{ flex: 1, height: 42 }}
                onClick={() => setPhase("picking-vendor")}
                disabled={confirming}
              >
                Back
              </button>
              <button
                className={`app_btn app_btn_confirm${confirming ? " btn_loading" : ""}`}
                style={{
                  flex: 2,
                  height: 42,
                  position: "relative",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
                onClick={handleConfirm}
                disabled={confirming}
              >
                <span className="btn_text">
                  Confirm — {selectedVendor?.businessName}
                </span>
                {confirming && (
                  <span
                    className="btn_loader"
                    style={{ width: 14, height: 14 }}
                  />
                )}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // PHASE: vendor-detail (manage menus)
  // ─────────────────────────────────────────────────────────────
  if (phase === "vendor-detail") {
    const activeVendorName =
      assignedVendor?.businessName ||
      (cartMenuItems[0] && "Vendor") ||
      "Vendor";
    const atLimit = totalSelected >= MAX_MENU_ITEMS;

    return (
      <>
        {sectionHeader}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <button
            onClick={() => {
              setPhase("idle");
              setPendingAdd([]);
              setMarkupValues({});
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "0.78rem",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: 0,
              fontFamily: "inherit",
            }}
          >
            ← Back
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "0.88rem",
                fontWeight: 800,
                color: "var(--text-heading)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {activeVendorName}
            </div>
          </div>
          <div
            style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              padding: "3px 9px",
              borderRadius: 999,
              background: atLimit ? "rgba(239,68,68,0.1)" : "var(--bg-active)",
              color: atLimit ? "#ef4444" : "var(--accent)",
              border: `1px solid ${atLimit ? "rgba(239,68,68,0.25)" : "rgba(203,108,220,0.25)"}`,
              flexShrink: 0,
            }}
          >
            {totalSelected}/{MAX_MENU_ITEMS}
          </div>
        </div>

        {/* Active items */}
        {cartMenuItems.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: "0.62rem",
                fontWeight: 900,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: 8,
              }}
            >
              Active Items
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {cartMenuItems.map((item) => {
                const name = item.name || item.menuItem?.name || "Item";
                const img = item.image || item.menuItem?.image;
                const price =
                  item.sellingPrice || item.menuItem?.sellingPrice || 0;
                return (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 12px",
                      background: "var(--bg-hover)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                    }}
                  >
                    {img ? (
                      <img
                        src={img}
                        alt=""
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 7,
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 7,
                          background: "var(--bg-card)",
                          border: "1px solid var(--border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <MdRestaurantMenu
                          size={13}
                          style={{ color: "var(--text-muted)" }}
                        />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          color: "var(--text-body)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {name}
                      </div>
                      {price > 0 && (
                        <div
                          style={{
                            fontSize: "0.68rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          ₦{fmt(price)}
                        </div>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 999,
                        background: "rgba(34,197,94,0.1)",
                        color: "#16a34a",
                        border: "1px solid rgba(34,197,94,0.25)",
                        flexShrink: 0,
                      }}
                    >
                      Active
                    </span>
                    <button
                      onClick={() => setConfirmRemove(item)}
                      title="Remove"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        background: "rgba(239,68,68,0.06)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        color: "#ef4444",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <MdClose size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add from vendor menu */}
        <div
          style={{
            fontSize: "0.62rem",
            fontWeight: 900,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            marginBottom: 8,
          }}
        >
          Add from Vendor{" "}
          {atLimit && <span style={{ color: "#ef4444" }}>— Limit reached</span>}
        </div>

        {vendorMenuItems.length > MENU_PAGE_SIZE && (
          <input
            className="modal-input"
            placeholder="Search menu…"
            value={menuSearch}
            onChange={(e) => {
              setMenuSearch(e.target.value);
              setMenuPage(1);
            }}
            style={{ marginBottom: 8 }}
          />
        )}

        {menuLoading ? (
          <div className="drawer_loading">
            <div className="page_loader_spinner" />
          </div>
        ) : vendorMenuItems.length === 0 ? (
          <div className="icart_empty_inline">
            <MdRestaurantMenu size={18} style={{ opacity: 0.3 }} />
            <span>No menu items available</span>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {pagedMenu.map((item) => {
                const added = isAdded(item.id);
                const pending = isPending(item.id);
                const disabled = !pending && !added && atLimit;
                return (
                  <div
                    key={item.id}
                    style={{
                      background: pending
                        ? "var(--bg-active)"
                        : "var(--bg-hover)",
                      border: `1px solid ${pending ? "rgba(203,108,220,0.4)" : "var(--border)"}`,
                      borderRadius: 10,
                      overflow: "hidden",
                      opacity: disabled ? 0.45 : 1,
                      transition: "all 0.12s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 12px",
                      }}
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt=""
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 7,
                            objectFit: "cover",
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 7,
                            background: "var(--bg-card)",
                            border: "1px solid var(--border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <MdRestaurantMenu
                            size={13}
                            style={{ color: "var(--text-muted)" }}
                          />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            color: pending
                              ? "var(--accent)"
                              : "var(--text-body)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.name}
                        </div>
                        {item.sellingPrice > 0 && (
                          <div
                            style={{
                              fontSize: "0.68rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            ₦{fmt(item.sellingPrice)}
                          </div>
                        )}
                      </div>
                      {added ? (
                        <span
                          style={{
                            fontSize: "0.62rem",
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 999,
                            background: "rgba(34,197,94,0.1)",
                            color: "#16a34a",
                            border: "1px solid rgba(34,197,94,0.25)",
                            flexShrink: 0,
                          }}
                        >
                          Added
                        </span>
                      ) : (
                        <button
                          onClick={() => !disabled && togglePendingAdd(item)}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 7,
                            background: pending
                              ? "var(--accent)"
                              : "var(--bg-card)",
                            border: `1px solid ${pending ? "var(--accent)" : "var(--border)"}`,
                            color: pending ? "#fff" : "var(--text-muted)",
                            cursor: disabled ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {pending ? (
                            <MdClose size={13} />
                          ) : (
                            <MdAdd size={14} />
                          )}
                        </button>
                      )}
                    </div>
                    {pending && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "0 12px 9px",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "0.66rem",
                            color: "var(--text-muted)",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Markup %
                        </label>
                        <input
                          className="modal-input"
                          type="number"
                          min="0"
                          placeholder="0"
                          value={markupValues[item.id] ?? "0"}
                          onChange={(e) =>
                            setMarkupValues((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          style={{
                            height: 30,
                            fontSize: "0.78rem",
                            marginBottom: 0,
                            flex: 1,
                            maxWidth: 100,
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <Pagination
              page={menuPage}
              total={menuTotalPages}
              setPage={setMenuPage}
            />
          </>
        )}

        {pendingAdd.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <button
              className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
              style={{
                width: "100%",
                height: 40,
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
              onClick={handleSaveAdditions}
              disabled={saving}
            >
              <span className="btn_text">
                Add {pendingAdd.length} Item{pendingAdd.length !== 1 ? "s" : ""}{" "}
                to iCart
              </span>
              {saving && (
                <span
                  className="btn_loader"
                  style={{ width: 14, height: 14 }}
                />
              )}
            </button>
          </div>
        )}

        <Modal
          isOpen={!!confirmRemove}
          onClose={() => setConfirmRemove(null)}
          title="Remove Menu Item"
          description={`Remove "${confirmRemove?.name || confirmRemove?.menuItem?.name}" from this iCart?`}
        >
          <div className="modal-body">
            <div className="modal-footer">
              <button
                className="app_btn app_btn_cancel"
                type="button"
                onClick={() => setConfirmRemove(null)}
              >
                Cancel
              </button>
              <button
                className={`app_btn app_btn_confirm${removing ? " btn_loading" : ""}`}
                style={{
                  background: "#ef4444",
                  position: "relative",
                  minWidth: 110,
                }}
                onClick={handleRemove}
                disabled={removing}
              >
                <span className="btn_text">Remove</span>
                {removing && (
                  <span
                    className="btn_loader"
                    style={{ width: 14, height: 14 }}
                  />
                )}
              </button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  return null;
}

/* ── Main Component ─────────────────────────────────────────── */
export default function IcartOverview({ cart, onUpdate, onRefresh }) {
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [togglingLock, setTogglingLock] = useState(false);
  const [editingRadius, setEditingRadius] = useState(false);
  const [radius, setRadius] = useState(cart.serviceRadius || "");
  const [savingRadius, setSavingRadius] = useState(false);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [showLiveStream, setShowLiveStream] = useState(false);

  const handleToggleOnline = async () => {
    setTogglingOnline(true);
    try {
      const res = await api.patch(`/icart/${cart.id}/status/online`);
      onUpdate({
        ...cart,
        isOnline: res.data.data?.isOnline ?? !cart.isOnline,
      });
      toast.success(`Cart is now ${!cart.isOnline ? "online" : "offline"}`);
    } catch {
      toast.error("Failed to toggle online status");
    } finally {
      setTogglingOnline(false);
    }
  };

  const handleToggleLock = async () => {
    setTogglingLock(true);
    try {
      const res = await api.patch(`/icart/${cart.id}/status/lock`);
      onUpdate({
        ...cart,
        isLocked: res.data.data?.isLocked ?? !cart.isLocked,
      });
      toast.success(`Cart is now ${!cart.isLocked ? "locked" : "unlocked"}`);
    } catch {
      toast.error("Failed to toggle lock status");
    } finally {
      setTogglingLock(false);
    }
  };

  const handleSaveRadius = async () => {
    if (!radius || isNaN(radius)) return toast.error("Enter a valid radius");
    setSavingRadius(true);
    try {
      await api.patch(`/icart/service-radius/${cart.id}`, {
        serviceRadius: Number(radius),
      });
      onUpdate({ ...cart, serviceRadius: Number(radius) });
      toast.success("Service radius updated");
      setEditingRadius(false);
    } catch {
      toast.error("Failed to update radius");
    } finally {
      setSavingRadius(false);
    }
  };

  const handleAddConcept = async () => {
    if (!selectedConceptId) return toast.error("Select a concept");
    if (!markup || isNaN(markup)) return toast.error("Enter a valid markup");
    setAddingConcept(true);
    try {
      await api.post(`/icart/${cart.id}/concepts/add`, {
        id: selectedConceptId,
        markup: Number(markup),
      });
      toast.success("Concept added");
      setShowConceptForm(false);
      setSelectedConceptId("");
      setMarkup("");
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add concept");
    } finally {
      setAddingConcept(false);
    }
  };

  const handleLocationSaved = (newLocation) => {
    setShowLocationForm(false);
    onUpdate({ ...cart, location: newLocation });
  };
  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : null;

  return (
    <div className="icart_tab_content">
      {/* ── Kitchen Controls ── */}
      <div className="drawer_section_title">Kitchen Controls</div>
      <div className="icart_toggles_block">
        <ToggleRow
          icon={cart.isOnline ? <MdWifi size={15} /> : <MdWifiOff size={15} />}
          label="Online Status"
          value={cart.isOnline}
          loading={togglingOnline}
          onToggle={handleToggleOnline}
        />
        <ToggleRow
          icon={cart.isLocked ? <MdLock size={15} /> : <MdLockOpen size={15} />}
          label="Kitchen Lock"
          value={cart.isLocked}
          loading={togglingLock}
          onToggle={handleToggleLock}
        />
        {/* Live Stream row */}
        <div
          className="icart_toggle_row"
          style={{ cursor: "pointer" }}
          onClick={() => setShowLiveStream(true)}
        >
          <div className="icart_toggle_left">
            <span className="profile_phone_date_icon">
              <MdVideocam size={15} />
            </span>
            <span className="icart_toggle_label">Live Stream</span>
          </div>
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              padding: "3px 9px",
              borderRadius: 999,
              background: "rgba(107,114,128,0.1)",
              color: "#6b7280",
              border: "1px solid rgba(107,114,128,0.2)",
            }}
          >
            View
          </span>
        </div>
      </div>

      {/* ── Service Radius ── */}
      <div className="drawer_section_title" style={{ marginTop: 20 }}>
        Service Radius
      </div>
      <div className="icart_radius_block">
        <div className="icart_radius_row">
          <span className="profile_phone_date_icon">
            <MdSignalCellularAlt size={15} />
          </span>
          <span className="icart_toggle_label">Radius</span>
          {editingRadius ? (
            <div className="icart_radius_edit">
              <input
                className="modal-input"
                style={{
                  width: 90,
                  height: 34,
                  padding: "0 10px",
                  fontSize: "0.82rem",
                }}
                type="number"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                placeholder="km"
              />
              <button
                className={`app_btn app_btn_confirm ${savingRadius ? "btn_loading" : ""}`}
                style={{ height: 34, padding: "0 14px", fontSize: "0.78rem" }}
                onClick={handleSaveRadius}
                disabled={savingRadius}
              >
                <span className="btn_text">Save</span>
                {savingRadius && (
                  <span
                    className="btn_loader"
                    style={{ width: 14, height: 14 }}
                  />
                )}
              </button>
              <button
                className="app_btn app_btn_cancel"
                style={{ height: 34, padding: "0 14px", fontSize: "0.78rem" }}
                onClick={() => {
                  setEditingRadius(false);
                  setRadius(cart.serviceRadius || "");
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="icart_radius_display">
              <span className="icart_meta_val">
                {cart.serviceRadius ? (
                  `${cart.serviceRadius} km`
                ) : (
                  <span className="icart_meta_muted">Not set</span>
                )}
              </span>
              <button
                className="icart_icon_action_btn"
                onClick={() => setEditingRadius(true)}
              >
                <MdEdit size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Kitchen Info ── */}
      <div className="drawer_section_title" style={{ marginTop: 20 }}>
        Kitchen Info
      </div>
      <div className="icart_item_meta" style={{ marginBottom: 0 }}>
        <InfoRow label="Serial Number" value={cart.serialNumber} />
        <InfoRow label="Status" value={cart.status} />
        <InfoRow label="Owner" value={cart.owner?.name || cart.owner?.email} />
      </div>

      {/* ── Location ── */}
      <div className="drawer_section_title" style={{ marginTop: 20 }}>
        <span>Location</span>
        <button
          className="icart_icon_action_btn"
          style={{ marginLeft: "auto" }}
          title={cart.location ? "Change location" : "Add location"}
          onClick={() => setShowLocationForm((v) => !v)}
        >
          {cart.location ? <MdEdit size={14} /> : <MdAdd size={15} />}
        </button>
      </div>

      {showLocationForm ? (
        <LocationForm
          cartId={cart.id}
          onSaved={handleLocationSaved}
          onCancel={() => setShowLocationForm(false)}
        />
      ) : cart.location ? (
        <div className="icart_location_card">
          <div className="icart_location_icon_wrap">
            <MdLocationOn size={18} />
          </div>
          <div className="icart_location_info">
            <div className="icart_location_name">{cart.location.name}</div>
            {cart.location.address && (
              <div className="icart_location_address">
                {cart.location.address}
              </div>
            )}
            {(cart.location.lga || cart.location.city) && (
              <div className="icart_location_address">
                {[cart.location.lga, cart.location.city]
                  .filter(Boolean)
                  .join(", ")}
              </div>
            )}
            {cart.location.country && (
              <div className="icart_location_address">
                {cart.location.country}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="icart_empty_inline">
          <MdLocationOn size={18} style={{ opacity: 0.3 }} />
          <span>No location assigned</span>
        </div>
      )}

      {/* ── Vendor & Menu ── */}
      <VendorMenuSection
        cart={cart}
        onUpdate={onUpdate}
        onRefresh={onRefresh}
      />

      {/* ── Operators ── */}
      <div className="drawer_section_title" style={{ marginTop: 24 }}>
        Operators
        <span className="icart_section_count" style={{ marginLeft: 8 }}>
          {cart.operators?.length || 0}
        </span>
      </div>

      {cart.operators?.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {cart.operators.map((op) => {
            const name =
              op.user?.fullName ||
              op.user?.email ||
              `Operator #${op.id.slice(0, 6).toUpperCase()}`;
            return (
              <div
                key={op.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                }}
              >
                <div
                  className="icart_operator_avatar"
                  style={{ flexShrink: 0 }}
                >
                  {name[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span className="icart_operator_name">{name}</span>
                    {op.isApproved && (
                      <MdVerified
                        size={14}
                        style={{ color: "#16a34a", flexShrink: 0 }}
                      />
                    )}
                  </div>
                  <div className="icart_operator_meta">
                    {op.user?.email && <span>{op.user.email}</span>}
                    {op.state?.name && (
                      <span style={{ marginLeft: op.user?.email ? 6 : 0 }}>
                        {op.user?.email ? "· " : ""}
                        {op.state.name}
                      </span>
                    )}
                    {op.certification && (
                      <span style={{ marginLeft: 6 }}>
                        · {op.certification}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    padding: "3px 9px",
                    borderRadius: 999,
                    flexShrink: 0,
                    ...(op.isApproved
                      ? {
                          background: "rgba(34,197,94,0.1)",
                          color: "#16a34a",
                          border: "1px solid rgba(34,197,94,0.25)",
                        }
                      : {
                          background: "rgba(234,179,8,0.1)",
                          color: "#ca8a04",
                          border: "1px solid rgba(234,179,8,0.25)",
                        }),
                  }}
                >
                  {op.isApproved ? "Active" : "Pending"}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="icart_empty_inline">
          <MdPerson size={18} style={{ opacity: 0.3 }} />
          <span>No operators assigned</span>
        </div>
      )}

      {/* ── Modals ── */}
      {showLiveStream && (
        <LiveStreamModal onClose={() => setShowLiveStream(false)} />
      )}
    </div>
  );
}
