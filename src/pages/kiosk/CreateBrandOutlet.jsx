import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  MdArrowBack,
  MdOutlineKitchen,
  MdCloud,
  MdStorefront,
  MdLocationOn,
  MdMyLocation,
  MdFastfood,
  MdCheckCircle,
  MdRadioButtonUnchecked,
  MdAccessTime,
  MdSearch,
  MdAdd,
  MdDone,
  MdInfoOutline,
} from "react-icons/md";
import { LuStore } from "react-icons/lu";
import api from "../../api/axios";
import { useAuth } from "../../contexts/AuthContext";
import useCurrencyDisplay from "../../hooks/useCurrencyDisplay";
import "./Kiosk.css";

const OUTLET_TYPES = [
  {
    id: "KIOSK",
    label: "Physical Kiosk",
    tag: "Standalone Modular Unit",
    icon: LuStore,
    accentColor: "#22c55e",
    accentBg: "rgba(34, 197, 94, 0.1)",
    accentBorder: "rgba(34, 197, 94, 0.25)",
    description:
      "A branded self-contained street, concourse, or event modular kitchen with high foot traffic exposure.",
    features: ["Rapid standalone setup", "Exterior branding presence", "Compact 9m² footprint"],
  },
  {
    id: "CLOUD_KITCHEN",
    label: "Cloud Kitchen",
    tag: "Delivery-Focused Facility",
    icon: MdCloud,
    accentColor: "#6366f1",
    accentBg: "rgba(99, 102, 241, 0.1)",
    accentBorder: "rgba(99, 102, 241, 0.25)",
    description:
      "Production-only dark kitchen located within a shared commercial facility optimized for online delivery orders.",
    features: ["Zero dine-in overhead", "Wide delivery radius", "Shared facility utilities"],
  },
  {
    id: "STORE_FRONT",
    label: "Store Front",
    tag: "Full Retail Dine-In / Takeout",
    icon: MdStorefront,
    accentColor: "#06b6d4",
    accentBg: "rgba(6, 182, 212, 0.1)",
    accentBorder: "rgba(6, 182, 212, 0.25)",
    description:
      "A prominent walk-in dining space with customer ordering counters, sit-down seating, and branded storefront visibility.",
    features: ["Walk-in counter & pickup", "Customer seating area", "High ticket retail presence"],
  },
];

export default function CreateBrandOutlet() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { format: fmtCurrency } = useCurrencyDisplay();

  const vendorId = user?.Vendor?.id || user?.vendorId;
  console.log(user)
  const brandName = user?.Vendor?.businessName || "Your Brand";

  // Step state: 1: Type, 2: Location, 3: Menu, 4: Review
  const [step, setStep] = useState(1);

  // Form State
  const [outletType, setOutletType] = useState("KIOSK");

  // Location Form
  const [states, setStates] = useState([]);
  const [statesLoading, setStatesLoading] = useState(true);
  const [hubLocations, setHubLocations] = useState([]);
  const [loadingHubs, setLoadingHubs] = useState(false);
  const [locationMode, setLocationMode] = useState("custom"); // "custom" | "hub"
  const [selectedHubId, setSelectedHubId] = useState("");

  const [locationForm, setLocationForm] = useState({
    name: "",
    address: "",
    city: "",
    lga: "",
    stateId: "",
    country: "Nigeria",
    latitude: "",
    longitude: "",
    serviceRadius: 5,
    operatingHours: "08:00 - 22:00",
    operatingDays: "Mon - Sun",
  });

  const [detectingGPS, setDetectingGPS] = useState(false);

  // Menu Selection State
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [selectedMenuIds, setSelectedMenuIds] = useState([]);
  const [menuSearch, setMenuSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [menuPriceMap, setMenuPriceMap] = useState({});
  const [loadingPrices, setLoadingPrices] = useState(false);

  // Submitting
  const [submitting, setSubmitting] = useState(false);

  // Load States
  useEffect(() => {
    api
      .get("/config/state")
      .then((res) => {
        const list = res.data.data || [];
        setStates(list);
        if (list.length > 0) {
          setLocationForm((prev) => ({
            ...prev,
            stateId: prev.stateId || list[0].id,
            country: list[0].country || prev.country,
          }));
        }
      })
      .catch((err) => {
        console.error("Failed to load states:", err);
      })
      .finally(() => setStatesLoading(false));
  }, []);

  // Load Hub Locations when stateId or outletType changes for cloud / store front
  useEffect(() => {
    if (outletType === "KIOSK" || !locationForm.stateId) {
      setHubLocations([]);
      return;
    }

    setLoadingHubs(true);
    api
      .get("/kiosk/location", {
        params: {
          stateId: locationForm.stateId,
          outletType: outletType,
        },
      })
      .then((res) => {
        const hubs = res.data.data?.items || res.data.data || [];
        setHubLocations(hubs);
        if (hubs.length > 0 && locationMode === "hub") {
          setSelectedHubId(hubs[0].id);
        }
      })
      .catch(() => setHubLocations([]))
      .finally(() => setLoadingHubs(false));
  }, [outletType, locationForm.stateId]);

  // Load Brand Menu Items
  useEffect(() => {
    if (!vendorId) return;
    setLoadingMenu(true);
    api
      .get("/vendor/menu", {
        params: { vendorId, limit: 100 },
      })
      .then((res) => {
        const items = res.data?.data?.items || res.data?.data || [];
        setMenuItems(items);
        // Default to selecting all menu items
        setSelectedMenuIds(items.map((i) => i.id));
      })
      .catch((err) => {
        console.error("Failed to load brand menu:", err);
        toast.error("Failed to load brand menu items");
      })
      .finally(() => setLoadingMenu(false));
  }, [vendorId]);

  // Fetch pricing for brand menu items using location stateId and useAverage
  useEffect(() => {
    if (!menuItems.length) return;

    const stateId = locationForm.stateId;
    let cancelled = false;
    setLoadingPrices(true);

    Promise.all(
      menuItems.map(async (m) => {
        try {
          const params = {
            useAverage: true,
            ...(stateId ? { stateId } : {}),
            ...(m.variants?.[0]?.id ? { variantId: m.variants[0].id } : {}),
          };
          const res = await api
            .get(`/library/price/menu/${m.id}`, { params })
            .catch(() => null);
          const sellingPrice =
            res?.data?.data?.sellingPrice ?? res?.data?.data?.price ?? null;

          return { id: m.id, price: sellingPrice };
        } catch {
          return { id: m.id, price: null };
        }
      })
    ).then((results) => {
      if (cancelled) return;
      const map = {};
      results.forEach((r) => {
        if (r && r.id) {
          map[r.id] = r.price;
        }
      });
      setMenuPriceMap(map);
      setLoadingPrices(false);
    });

    return () => {
      cancelled = true;
    };
  }, [menuItems, locationForm.stateId]);

  // GPS Auto-Detection Handler
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      return toast.error("Geolocation is not supported by your browser");
    }
    setDetectingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocationForm((p) => ({
          ...p,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
        }));

        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          const geo = await r.json();
          const a = geo.address || {};
          const detectedStateName = a.state || a.province || a.region || "";
          const detectedCityName = a.city || a.town || a.village || a.county || a.state_district || "";
          const fullDisplayName = geo.display_name || "";

          // Smart matching for state from states list
          const clean = (s) =>
            String(s || "")
              .toLowerCase()
              .replace(/state/gi, "")
              .replace(/federal capital territory/gi, "fct abuja")
              .replace(/[^a-z0-9]/g, "");

          let matchedState = null;
          if (states.length > 0) {
            const cleanState = clean(detectedStateName);
            const cleanCity = clean(detectedCityName);
            const cleanDisplay = clean(fullDisplayName);

            // 1. Exact match on cleaned state name or code
            matchedState = states.find((s) => {
              const cs = clean(s.name);
              const cc = clean(s.code);
              return (
                (cs && cleanState && (cs === cleanState || cleanState.includes(cs) || cs.includes(cleanState))) ||
                (cc && cleanState && cc === cleanState)
              );
            });

            // 2. If not matched, try matching against detected city / state_district
            if (!matchedState && cleanCity) {
              matchedState = states.find((s) => {
                const cs = clean(s.name);
                const cc = clean(s.code);
                return (
                  (cs && (cs === cleanCity || cleanCity.includes(cs) || cs.includes(cleanCity))) ||
                  (cc && cc === cleanCity)
                );
              });
            }

            // 3. Special handling for Abuja / FCT
            if (!matchedState) {
              const isFCT =
                cleanDisplay.includes("abuja") ||
                cleanDisplay.includes("fct") ||
                cleanState.includes("fct") ||
                cleanState.includes("abuja") ||
                cleanCity.includes("abuja");
              if (isFCT) {
                matchedState = states.find((s) => {
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

            // 4. Fallback search: any state whose clean name appears in full display_name
            if (!matchedState) {
              matchedState = states.find((s) => {
                const cs = clean(s.name);
                return cs && cs.length >= 3 && cleanDisplay.includes(cs);
              });
            }
          }

          setLocationForm((p) => ({
            ...p,
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6),
            stateId: matchedState ? matchedState.id : p.stateId,
            country: matchedState?.country || p.country,
            name:
              p.name ||
              a.neighbourhood ||
              a.suburb ||
              a.village ||
              a.town ||
              a.city ||
              `${brandName} Outlet`,
            address:
              p.address ||
              [a.road, a.house_number].filter(Boolean).join(" ") ||
              geo.display_name?.split(",")[0] ||
              "",
            city: a.city || a.town || a.village || a.county || p.city || "",
            lga: a.county || a.state_district || a.suburb || p.lga || "",
          }));

          if (matchedState) {
            toast.success(`Location and state (${matchedState.name}) auto-detected!`);
          } else {
            toast.success("Coordinates and address auto-detected!");
          }
        } catch {
          toast.success("GPS coordinates detected!");
        } finally {
          setDetectingGPS(false);
        }
      },
      (err) => {
        setDetectingGPS(false);
        toast.error(err.message || "Unable to acquire location GPS");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Toggle single menu selection
  const toggleMenuItem = (id) => {
    setSelectedMenuIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select / Deselect All
  const handleSelectAllMenu = () => {
    if (selectedMenuIds.length === menuItems.length) {
      setSelectedMenuIds([]);
    } else {
      setSelectedMenuIds(menuItems.map((m) => m.id));
    }
  };

  // Categories list
  const categories = ["ALL", ...new Set(menuItems.map((m) => m.category).filter(Boolean))];

  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch =
      !menuSearch ||
      item.name?.toLowerCase().includes(menuSearch.toLowerCase()) ||
      item.description?.toLowerCase().includes(menuSearch.toLowerCase());
    const matchesCat = selectedCategory === "ALL" || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Step Validation
  const canProceedFromStep1 = Boolean(outletType);

  const canProceedFromStep2 =
    locationMode === "hub"
      ? Boolean(selectedHubId)
      : Boolean(locationForm.name.trim() && locationForm.stateId && locationForm.address.trim());

  const canProceedFromStep3 = selectedMenuIds.length > 0;

  // Final Submission to create brand outlet
  const handleCreateOutlet = async () => {
    if (!vendorId) {
      return toast.error("Brand profile not found for this account");
    }

    if (locationMode === "hub" && !selectedHubId) {
      return toast.error("Please select a hub facility");
    }

    if (locationMode === "custom" && (!locationForm.name.trim() || !locationForm.stateId)) {
      return toast.error("Please provide outlet name and state");
    }

    if (selectedMenuIds.length === 0) {
      return toast.error("Please select at least one menu item for this outlet");
    }

    setSubmitting(true);
    try {
      const payload = {
        outletType,
        locationId: locationMode === "hub" ? selectedHubId : undefined,
        locationData:
          locationMode === "custom"
            ? {
              name: locationForm.name.trim(),
              address: locationForm.address.trim() || locationForm.name.trim(),
              city: locationForm.city.trim(),
              lga: locationForm.lga.trim(),
              stateId: locationForm.stateId,
              country: locationForm.country || "Nigeria",
              latitude: Number(locationForm.latitude) || 0,
              longitude: Number(locationForm.longitude) || 0,
            }
            : undefined,
        menuItemIds: selectedMenuIds,
        serviceRadius: Number(locationForm.serviceRadius) || 5,
        operatingHours: locationForm.operatingHours || "08:00 - 22:00",
        operatingDays: locationForm.operatingDays || "Mon - Sun",
      };

      const res = await api.post("/kiosk/brand-outlet", payload);
      const newOutlet = res.data?.data;

      toast.success(
        `Brand outlet ${newOutlet?.serialNumber || ""} created successfully!`
      );
      navigate(`/app/kiosk-home?kioskId=${newOutlet?.id || ""}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create brand outlet");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTypeInfo = OUTLET_TYPES.find((t) => t.id === outletType) || OUTLET_TYPES[0];
  const selectedStateObj = states.find((s) => s.id === locationForm.stateId);
  const selectedHubObj = hubLocations.find((h) => h.id === selectedHubId);
  const outletCurrency = selectedStateObj?.currency || "NGN";

  return (
    <div className="page_wrapper">
      <div className="create_outlet_wrapper">
        {/* Top Back Navigation */}
        <button
          type="button"
          className="create_outlet_back_btn"
          onClick={() => navigate("/app/kiosk-home")}
        >
          <MdArrowBack size={18} />
          <span>Back to Outlets</span>
        </button>

        {/* Page Title */}
        <div className="create_outlet_header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 800,
                padding: "3px 10px",
                borderRadius: 20,
                background: "var(--bg-active)",
                color: "var(--accent)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Brand Expansion
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {brandName}
            </span>
          </div>
          <h2 className="create_outlet_title">Deploy New Brand Outlet</h2>
          <p className="create_outlet_sub">
            Configure your outlet format, assign location coordinates, and select the active brand menu.
          </p>
        </div>

        {/* Stepper Header */}
        <div className="create_outlet_stepper">
          {[
            { num: 1, label: "Format", fullLabel: "1. Location Type" },
            { num: 2, label: "Location", fullLabel: "2. Location Details" },
            { num: 3, label: "Menu", fullLabel: "3. Brand Menu" },
            { num: 4, label: "Deploy", fullLabel: "4. Review & Deploy" },
          ].map((s) => {
            const isActive = step === s.num;
            const isCompleted = step > s.num;
            return (
              <div
                key={s.num}
                className={`create_outlet_step_item ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""
                  }`}
                onClick={() => {
                  if (s.num < step) setStep(s.num);
                }}
              >
                <div className="create_outlet_step_num">
                  {isCompleted ? <MdDone size={12} /> : s.num}
                </div>
                <span className="step_label_desktop">{s.fullLabel}</span>
                <span className="step_label_mobile">{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* ── STEP 1: SELECT LOCATION TYPE ── */}
        {step === 1 && (
          <div>
            <div style={{ marginBottom: 18 }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: "0 0 6px" }}>
                Choose Outlet Format
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                Select the physical operational format for this brand location.
              </p>
            </div>

            <div className="outlet_types_grid">
              {OUTLET_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = outletType === type.id;
                return (
                  <div
                    key={type.id}
                    className={`outlet_type_card ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      setOutletType(type.id);
                      setStep(2);
                    }}
                  >
                    <div
                      className="outlet_type_icon_wrap"
                      style={{
                        background: type.accentBg,
                        color: type.accentColor,
                        border: `1px solid ${type.accentBorder}`,
                      }}
                    >
                      <Icon size={24} />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <h4 className="outlet_type_name" style={{ margin: 0 }}>
                        {type.label}
                      </h4>
                      {isSelected ? (
                        <MdCheckCircle size={20} color="var(--accent)" />
                      ) : (
                        <MdRadioButtonUnchecked size={20} color="var(--text-muted)" />
                      )}
                    </div>

                    <span
                      style={{
                        display: "inline-block",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        color: type.accentColor,
                        marginBottom: 10,
                        textTransform: "uppercase",
                        letterSpacing: "0.03em",
                      }}
                    >
                      {type.tag}
                    </span>

                    <p className="outlet_type_desc">{type.description}</p>

                    <div
                      style={{
                        borderTop: "1px solid var(--border)",
                        paddingTop: 12,
                        display: "flex",
                        flexDirection: "column",
                        gap: 5,
                      }}
                    >
                      {type.features.map((feat, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: "0.72rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          <span style={{ color: type.accentColor, fontWeight: 900 }}>•</span>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
              <button
                type="button"
                className="kiosk_buy_btn"
                disabled={!canProceedFromStep1}
                onClick={() => setStep(2)}
                style={{
                  padding: "10px 24px",
                  borderRadius: 10,
                  fontSize: "0.85rem",
                  fontWeight: 800,
                }}
              >
                Continue to Location Details →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: LOCATION DETAILS ── */}
        {step === 2 && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: "0 0 6px" }}>
                Provide Location Details for {selectedTypeInfo.label}
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                Specify where this outlet will operate and serve customers.
              </p>
            </div>

            {/* If Cloud Kitchen or Store Front, offer Hub Selection if available */}
            {/* {(outletType === "CLOUD_KITCHEN" || outletType === "STORE_FRONT") && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 20,
                  background: "var(--bg-hover)",
                  padding: 4,
                  borderRadius: 10,
                  width: "fit-content",
                  border: "1px solid var(--border)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setLocationMode("custom")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    border: "none",
                    background: locationMode === "custom" ? "var(--bg-card)" : "transparent",
                    color: locationMode === "custom" ? "var(--text-heading)" : "var(--text-muted)",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Custom Address & Space
                </button>
                <button
                  type="button"
                  onClick={() => setLocationMode("hub")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    border: "none",
                    background: locationMode === "hub" ? "var(--bg-card)" : "transparent",
                    color: locationMode === "hub" ? "var(--text-heading)" : "var(--text-muted)",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Certified Commercial Hubs ({hubLocations.length})
                </button>
              </div>
            )} */}

            {locationMode === "hub" ? (
              <div style={{ marginBottom: 24 }}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, display: "block", marginBottom: 6 }}>
                    Select State
                  </label>
                  <select
                    value={locationForm.stateId}
                    onChange={(e) =>
                      setLocationForm((p) => ({ ...p, stateId: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      maxWidth: 360,
                      padding: "10px",
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                      background: "var(--bg-card)",
                      color: "var(--text-heading)",
                      fontSize: "0.82rem",
                    }}
                  >
                    {states.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.country})
                      </option>
                    ))}
                  </select>
                </div>

                {loadingHubs ? (
                  <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>
                    Loading certified hub facilities...
                  </div>
                ) : hubLocations.length === 0 ? (
                  <div
                    style={{
                      padding: "36px 20px",
                      textAlign: "center",
                      background: "var(--bg-card)",
                      borderRadius: 14,
                      border: "1px dashed var(--border)",
                    }}
                  >
                    <MdLocationOn size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: "0.85rem" }}>
                      No registered hubs found in this state
                    </p>
                    <p style={{ margin: "0 0 14px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      Switch to custom address to enter your own facility premises.
                    </p>
                    <button
                      type="button"
                      onClick={() => setLocationMode("custom")}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        background: "var(--accent)",
                        color: "#fff",
                        border: "none",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Use Custom Address
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
                    {hubLocations.map((hub) => {
                      const isSelected = selectedHubId === hub.id;
                      return (
                        <div
                          key={hub.id}
                          onClick={() => setSelectedHubId(hub.id)}
                          style={{
                            padding: 16,
                            borderRadius: 12,
                            background: "var(--bg-card)",
                            border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border)",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 800 }}>{hub.name}</h4>
                            {isSelected ? (
                              <MdCheckCircle size={18} color="var(--accent)" />
                            ) : (
                              <MdRadioButtonUnchecked size={18} color="var(--text-muted)" />
                            )}
                          </div>
                          <p style={{ margin: "0 0 8px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {hub.address}, {hub.city}
                          </p>
                          <span
                            style={{
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: 4,
                              background: "rgba(34,197,94,0.1)",
                              color: "#16a34a",
                            }}
                          >
                            Hub Verified
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Custom Location Form */
              <div
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 16,
                  padding: "22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <MdLocationOn size={22} color="var(--accent)" />
                    <span style={{ fontWeight: 800, fontSize: "0.95rem" }}>
                      Facility Address & GPS
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    disabled={detectingGPS}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--bg-hover)",
                      color: "var(--text-heading)",
                      fontSize: "0.76rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <MdMyLocation size={15} color="var(--accent)" />
                    {detectingGPS ? "Detecting GPS..." : "Auto-Detect My GPS"}
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: 6 }}>
                      Outlet Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={`e.g. ${brandName} - Wuse II Hub`}
                      value={locationForm.name}
                      onChange={(e) =>
                        setLocationForm((p) => ({ ...p, name: e.target.value }))
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "var(--bg-hover)",
                        color: "var(--text-heading)",
                        fontSize: "0.82rem",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: 6 }}>
                      State *
                    </label>
                    <select
                      value={locationForm.stateId}
                      onChange={(e) =>
                        setLocationForm((p) => ({ ...p, stateId: e.target.value }))
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "var(--bg-hover)",
                        color: "var(--text-heading)",
                        fontSize: "0.82rem",
                        boxSizing: "border-box",
                      }}
                    >
                      {states.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} ({st.country})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: 6 }}>
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Plot 1284, Aminu Kano Crescent, opposite City Park"
                    value={locationForm.address}
                    onChange={(e) =>
                      setLocationForm((p) => ({ ...p, address: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--bg-hover)",
                      color: "var(--text-heading)",
                      fontSize: "0.82rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: 6 }}>
                      City / Area
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Abuja"
                      value={locationForm.city}
                      onChange={(e) =>
                        setLocationForm((p) => ({ ...p, city: e.target.value }))
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "var(--bg-hover)",
                        color: "var(--text-heading)",
                        fontSize: "0.82rem",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: 6 }}>
                      LGA / District
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Municipal"
                      value={locationForm.lga}
                      onChange={(e) =>
                        setLocationForm((p) => ({ ...p, lga: e.target.value }))
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "var(--bg-hover)",
                        color: "var(--text-heading)",
                        fontSize: "0.82rem",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: 6 }}>
                      Delivery Radius (km)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={locationForm.serviceRadius}
                      onChange={(e) =>
                        setLocationForm((p) => ({ ...p, serviceRadius: e.target.value }))
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "var(--bg-hover)",
                        color: "var(--text-heading)",
                        fontSize: "0.82rem",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                <div className="create_outlet_grid_2">
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: 6 }}>
                      Latitude
                    </label>
                    <input
                      type="text"
                      placeholder="9.0765"
                      value={locationForm.latitude}
                      onChange={(e) =>
                        setLocationForm((p) => ({ ...p, latitude: e.target.value }))
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "var(--bg-hover)",
                        color: "var(--text-heading)",
                        fontSize: "0.82rem",
                        boxSizing: "border-box",
                        fontFamily: "monospace",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: 6 }}>
                      Longitude
                    </label>
                    <input
                      type="text"
                      placeholder="7.3986"
                      value={locationForm.longitude}
                      onChange={(e) =>
                        setLocationForm((p) => ({ ...p, longitude: e.target.value }))
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "var(--bg-hover)",
                        color: "var(--text-heading)",
                        fontSize: "0.82rem",
                        boxSizing: "border-box",
                        fontFamily: "monospace",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text-body)",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ← Back
              </button>

              <button
                type="button"
                className="kiosk_buy_btn"
                disabled={!canProceedFromStep2}
                onClick={() => setStep(3)}
                style={{
                  padding: "10px 24px",
                  borderRadius: 10,
                  fontSize: "0.85rem",
                  fontWeight: 800,
                }}
              >
                Continue to Menu Selection →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: SELECT BRAND MENU ── */}
        {step === 3 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: "0 0 6px" }}>
                  Select Brand Menu Items for this Outlet
                </h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                  Choose which dishes, beverages, and items from {brandName} will be available for sale here.
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)" }}>
                  {selectedMenuIds.length} of {menuItems.length} selected
                </span>
                <button
                  type="button"
                  onClick={handleSelectAllMenu}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--bg-hover)",
                    color: "var(--accent)",
                    fontSize: "0.76rem",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {selectedMenuIds.length === menuItems.length ? "Deselect All" : "Select All"}
                </button>
              </div>
            </div>

            {/* Search and Category Filter */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <div
                style={{
                  flexGrow: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 10,
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                }}
              >
                <MdSearch size={18} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search brand menu items..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "var(--text-heading)",
                    fontSize: "0.82rem",
                    width: "100%",
                    outline: "none",
                  }}
                />
              </div>

              {categories.length > 2 && (
                <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: selectedCategory === cat ? "1px solid var(--accent)" : "1px solid var(--border)",
                        background: selectedCategory === cat ? "var(--bg-active)" : "var(--bg-card)",
                        color: selectedCategory === cat ? "var(--accent)" : "var(--text-muted)",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Menu Items Grid */}
            {loadingMenu ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                Loading your brand menu catalog...
              </div>
            ) : menuItems.length === 0 ? (
              <div
                style={{
                  padding: "48px 20px",
                  textAlign: "center",
                  background: "var(--bg-card)",
                  borderRadius: 16,
                  border: "1px dashed var(--border)",
                }}
              >
                <MdFastfood size={36} style={{ opacity: 0.3, marginBottom: 10 }} />
                <h4 style={{ margin: "0 0 6px", fontSize: "0.95rem", fontWeight: 800 }}>
                  No Menu Items Found for {brandName}
                </h4>
                <p style={{ margin: "0 0 16px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  Create menu items in your Brand Business dashboard first to deploy them to outlets.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/app/business")}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 8,
                    background: "var(--accent)",
                    color: "#fff",
                    border: "none",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Go to Menu Management
                </button>
              </div>
            ) : filteredMenuItems.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>
                No items match your search.
              </div>
            ) : (
              <div className="brand_menu_grid">
                {filteredMenuItems.map((item) => {
                  const isSelected = selectedMenuIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`brand_menu_card ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleMenuItem(item.id)}
                    >
                      <div className="brand_menu_img_wrap">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="brand_menu_img" />
                        ) : (
                          <MdFastfood size={28} style={{ opacity: 0.2 }} />
                        )}
                        <div className="brand_menu_check_wrap">
                          {isSelected ? (
                            <MdCheckCircle size={18} color="#22c55e" />
                          ) : (
                            <MdRadioButtonUnchecked size={18} color="#ffffff" />
                          )}
                        </div>
                      </div>

                      <div className="brand_menu_body">
                        <span className="brand_menu_cat">{item.category || "General"}</span>
                        <h5 className="brand_menu_title" title={item.name}>
                          {item.name}
                        </h5>
                        <span className="brand_menu_price">
                          {loadingPrices && menuPriceMap[item.id] === undefined ? (
                            <span style={{ fontSize: "0.72rem", opacity: 0.6 }}>Calculating...</span>
                          ) : menuPriceMap[item.id] != null ? (
                            fmtCurrency(menuPriceMap[item.id], outletCurrency)
                          ) : item.price || item.basePrice ? (
                            fmtCurrency(item.price || item.basePrice, outletCurrency)
                          ) : (
                            <span style={{ fontSize: "0.72rem", opacity: 0.5 }}>Price N/A</span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text-body)",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ← Back
              </button>

              <button
                type="button"
                className="kiosk_buy_btn"
                disabled={!canProceedFromStep3}
                onClick={() => setStep(4)}
                style={{
                  padding: "10px 24px",
                  borderRadius: 10,
                  fontSize: "0.85rem",
                  fontWeight: 800,
                }}
              >
                Review & Deploy Outlet →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: REVIEW & CREATE ── */}
        {step === 4 && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: "0 0 6px" }}>
                Review & Confirm Deployment
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                Verify your outlet specifications and deploy it directly to your brand network.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 16,
                marginBottom: 24,
              }}
            >
              {/* Card 1: Format & Location */}
              <div
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 16,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)" }}>
                    Outlet Specification
                  </span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      padding: "3px 10px",
                      borderRadius: 12,
                      background: selectedTypeInfo.accentBg,
                      color: selectedTypeInfo.accentColor,
                    }}
                  >
                    {selectedTypeInfo.label}
                  </span>
                </div>

                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: "1rem", fontWeight: 800 }}>
                    {locationMode === "hub"
                      ? selectedHubObj?.name || "Hub Facility"
                      : locationForm.name || "Brand Outlet"}
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    {locationMode === "hub"
                      ? `${selectedHubObj?.address}, ${selectedHubObj?.city}`
                      : `${locationForm.address}, ${locationForm.city || ""} ${selectedStateObj?.name || ""}`}
                  </p>
                </div>

                <div
                  style={{
                    borderTop: "1px solid var(--border)",
                    paddingTop: 10,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    fontSize: "0.75rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>State:</span>
                    <span style={{ fontWeight: 700 }}>{selectedStateObj?.name || "Nigeria"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Service Radius:</span>
                    <span style={{ fontWeight: 700 }}>{locationForm.serviceRadius} km</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Operating Hours:</span>
                    <span style={{ fontWeight: 700 }}>{locationForm.operatingHours}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Brand Menus Selected */}
              <div
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 16,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)" }}>
                    Brand Catalog
                  </span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      padding: "3px 10px",
                      borderRadius: 12,
                      background: "rgba(34, 197, 94, 0.1)",
                      color: "#16a34a",
                    }}
                  >
                    {selectedMenuIds.length} Menu Items Active
                  </span>
                </div>

                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: "1rem", fontWeight: 800 }}>
                    {brandName}
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    These items will immediately become orderable when this outlet goes live.
                  </p>
                </div>

                <div
                  style={{
                    borderTop: "1px solid var(--border)",
                    paddingTop: 10,
                    maxHeight: 110,
                    overflowY: "auto",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                  }}
                >
                  {menuItems
                    .filter((m) => selectedMenuIds.includes(m.id))
                    .map((item) => (
                      <span
                        key={item.id}
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: "var(--bg-hover)",
                          border: "1px solid var(--border)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <span>{item.name}</span>
                        {menuPriceMap[item.id] != null && (
                          <span style={{ color: "var(--accent)", fontSize: "0.68rem" }}>
                            ({fmtCurrency(menuPriceMap[item.id], outletCurrency)})
                          </span>
                        )}
                      </span>
                    ))}
                </div>
              </div>
            </div>

            {/* Ready to Deploy Notice */}
            <div
              style={{
                padding: "14px 16px",
                borderRadius: 12,
                background: "linear-gradient(135deg, rgba(203,108,220,0.08) 0%, rgba(6,182,212,0.08) 100%)",
                border: "1px solid rgba(203,108,220,0.25)",
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 24,
              }}
            >
              <MdInfoOutline size={22} color="var(--accent)" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--text-heading)" }}>
                  Instant Brand Outlet Creation
                </div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                  As the brand owner, your outlet will be generated immediately with active status and assigned to your business account.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setStep(3)}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text-body)",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ← Back
              </button>

              <button
                type="button"
                className="kiosk_franchise_add_btn"
                disabled={submitting}
                onClick={handleCreateOutlet}
                style={{
                  width: "auto",
                  padding: "12px 28px",
                  borderRadius: 12,
                  fontSize: "0.88rem",
                  fontWeight: 800,
                  gap: 8,
                }}
              >
                <MdAdd size={20} />
                <span>{submitting ? "Deploying Outlet..." : "Create Outlet"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
