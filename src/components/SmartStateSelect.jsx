import React, { useState, useEffect, useRef } from "react";
import api from "../api/axios";

/**
 * Utility function to match a state from geographic location data against a list of states.
 * Can be imported and used standalone anywhere in the application.
 *
 * @param {Object|string} locationData - Nominatim address object, reverse-geocode response, or string
 * @param {Array} states - List of registered states with { id, name, code, country, ... }
 * @returns {Object|null} The matched state object or null if no match found.
 */
export function matchStateFromLocation(locationData, states = []) {
  if (!locationData || !Array.isArray(states) || states.length === 0) return null;

  let stateName = "";
  let cityName = "";
  let districtName = "";
  let fullDisplay = "";

  if (typeof locationData === "string") {
    fullDisplay = locationData;
    stateName = locationData;
  } else if (typeof locationData === "object") {
    const a = locationData.address || locationData;
    stateName = a.state || a.province || a.region || locationData.state || "";
    cityName =
      a.city ||
      a.town ||
      a.village ||
      a.municipality ||
      a.county ||
      locationData.city ||
      "";
    districtName =
      a.state_district ||
      a.suburb ||
      a.lga ||
      a.neighbourhood ||
      locationData.lga ||
      "";
    fullDisplay =
      locationData.display_name ||
      locationData.formatted_address ||
      [a.road, cityName, districtName, stateName].filter(Boolean).join(", ");
  }

  const clean = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/state/gi, "")
      .replace(/federal capital territory/gi, "fct abuja")
      .replace(/[^a-z0-9]/g, "");

  const cleanState = clean(stateName);
  const cleanCity = clean(cityName);
  const cleanDistrict = clean(districtName);
  const cleanDisplay = clean(fullDisplay);

  // 1. Direct match on state name or state code
  let matched = states.find((s) => {
    const cs = clean(s.name);
    const cc = clean(s.code);
    return (
      (cs && cleanState && (cs === cleanState || cleanState.includes(cs) || cs.includes(cleanState))) ||
      (cc && cleanState && cc === cleanState)
    );
  });

  // 2. City or district match against state name or state code
  if (!matched && (cleanCity || cleanDistrict)) {
    matched = states.find((s) => {
      const cs = clean(s.name);
      const cc = clean(s.code);
      return (
        (cleanCity && cs && (cs === cleanCity || cleanCity.includes(cs) || cs.includes(cleanCity))) ||
        (cleanCity && cc && cc === cleanCity) ||
        (cleanDistrict && cs && (cs === cleanDistrict || cleanDistrict.includes(cs) || cs.includes(cleanDistrict))) ||
        (cleanDistrict && cc && cc === cleanDistrict)
      );
    });
  }

  // 3. Special handling for Abuja / FCT
  if (!matched) {
    const isFCT =
      cleanDisplay.includes("abuja") ||
      cleanDisplay.includes("fct") ||
      cleanState.includes("fct") ||
      cleanState.includes("abuja") ||
      cleanCity.includes("abuja") ||
      cleanDistrict.includes("abuja");

    if (isFCT) {
      matched = states.find((s) => {
        const cs = clean(s.name);
        const cc = clean(s.code);
        return (
          cs.includes("abuja") ||
          cs.includes("fct") ||
          cc === "abj" ||
          cc === "fct"
        );
      });
    }
  }

  // 4. Substring search across full formatted address
  if (!matched && cleanDisplay) {
    matched = states.find((s) => {
      const cs = clean(s.name);
      return cs && cs.length >= 3 && cleanDisplay.includes(cs);
    });
  }

  return matched || null;
}

/**
 * SmartStateSelect Component
 *
 * Renders a state select input that receives location data (e.g. from GPS or geocoding)
 * and automatically selects the corresponding state.
 *
 * Props:
 * - value: string (selected stateId)
 * - onChange: function(eOrId, matchedStateObj) - triggered on manual or auto selection
 * - locationData: object|string - address/geocoding data to match against
 * - states: array (optional) - pre-loaded list of states from parent. If omitted, fetches /config/state
 * - allowAutoSelect: boolean (default true) - whether to auto-select upon matching locationData
 * - onStateDetected: function(matchedState) - optional callback when state is auto-matched
 * - showMatchBadge: boolean (default true) - displays a subtle badge indicating auto-matched status
 * - label: string (optional) - input label text
 * - placeholder: string (default "Select State")
 * - disabled: boolean
 * - required: boolean
 * - className: string
 * - style: object
 */
export default function SmartStateSelect({
  value = "",
  onChange,
  locationData = null,
  states: externalStates = null,
  allowAutoSelect = true,
  onStateDetected = null,
  showMatchBadge = true,
  label = null,
  placeholder = "Select State",
  disabled = false,
  required = false,
  className = "",
  style = {},
  selectStyle = {},
  name = "stateId",
  id,
}) {
  const [internalStates, setInternalStates] = useState([]);
  const [loading, setLoading] = useState(!externalStates);
  const [autoMatchedState, setAutoMatchedState] = useState(null);
  const lastMatchedIdRef = useRef(null);

  const availableStates = externalStates || internalStates;

  // Fetch states if not supplied externally
  useEffect(() => {
    if (externalStates) return;

    let mounted = true;
    setLoading(true);
    api
      .get("/config/state")
      .then((res) => {
        if (!mounted) return;
        const list = res.data?.data || [];
        setInternalStates(list);
      })
      .catch((err) => {
        console.error("SmartStateSelect: Failed to fetch states", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [externalStates]);

  // Handle smart state detection when locationData or availableStates change
  useEffect(() => {
    if (!allowAutoSelect || !locationData || availableStates.length === 0) {
      return;
    }

    const matched = matchStateFromLocation(locationData, availableStates);

    if (matched && matched.id !== lastMatchedIdRef.current) {
      lastMatchedIdRef.current = matched.id;
      setAutoMatchedState(matched);

      if (onStateDetected) {
        onStateDetected(matched);
      }

      if (onChange && matched.id !== value) {
        // Construct standard event object for compatibility with both (e) => setForm(e.target.value) and (id) => setId(id)
        const syntheticEvent = {
          target: { name, value: matched.id },
          currentTarget: { name, value: matched.id },
        };
        onChange(syntheticEvent, matched);
      }
    }
  }, [locationData, availableStates, allowAutoSelect, value, onChange, onStateDetected, name]);

  const handleSelectChange = (e) => {
    const selectedId = e.target.value;
    const matched = availableStates.find((s) => s.id === selectedId) || null;
    setAutoMatchedState(null); // User manually intervened

    if (onChange) {
      onChange(e, matched);
    }
  };

  const isAutoMatched =
    autoMatchedState && autoMatchedState.id === value && showMatchBadge;

  return (
    <div
      className={`smart_state_select_wrapper ${className}`}
      style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}
    >
      {label && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label
            htmlFor={id}
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--text-heading)",
            }}
          >
            {label} {required && <span style={{ color: "var(--error, #ef4444)" }}>*</span>}
          </label>

          {isAutoMatched && (
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                color: "#16a34a",
                background: "rgba(34, 197, 94, 0.1)",
                padding: "2px 8px",
                borderRadius: 12,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              ✓ Auto-detected
            </span>
          )}
        </div>
      )}

      <select
        id={id}
        name={name}
        value={value}
        disabled={disabled || loading}
        required={required}
        onChange={handleSelectChange}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: 8,
          border: isAutoMatched
            ? "1px solid rgba(34, 197, 94, 0.5)"
            : "1px solid var(--border)",
          background: "var(--bg-hover)",
          color: "var(--text-heading)",
          fontSize: "0.82rem",
          boxSizing: "border-box",
          outline: "none",
          transition: "border-color 0.2s ease",
          ...selectStyle,
        }}
      >
        <option value="" disabled>
          {loading ? "Loading states..." : placeholder}
        </option>
        {availableStates.map((st) => (
          <option key={st.id} value={st.id}>
            {st.name} {st.country ? `(${st.country})` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
