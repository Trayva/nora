import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { useAuth } from "../../contexts/AuthContext";
import ESignDrawer from "../../components/ESignDrawer";
import RoyaltyBadge from "./franchise/RoyaltyBadge";
import BrandMenuSelector from "./franchise/BrandMenuSelector";
import FranchiseMenuDrawer from "./franchise/FranchiseMenuDrawer";
import ProfitProjectionDrawer from "./franchise/ProfitProjectionDrawer";
import BrandExpandedConfig from "./franchise/BrandExpandedConfig";
import useFranchisePlan from "./franchise/useFranchisePlan";
import MapPicker from "./MapPicker";
import {
  MdStorefront,
  MdLocationOn,
  MdOutlineReceiptLong,
  MdArrowBack,
  MdArrowForward,
  MdInfoOutline,
  MdCheck,
  MdImage,
  MdZoomIn,
  MdClose,
  MdTrendingUp,
} from "react-icons/md";
import { LuStore, LuCloud, LuChevronDown } from "react-icons/lu";
import useCurrencyDisplay from "../../hooks/useCurrencyDisplay";

// Safe helper to parse bills from JSON string or array
const parseBills = (bills) => {
  if (!bills) return [];
  if (Array.isArray(bills)) return bills;
  if (typeof bills === "string") {
    try {
      const parsed = JSON.parse(bills);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

// Safe helper to parse images
const parseImages = (images) => {
  if (!images) return [];
  if (Array.isArray(images)) return images.filter(Boolean);
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [images];
    } catch {
      return [images];
    }
  }
  return [];
};

export default function BuyFranchiseSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { format: fmt, isConverted } = useCurrencyDisplay();

  // Steps: 1 = Location & Outlet Type, 2 = Select Brand, 3 = Review & Submit
  const [step, setStep] = useState(1);

  // Step 1: Location Form State (for Kiosk)
  const [locationForm, setLocationForm] = useState({
    name: "",
    address: "",
    city: "",
    lga: "",
    stateId: "",
    stateName: "",
    country: "Nigeria",
    latitude: "",
    longitude: "",
    outletType: "KIOSK", // "KIOSK" | "CLOUD_KITCHEN"
    notes: "",
  });

  const [states, setStates] = useState([]);
  const [statesLoading, setStatesLoading] = useState(true);
  const [detectingGPS, setDetectingGPS] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // Cloud Kitchen Specific State
  const [cloudStateId, setCloudStateId] = useState("");
  const [cloudLocations, setCloudLocations] = useState([]);
  const [loadingCloudLocations, setLoadingCloudLocations] = useState(false);
  const [selectedCloudLocation, setSelectedCloudLocation] = useState(null);
  const [previewModalImage, setPreviewModalImage] = useState(null);

  // Step 2: Brands & Menus
  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [salesFormulas, setSalesFormulas] = useState([]);
  const [expandedBrandId, setExpandedBrandId] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [brandMenuItems, setBrandMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [selectedMenuIds, setSelectedMenuIds] = useState([]);
  const [activeMenu, setActiveMenu] = useState(null);
  const [royaltyPercent, setRoyaltyPercent] = useState(null);
  const [loadingRoyalty, setLoadingRoyalty] = useState(false);
  const [menuCostMap, setMenuCostMap] = useState({});
  const [loadingCosts, setLoadingCosts] = useState(false);

  // Slots & Country Settings
  const [availableSlots, setAvailableSlots] = useState(null);
  const [checkingSlots, setCheckingSlots] = useState(false);
  const [countrySettings, setCountrySettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Optional Payments selected by applicant (titles)
  const [selectedOptionalPayments, setSelectedOptionalPayments] = useState([]);

  // Step 3 & 4: E-Sign & Submitting
  const [showSignDrawer, setShowSignDrawer] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load States on mount
  useEffect(() => {
    api
      .get("/config/state")
      .then((res) => {
        const stateList = res.data.data || [];
        setStates(stateList);
        if (stateList.length > 0) {
          const firstState = stateList[0];
          setCloudStateId(firstState.id);
          if (!locationForm.stateId) {
            setLocationForm((prev) => ({
              ...prev,
              stateId: firstState.id,
              stateName: firstState.name,
              country: firstState.country || "Nigeria",
            }));
          }
        }
      })
      .catch(() => toast.error("Failed to load states"))
      .finally(() => setStatesLoading(false));
  }, []);

  // Fetch Locations (for CLOUD_KITCHEN and STORE_FRONT) when stateId or outletType changes
  const fetchHubLocations = async (outletType, stateId) => {
    if (!stateId || !outletType) return;
    setLoadingCloudLocations(true);
    try {
      const res = await api.get("/kiosk/location", {
        params: {
          outletType: outletType,
          stateId: stateId,
        },
      });
      const list = res.data.data?.locations || (Array.isArray(res.data.data) ? res.data.data : []);
      setCloudLocations(list);
      // Auto-select first if none selected or previous is not in current list
      setSelectedCloudLocation((prev) => {
        if (prev && list.some((l) => l.id === prev.id)) {
          return prev;
        }
        return list.length > 0 ? list[0] : null;
      });
    } catch {
      toast.error(`Failed to load ${outletType === "STORE_FRONT" ? "store front" : "cloud kitchen"} locations`);
      setCloudLocations([]);
      setSelectedCloudLocation(null);
    } finally {
      setLoadingCloudLocations(false);
    }
  };

  const handleCloudStateChange = (stateId) => {
    setCloudStateId(stateId);
    fetchHubLocations(locationForm.outletType, stateId);
  };

  const handleOutletTypeSelect = (type) => {
    setLocationForm((prev) => ({ ...prev, outletType: type }));
    if (type === "CLOUD_KITCHEN" || type === "STORE_FRONT") {
      const targetStateId = cloudStateId || locationForm.stateId || (states[0]?.id || "");
      if (targetStateId) {
        setCloudStateId(targetStateId);
        fetchHubLocations(type, targetStateId);
      }
    }
  };

  // Fetch Brands and Sales Formulas when moving to Step 2
  const loadBrands = async () => {
    setLoadingBrands(true);
    const formulaCountry = locationForm.country || selectedCloudLocation?.country || selectedCloudLocation?.state?.country || "Nigeria";
    try {
      const [vendorsRes, formulaRes] = await Promise.allSettled([
        api.get("/vendor/profile", { params: { limit: 100 } }),
        api.get("/kiosk/sales-formula", { params: { country: formulaCountry } }),
      ]);
      if (vendorsRes.status === "fulfilled") {
        const list = vendorsRes.value.data.data?.vendors || (Array.isArray(vendorsRes.value.data.data) ? vendorsRes.value.data.data : []);
        setBrands(list.filter((b) => b.isPublic !== false));
      } else {
        toast.error("Failed to load franchise brands");
      }
      if (formulaRes.status === "fulfilled") {
        const formulaList = Array.isArray(formulaRes.value.data.data) ? formulaRes.value.data.data : [];
        setSalesFormulas(formulaList);
      } else {
        setSalesFormulas([]);
      }
    } catch {
      toast.error("Failed to load franchise brands");
    } finally {
      setLoadingBrands(false);
    }
  };

  // Helper to extract brand-specific or country-default royalty percent
  const getBrandRoyalty = (brandId) => {
    if (!salesFormulas || salesFormulas.length === 0) return null;
    const brandFormula = salesFormulas.find((f) => f.vendorId === brandId);
    if (brandFormula && brandFormula.vendorPercent != null) {
      return brandFormula.vendorPercent;
    }
    const countryDefault = salesFormulas.find((f) => !f.vendorId);
    return countryDefault?.vendorPercent ?? null;
  };

  // Calculate menu costs in selected location across all items in brandMenuItems
  useEffect(() => {
    if (!brandMenuItems.length) {
      setMenuCostMap({});
      return;
    }
    const stateId = locationForm.stateId || selectedCloudLocation?.stateId;
    let cancelled = false;
    setLoadingCosts(true);
    Promise.all(
      brandMenuItems.map(async (m) => {
        try {
          const res = await api.get(`/library/calculation/menu/${m.id}/calc`, {
            params: { stateId, useAverage: true },
          });
          return [m.id, res.data.data?.cost ?? null];
        } catch {
          return [m.id, null];
        }
      })
    ).then((entries) => {
      if (cancelled) return;
      setMenuCostMap(Object.fromEntries(entries));
      setLoadingCosts(false);
    });
    return () => {
      cancelled = true;
    };
  }, [brandMenuItems, locationForm.stateId, selectedCloudLocation?.stateId]);

  // Handle expanding/collapsing a brand card in Step 2
  const handleToggleExpandBrand = (brand, isEligible) => {
    if (!isEligible) {
      const outlets = Array.isArray(brand.outletSupport) ? brand.outletSupport : [];
      const supportsCurrentOutlet = outlets.includes(locationForm.outletType);
      const supportedStates = Array.isArray(brand.supportedStates) ? brand.supportedStates : [];
      const supportsCurrentState = Boolean(locationForm.stateId && supportedStates.includes(locationForm.stateId));
      if (!supportsCurrentOutlet) {
        const otLabel =
          locationForm.outletType === "CLOUD_KITCHEN"
            ? "Cloud Kitchens"
            : locationForm.outletType === "STORE_FRONT"
              ? "Store Fronts"
              : "Physical Kiosks";
        return toast.error(`${brand.businessName} does not support ${otLabel}.`);
      }
      if (!supportsCurrentState) {
        return toast.error(`${brand.businessName} does not operate in ${locationForm.stateName || "the selected state"}.`);
      }
      return;
    }

    if (expandedBrandId === brand.id) {
      setExpandedBrandId(null);
      return;
    }

    setExpandedBrandId(brand.id);
    handleSelectBrand(brand);
  };

  const handleLocationChange = (key, val) => {
    setLocationForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleStateSelect = (stateId) => {
    const s = states.find((item) => item.id === stateId);
    setLocationForm((prev) => ({
      ...prev,
      stateId,
      stateName: s?.name || prev.stateName,
      country: s?.country || prev.country,
    }));
  };

  // GPS Auto-detection for physical kiosk
  const detectGPS = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    setDetectingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocationForm((p) => ({
          ...p,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
        }));
        setShowMap(true);
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          const geo = await r.json();
          const a = geo.address || {};
          setLocationForm((p) => ({
            ...p,
            name: p.name || a.neighbourhood || a.suburb || a.city || "",
            address: p.address || [a.road, a.house_number].filter(Boolean).join(" ") || a.display_name?.split(",")[0] || "",
            city: p.city || a.city || a.town || a.county || "",
            lga: p.lga || a.county || a.state_district || a.suburb || "",
            country: p.country || a.country || "Nigeria",
          }));
          toast.success("Location coordinates detected");
        } catch {
          toast.success("GPS coordinates detected");
        }
        setDetectingGPS(false);
      },
      () => {
        setDetectingGPS(false);
        toast.error("Failed to detect location coordinates");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMapPick = (lat, lng) => {
    setLocationForm((p) => ({
      ...p,
      latitude: Number(lat).toFixed(6),
      longitude: Number(lng).toFixed(6),
    }));
  };

  // Step 1 Validation -> Proceed to Brand Selection (KIOSK)
  const handleProceedKioskLocation = (e) => {
    e.preventDefault();
    if (!locationForm.name.trim()) return toast.error("Location name is required");
    if (!locationForm.address.trim()) return toast.error("Street address is required");
    if (!locationForm.city.trim()) return toast.error("City is required");
    if (!locationForm.lga.trim()) return toast.error("LGA is required");
    if (!locationForm.stateId) return toast.error("Please select a state");

    setSelectedCloudLocation(null);
    loadBrands();
    setStep(2);
  };

  // Step 1 Validation -> Proceed to Brand Selection (CLOUD KITCHEN or STORE FRONT)
  const handleProceedCloudKitchen = (e) => {
    e?.preventDefault();
    if (!selectedCloudLocation) {
      return toast.error(`Please choose a ${locationForm.outletType === "STORE_FRONT" ? "store front" : "cloud kitchen"} location to proceed`);
    }
    const loc = selectedCloudLocation;
    const s = states.find((item) => item.id === loc.stateId);
    setLocationForm((prev) => ({
      ...prev,
      name: loc.name,
      address: loc.address,
      city: loc.city,
      lga: loc.lga,
      stateId: loc.stateId,
      stateName: loc.state?.name || s?.name || prev.stateName,
      country: loc.country || "Nigeria",
      latitude: loc.latitude != null ? String(loc.latitude) : "",
      longitude: loc.longitude != null ? String(loc.longitude) : "",
      outletType: prev.outletType,
      notes: loc.notes || "",
    }));
    loadBrands();
    setStep(2);
  };

  // When a brand is chosen in Step 2
  const handleSelectBrand = async (brand) => {
    setSelectedBrand(brand);
    setLoadingMenu(true);

    try {
      const res = await api.get("/vendor/menu", {
        params: { vendorId: brand.id, page: 1, limit: 100 },
      });
      const items = res.data.data?.items || (Array.isArray(res.data.data) ? res.data.data : []);
      setBrandMenuItems(items);
      setSelectedMenuIds(items.map((m) => m.id)); // all selected by default
    } catch {
      setBrandMenuItems([]);
      setSelectedMenuIds([]);
    } finally {
      setLoadingMenu(false);
    }

    // Royalty (sales formula vendor share): brand-specific first, else country default
    const formulaCountry = locationForm.country || selectedCloudLocation?.country || selectedCloudLocation?.state?.country;
    setLoadingRoyalty(true);
    setRoyaltyPercent(null);
    try {
      let res = await api.get("/kiosk/sales-formula", { params: { country: formulaCountry, vendorId: brand.id } });
      let list = Array.isArray(res.data.data) ? res.data.data : [];
      if (list.length === 0) {
        res = await api.get("/kiosk/sales-formula", { params: { country: formulaCountry } });
        list = (Array.isArray(res.data.data) ? res.data.data : []).filter((f) => !f.vendorId);
      }
      setRoyaltyPercent(list.length > 0 ? list[0].vendorPercent : null);
    } catch {
      setRoyaltyPercent(null);
    } finally {
      setLoadingRoyalty(false);
    }

    // Check slot availability at this location
    const checkLat = locationForm.latitude || selectedCloudLocation?.latitude;
    const checkLng = locationForm.longitude || selectedCloudLocation?.longitude;
    const checkStateId = locationForm.stateId || selectedCloudLocation?.stateId;

    if (checkLat && checkLng && checkStateId) {
      setCheckingSlots(true);
      try {
        const res = await api.get("/kiosk/available-slots", {
          params: {
            vendorId: brand.id,
            lat: checkLat,
            lng: checkLng,
            stateId: checkStateId,
          },
        });
        setAvailableSlots(res.data.data?.availableSlots ?? null);
      } catch {
        setAvailableSlots(null);
      } finally {
        setCheckingSlots(false);
      }
    }

    // Load country settings for legal terms & fees
    const country = locationForm.country || selectedCloudLocation?.country || selectedCloudLocation?.state?.country;
    setLoadingSettings(true);
    try {
      const res = await api.get(`/kioskVendorApplication/settings/country/${encodeURIComponent(country)}`, {
        params: { outletType: locationForm.outletType },
      });
      const sData = res.data.data;
      setCountrySettings(sData);
      setSelectedOptionalPayments([]);
    } catch {
      setCountrySettings(null);
    } finally {
      setLoadingSettings(false);
    }
  };

  // Toggle optional payments
  const toggleOptionalPayment = (title) => {
    setSelectedOptionalPayments((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  // ── Fee Calculations & Payment Partitioning ────────────────
  const vendorPayments = Array.isArray(selectedBrand?.franchisePayments) ? selectedBrand.franchisePayments : [];
  const totalVendorPayments = vendorPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const rawGlobalPayments = Array.isArray(countrySettings?.payments) ? countrySettings.payments : [];
  const currency = countrySettings?.currency || "NGN";

  // Filter global payments targeted to this outletType ("ALL" applies to every outlet)
  const filteredGlobalPayments = rawGlobalPayments.filter((p) => {
    const paymentOutlet = String(p.outletType || "ALL").toUpperCase();
    return paymentOutlet === "ALL" || paymentOutlet === locationForm.outletType;
  });

  // Categorize for UI and calculations:
  const mandatoryGlobalItems = filteredGlobalPayments.filter((p) => !Boolean(p.optional || p.isOptional));
  const optionalGlobalItems = filteredGlobalPayments.filter((p) => Boolean(p.optional || p.isOptional));

  // Location Bills (for Cloud Kitchen and Store Front)
  const selectedLocationBills =
    (locationForm.outletType === "CLOUD_KITCHEN" || locationForm.outletType === "STORE_FRONT") && selectedCloudLocation
      ? parseBills(selectedCloudLocation.bills)
      : [];
  const totalLocationBills = selectedLocationBills.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);

  // Compute Platform/Global Fees
  const computedGlobalFee = filteredGlobalPayments.reduce((sum, p) => {
    const isOptional = Boolean(p.optional || p.isOptional);
    const title = p.title || "";
    const isPct = Boolean(p.isPercentage);
    const amt = isPct
      ? totalVendorPayments * ((parseFloat(p.amount) || 0) / 100)
      : parseFloat(p.amount) || 0;

    if (isOptional && !selectedOptionalPayments.includes(title)) {
      return sum;
    }
    return sum + amt;
  }, 0);

  // Total Due: Brand Fees + Global Setup & Licensing + Location Facility Bills
  const totalFranchiseCost = totalVendorPayments + computedGlobalFee + totalLocationBills;

  // Combined operational monthly bills (for Profit Projection & Costing):
  // 1. Facility/location bills (excluding refundable one-off deposits)
  const locationRecurringBills = selectedLocationBills
    .filter((b) => !b.refundable)
    .map((b, idx) => ({
      id: `loc-${idx}-${b.title || b.name || "bill"}`,
      name: b.title || b.name || "Location Facility Bill",
      amount: parseFloat(b.amount) || 0,
    }));

  // 2. Global platform payments targeted to this outletType that recur every 30 days
  // (mandatory payments + currently selected optional payments)
  const globalRecurringBills = filteredGlobalPayments
    .filter((p) => {
      const isOptional = Boolean(p.optional || p.isOptional);
      if (isOptional && !selectedOptionalPayments.includes(p.title)) return false;
      const is30Day = !p.intervalInDays || Number(p.intervalInDays) === 30;
      return Boolean(p.recurring) && is30Day;
    })
    .map((p, idx) => {
      const isPct = Boolean(p.isPercentage);
      const amt = isPct
        ? totalVendorPayments * ((parseFloat(p.amount) || 0) / 100)
        : parseFloat(p.amount) || 0;
      return {
        id: `global-rec-${idx}-${p.title}`,
        name: `${p.title} (Monthly Fee)`,
        amount: amt,
      };
    });

  const combinedOperationalBills = [...locationRecurringBills, ...globalRecurringBills];

  // Shared pricing plan (margins, extra costs, operational bills, daily target)
  const plan = useFranchisePlan(combinedOperationalBills);
  const [showProjection, setShowProjection] = useState(false);

  // Submit Franchise Purchase
  const handleSignSubmit = async ({ signatureName, terms, isSigned }) => {
    if (!selectedBrand) return;
    if (selectedMenuIds.length === 0) return toast.error("Please select at least one menu item");
    setSubmitting(true);
    try {
      const menuIds = selectedMenuIds;
      const configuredMenuItems = menuIds.map((id) => ({
        id,
        markup: Number(plan.getMargin(id)) || 0,
      }));

      const formattedBills = (plan.bills || []).map((b) => ({
        id: b.id,
        name: b.name || "Operational Expense",
        amount: Number(b.amount) || 0,
      }));

      const payload = {
        brandId: selectedBrand.id,
        menuIds,
        menuItems: configuredMenuItems,
        operationalBills: formattedBills,
        expectedMonthlyOrders: Number(plan.monthlyOrders) || (Number(plan.dailyTarget) * 30) || 0,
        dailyTarget: Number(plan.dailyTarget) || 0,
        operationalCost: Number(plan.operationalPerOrder) || 0,
        selectedOptionalPayments,
        signatureName,
        terms,
        isSigned,
      };

      if ((locationForm.outletType === "CLOUD_KITCHEN" || locationForm.outletType === "STORE_FRONT") && selectedCloudLocation?.id) {
        payload.locationId = selectedCloudLocation.id;
      } else {
        payload.locationData = {
          name: locationForm.name.trim(),
          address: locationForm.address.trim(),
          city: locationForm.city.trim(),
          lga: locationForm.lga.trim(),
          country: locationForm.country || "Nigeria",
          stateId: locationForm.stateId,
          latitude: locationForm.latitude ? Number(locationForm.latitude) : 0,
          longitude: locationForm.longitude ? Number(locationForm.longitude) : 0,
          outletType: locationForm.outletType,
          notes: locationForm.notes.trim() || undefined,
        };
      }

      await api.post("/kiosk/buy-franchise", payload);

      toast.success("Franchise purchase initiated! Please complete your invoice payment to deploy your Kitchen.");
      setShowSignDrawer(false);
      navigate("/app/invoices", { state: { openLatest: true } });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to initiate franchise purchase");
    } finally {
      setSubmitting(false);
    }
  };

  const hasLocation = Boolean(locationForm.name || selectedCloudLocation);
  const stepperItems = [
    { n: 1, label: "Location", full: "Location & Outlet Type", enabled: true, done: hasLocation },
    { n: 2, label: "Brand", full: "Select Brand", enabled: hasLocation, done: Boolean(selectedBrand) },
    { n: 3, label: "Review", full: "Review & Sign", enabled: Boolean(selectedBrand), done: false },
  ];

  return (
    <div className="bf-root">
      <style>{`
        .bf-root { max-width: 1040px; margin: 0 auto; padding: 10px 0 40px; box-sizing: border-box; overflow-x: hidden; }
        .bf-root *, .bf-root *::before, .bf-root *::after { box-sizing: border-box; }

        /* Stepper */
        .bf-stepper { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 28px; }
        .bf-step { display: flex; align-items: center; gap: 8px; background: var(--bg-card); color: var(--text-muted);
          border: 1px solid var(--border); border-radius: 999px; padding: 6px 16px 6px 6px; font-size: 0.82rem; font-weight: 700;
          cursor: pointer; transition: all .15s ease; white-space: nowrap; }
        .bf-step:disabled { cursor: not-allowed; opacity: .55; }
        .bf-step.active { background: var(--accent); color: #fff; border-color: var(--accent); }
        .bf-step-num { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          background: var(--bg-hover); color: var(--text-muted); font-size: .75rem; flex-shrink: 0; }
        .bf-step.active .bf-step-num { background: rgba(255,255,255,.25); color: #fff; }
        .bf-step.done:not(.active) .bf-step-num { background: rgba(203,108,220,.15); color: var(--accent); }
        .bf-step-short { display: none; }
        .bf-step-sep { color: var(--border); font-weight: 700; }

        /* Form inputs: 16px avoids iOS zoom-on-focus */
        .bf-root .modal-input { max-width: 100%; }

        @media (max-width: 900px) {
          .bf-checkout-grid { grid-template-columns: 1fr !important; }
          .bf-sticky { position: static !important; }
        }

        @media (max-width: 640px) {
          .bf-root { padding: 0 0 28px; }
          .bf-stepper { gap: 6px; margin-bottom: 18px; justify-content: space-between; }
          .bf-step-sep { display: none; }
          .bf-step { flex: 0 0 auto; padding: 5px 10px 5px 5px; font-size: .76rem; }
          .bf-step.active { flex: 1 1 auto; justify-content: center; }
          .bf-step:not(.active) .bf-step-label { display: none; }
          .bf-step:not(.active) { padding: 5px; }
          .bf-step-full { display: none; }
          .bf-step-short { display: inline; }
          .bf-card { padding: 16px !important; border-radius: 14px !important; }
          .bf-root .modal-input { font-size: 16px !important; min-height: 44px; }
          .bf-root .app_btn { min-height: 44px; }
          .bf-title { font-size: 1.05rem !important; }
          .bf-head-row { flex-direction: column; align-items: stretch !important; gap: 10px !important; }
          .bf-head-row > .app_btn { align-self: flex-start; }
          .bf-coord-head { flex-direction: column; align-items: stretch !important; gap: 8px; }
          .bf-coord-actions { width: 100%; }
          .bf-coord-actions > button { flex: 1; height: 38px !important; justify-content: center; font-size: .76rem !important; }
          .bf-brand-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .bf-bill-row { flex-wrap: wrap; gap: 4px; }
          .bf-loc-hero { height: 170px !important; }
          .bf-lightbox { padding: 12px !important; }
          .bf-sheet-cta { position: sticky; bottom: 0; z-index: 5; }
        }

        @media (max-width: 380px) {
          .bf-two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Flow Progress Indicator ─────────────────────── */}
      <div className="bf-stepper" role="tablist" aria-label="Franchise purchase steps">
        {stepperItems.map((s, i) => (
          <span key={s.n} style={{ display: "contents" }}>
            {i > 0 && <span className="bf-step-sep">→</span>}
            <button
              type="button"
              role="tab"
              aria-selected={step === s.n}
              disabled={!s.enabled}
              onClick={() => s.enabled && setStep(s.n)}
              className={`bf-step${step === s.n ? " active" : ""}${s.done ? " done" : ""}`}
            >
              <span className="bf-step-num">
                {s.done && step !== s.n ? <MdCheck size={14} /> : s.n}
              </span>
              <span className="bf-step-label">
                <span className="bf-step-full">{s.full}</span>
                <span className="bf-step-short">{s.label}</span>
              </span>
            </button>
          </span>
        ))}
      </div>

      {/* ── STEP 1: SELECT OUTLET TYPE & LOCATION DETAILS ── */}
      {step === 1 && (
        <div style={{ maxWidth: 740, margin: "0 auto" }}>
          <div className="bf-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <h3 className="bf-title" style={{ fontSize: "1.18rem", fontWeight: 800, color: "var(--text-heading)", margin: "0 0 6px" }}>
                1. Select Outlet Type &amp; Location
              </h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                Choose whether you want to deploy a customized physical kiosk cart or join a certified commercial cloud kitchen hub.
              </p>
            </div>

            {/* Outlet Type Selector */}
            <div style={{ marginBottom: 24 }}>
              <label className="modal-label" style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: 8 }}>
                Outlet Type *
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))", gap: 14 }}>
                {[
                  {
                    id: "KIOSK",
                    label: "Physical Kiosk",
                    desc: "Deploy a walk-up street cart or mall food stand",
                    icon: LuStore,
                  },
                  {
                    id: "CLOUD_KITCHEN",
                    label: "Cloud Kitchen",
                    desc: "Operate inside a shared commercial kitchen facility",
                    icon: LuCloud,
                  },
                  {
                    id: "STORE_FRONT",
                    label: "Store Front",
                    desc: "Operate in a prime dedicated retail storefront location",
                    icon: MdStorefront,
                  },
                ].map((type) => {
                  const isSelected = locationForm.outletType === type.id;
                  const Icon = type.icon;
                  return (
                    <div
                      key={type.id}
                      onClick={() => handleOutletTypeSelect(type.id)}
                      style={{
                        background: isSelected ? "rgba(203,108,220,0.08)" : "var(--bg-hover)",
                        border: `2px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                        borderRadius: 12,
                        padding: "16px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 10,
                          background: isSelected ? "rgba(203,108,220,0.2)" : "var(--bg-card)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isSelected ? "var(--accent)" : "var(--text-muted)",
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={22} />
                      </div>
                      <div>
                        <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--text-heading)", display: "block" }}>
                          {type.label}
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.25 }}>
                          {type.desc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── KIOSK: LOCATION FORM DETAILS ── */}
            {locationForm.outletType === "KIOSK" ? (
              <form onSubmit={handleProceedKioskLocation}>
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20 }}>
                  <div style={{ marginBottom: 14 }}>
                    <h4 style={{ fontSize: "0.92rem", fontWeight: 800, color: "var(--text-heading)", margin: "0 0 2px" }}>
                      Kiosk Installation Address
                    </h4>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      Provide exact location details where your physical kiosk cart will operate.
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div className="form-field" style={{ marginBottom: 0 }}>
                      <label className="modal-label">Location Name *</label>
                      <input
                        className="modal-input"
                        placeholder="e.g. Wuse II Plaza Stand"
                        value={locationForm.name}
                        onChange={(e) => handleLocationChange("name", e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-field" style={{ marginBottom: 0 }}>
                      <label className="modal-label">Street Address *</label>
                      <input
                        className="modal-input"
                        placeholder="Street / Building name"
                        value={locationForm.address}
                        onChange={(e) => handleLocationChange("address", e.target.value)}
                        required
                      />
                    </div>

                    <div className="bf-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div className="form-field" style={{ marginBottom: 0 }}>
                        <label className="modal-label">City *</label>
                        <input
                          className="modal-input"
                          placeholder="e.g. Abuja"
                          value={locationForm.city}
                          onChange={(e) => handleLocationChange("city", e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-field" style={{ marginBottom: 0 }}>
                        <label className="modal-label">LGA *</label>
                        <input
                          className="modal-input"
                          placeholder="e.g. Municipal"
                          value={locationForm.lga}
                          onChange={(e) => handleLocationChange("lga", e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-field" style={{ marginBottom: 0 }}>
                      <label className="modal-label">State *</label>
                      <select
                        className="modal-input"
                        value={locationForm.stateId}
                        onChange={(e) => handleStateSelect(e.target.value)}
                        disabled={statesLoading}
                        required
                      >
                        {states.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.code || s.country})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Coordinates & Map Picker */}
                    <div style={{ marginTop: 4 }}>
                      <div className="bf-coord-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
                        <label className="modal-label" style={{ margin: 0 }}>
                          Coordinates (for slot reservation &amp; radius verification)
                        </label>
                        <div className="bf-coord-actions" style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
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
                            }}
                          >
                            <MdLocationOn size={13} /> {detectingGPS ? "Detecting..." : "Detect GPS"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowMap(!showMap)}
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
                            }}
                          >
                            <MdLocationOn size={13} /> {showMap ? "Hide Map" : "Pick on Map"}
                          </button>
                        </div>
                      </div>

                      {showMap && (
                        <div style={{ marginBottom: 12 }}>
                          <MapPicker
                            lat={locationForm.latitude}
                            lng={locationForm.longitude}
                            onPick={handleMapPick}
                          />
                        </div>
                      )}

                      <div className="bf-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <input
                          className="modal-input"
                          type="number"
                          step="any"
                          placeholder="Latitude (e.g. 9.0765)"
                          value={locationForm.latitude}
                          onChange={(e) => handleLocationChange("latitude", e.target.value)}
                          style={{ marginBottom: 0 }}
                        />
                        <input
                          className="modal-input"
                          type="number"
                          step="any"
                          placeholder="Longitude (e.g. 7.3986)"
                          value={locationForm.longitude}
                          onChange={(e) => handleLocationChange("longitude", e.target.value)}
                          style={{ marginBottom: 0 }}
                        />
                      </div>
                    </div>

                    <div className="form-field" style={{ marginBottom: 0 }}>
                      <label className="modal-label">Notes / Nearby Landmarks</label>
                      <input
                        className="modal-input"
                        placeholder="Optional landmarks"
                        value={locationForm.notes}
                        onChange={(e) => handleLocationChange("notes", e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 24 }}>
                    <button
                      type="submit"
                      className="app_btn app_btn_confirm"
                      style={{ width: "100%", height: 44, fontSize: "0.88rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                    >
                      <span>Select Franchise Brand</span>
                      <MdArrowForward size={18} />
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* ── CLOUD KITCHEN / STORE FRONT: SELECT STATE & CHOOSE FROM EXISTING HUB LOCATIONS ── */
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20 }}>
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ fontSize: "0.92rem", fontWeight: 800, color: "var(--text-heading)", margin: "0 0 4px" }}>
                    Select Certified {locationForm.outletType === "STORE_FRONT" ? "Store Front Retail Location" : "Cloud Kitchen Facility"}
                  </h4>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {locationForm.outletType === "STORE_FRONT"
                      ? "Choose a state and select an available retail storefront location. Each facility lists its facility expenses and bills schedule."
                      : "Choose a state and select an available commercial kitchen hub. Each facility lists its facility expenses and bills schedule."}
                  </span>
                </div>

                <div className="form-field" style={{ marginBottom: 18 }}>
                  <label className="modal-label">Select State / Region *</label>
                  <select
                    className="modal-input"
                    value={cloudStateId}
                    onChange={(e) => handleCloudStateChange(e.target.value)}
                    disabled={statesLoading}
                  >
                    {states.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code || s.country})
                      </option>
                    ))}
                  </select>
                </div>

                {loadingCloudLocations ? (
                  <div className="page_loader" style={{ padding: "30px 0" }}>
                    <div className="page_loader_spinner" />
                  </div>
                ) : cloudLocations.length === 0 ? (
                  <div
                    style={{
                      padding: "36px 20px",
                      textAlign: "center",
                      background: "var(--bg-hover)",
                      borderRadius: 12,
                      border: "1px dashed var(--border)",
                      marginBottom: 20,
                    }}
                  >
                    {locationForm.outletType === "STORE_FRONT" ? (
                      <MdStorefront size={36} style={{ color: "var(--text-muted)", opacity: 0.5, marginBottom: 8 }} />
                    ) : (
                      <LuCloud size={36} style={{ color: "var(--text-muted)", opacity: 0.5, marginBottom: 8 }} />
                    )}
                    <h5 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 4px", color: "var(--text-heading)" }}>
                      No {locationForm.outletType === "STORE_FRONT" ? "Store Fronts" : "Cloud Kitchens"} in this State
                    </h5>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>
                      No operational {locationForm.outletType === "STORE_FRONT" ? "retail storefronts" : "cloud kitchen hubs"} are registered for this state yet. Please select another state or switch to Physical Kiosk.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)" }}>
                      Available Facilities ({cloudLocations.length}) — Click to choose 1:
                    </div>

                    {cloudLocations.map((loc) => {
                      const isSelected = selectedCloudLocation?.id === loc.id;
                      const bills = parseBills(loc.bills);
                      const billsSum = bills.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);
                      const locImages = parseImages(loc.images);

                      return (
                        <div
                          key={loc.id}
                          onClick={() => setSelectedCloudLocation(loc)}
                          style={{
                            background: isSelected ? "rgba(99,102,241,0.06)" : "var(--bg-card)",
                            border: `2px solid ${isSelected ? "#6366f1" : "var(--border)"}`,
                            borderRadius: 14,
                            padding: "16px 18px",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 10,
                                  background: isSelected ? "rgba(99,102,241,0.18)" : "var(--bg-hover)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: isSelected ? "#6366f1" : "var(--text-muted)",
                                  flexShrink: 0,
                                }}
                              >
                                {locationForm.outletType === "STORE_FRONT" ? <MdStorefront size={22} /> : <LuCloud size={22} />}
                              </div>
                              <div>
                                <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-heading)", margin: "0 0 2px" }}>
                                  {loc.name}
                                </h4>
                                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                                  {loc.address}, {loc.city} ({loc.lga})
                                </span>
                              </div>
                            </div>
                            <div
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: "50%",
                                border: `2px solid ${isSelected ? "#6366f1" : "var(--border)"}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {isSelected && (
                                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#6366f1" }} />
                              )}
                            </div>
                          </div>

                          {/* Cloud Kitchen Facility Images (Displayed for Cloud Kitchen List Only) */}
                          {locImages.length > 0 && (
                            <div style={{ marginTop: 2, marginBottom: 2 }}>
                              <div
                                className="bf-loc-hero"
                                style={{
                                  position: "relative",
                                  height: 140,
                                  borderRadius: 10,
                                  overflow: "hidden",
                                  border: "1px solid var(--border)",
                                  background: "var(--bg-hover)",
                                  cursor: "pointer",
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewModalImage(locImages[0]);
                                }}
                                title="Click to view full photo"
                              >
                                <img
                                  src={locImages[0]}
                                  alt={loc.name}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    transition: "transform 0.3s ease",
                                  }}
                                  onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
                                  onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
                                />
                                <div
                                  style={{
                                    position: "absolute",
                                    top: 8,
                                    right: 8,
                                    background: "rgba(0,0,0,0.68)",
                                    backdropFilter: "blur(4px)",
                                    color: "#fff",
                                    fontSize: "0.68rem",
                                    fontWeight: 700,
                                    padding: "3px 8px",
                                    borderRadius: 12,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  <MdImage size={13} />
                                  <span>{locImages.length} {locImages.length === 1 ? "Photo" : "Photos"}</span>
                                </div>
                                <div
                                  style={{
                                    position: "absolute",
                                    bottom: 8,
                                    left: 8,
                                    background: "rgba(0,0,0,0.6)",
                                    backdropFilter: "blur(4px)",
                                    color: "#fff",
                                    fontSize: "0.68rem",
                                    padding: "2px 8px",
                                    borderRadius: 6,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  <MdZoomIn size={14} /> Tap to expand
                                </div>
                              </div>

                              {locImages.length > 1 && (
                                <div style={{ display: "flex", gap: 8, marginTop: 8, overflowX: "auto", paddingBottom: 4 }}>
                                  {locImages.map((imgUrl, imgIdx) => (
                                    <div
                                      key={imgIdx}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewModalImage(imgUrl);
                                      }}
                                      style={{
                                        width: 52,
                                        height: 44,
                                        borderRadius: 6,
                                        overflow: "hidden",
                                        border: "1px solid var(--border)",
                                        cursor: "pointer",
                                        flexShrink: 0,
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                                      }}
                                      title={`View photo ${imgIdx + 1}`}
                                    >
                                      <img
                                        src={imgUrl}
                                        alt=""
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {loc.notes && (
                            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", background: "var(--bg-hover)", padding: "5px 10px", borderRadius: 6 }}>
                              {loc.notes}
                            </div>
                          )}

                          {/* Display Bills alongside location */}
                          <div style={{ borderTop: "1px dashed var(--border)", paddingTop: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                              <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>
                                Facility Bills &amp; Expenses Schedule
                              </span>
                              <span style={{ fontSize: "0.78rem", fontWeight: 800, color: isSelected ? "#6366f1" : "var(--text-heading)" }}>
                                Total: {fmt(billsSum, loc.state.currency)}
                              </span>
                            </div>

                            {bills.length === 0 ? (
                              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                                No specific facility bills listed for this {locationForm.outletType === "STORE_FRONT" ? "store front" : "hub"}
                              </div>
                            ) : (
                              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {bills.map((bill, bIdx) => (
                                  <div
                                    className="bf-bill-row"
                                    key={bIdx}
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      fontSize: "0.75rem",
                                      background: "var(--bg-hover)",
                                      padding: "6px 10px",
                                      borderRadius: 6,
                                    }}
                                  >
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      <span style={{ color: "var(--text-body)", fontWeight: 600 }}>{bill.title}</span>
                                      {bill.recurring && (
                                        <span style={{ fontSize: "0.62rem", color: "#6366f1", background: "rgba(99,102,241,0.12)", padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>
                                          {bill.intervalInDays ? `${bill.intervalInDays}d` : "Recurring"}
                                        </span>
                                      )}
                                      {bill.refundable && (
                                        <span style={{ fontSize: "0.62rem", color: "#16a34a", background: "rgba(22,163,74,0.12)", padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>
                                          Refundable
                                        </span>
                                      )}
                                    </div>
                                    <strong style={{ color: "var(--text-heading)" }}>
                                      {fmt(parseFloat(bill.amount) || 0, loc.state.currency)}
                                    </strong>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div>
                  <button
                    type="button"
                    onClick={handleProceedCloudKitchen}
                    disabled={!selectedCloudLocation}
                    className="app_btn app_btn_confirm"
                    style={{ width: "100%", height: 44, fontSize: "0.88rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: selectedCloudLocation ? 1 : 0.6 }}
                  >
                    <span>Select Franchise Brand</span>
                    <MdArrowForward size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 2: SELECT BRAND ─────────────────────────── */}
      {step === 2 && (
        <div>
          <div className="bf-head-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 12 }}>
            <div>
              <h3 className="bf-title" style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-heading)", margin: "0 0 4px" }}>
                2. Choose Brand for {locationForm.outletType === "CLOUD_KITCHEN" ? "Cloud Kitchen" : "Physical Kiosk"}
              </h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                Selected Facility: <strong>{locationForm.name}</strong> ({locationForm.city}, {locationForm.stateName})
              </p>
            </div>
            <button
              type="button"
              className="app_btn app_btn_cancel"
              style={{ height: 34, fontSize: "0.78rem" }}
              onClick={() => setStep(1)}
            >
              ← Edit Location
            </button>
          </div>

          {loadingBrands ? (
            <div className="page_loader" style={{ padding: "40px 0" }}>
              <div className="page_loader_spinner" />
            </div>
          ) : brands.length === 0 ? (
            <div className="kiosk_empty_state" style={{ padding: "40px 0" }}>
              <LuStore size={36} style={{ opacity: 0.3 }} />
              <p className="kiosk_empty_title">No Public Brands Available</p>
            </div>
          ) : (
            <div className="bf-brand-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 290px), 1fr))", gap: 18 }}>
              {brands.map((brand) => {
                const isSelected = selectedBrand?.id === brand.id;
                const isExpanded = expandedBrandId === brand.id;
                const outlets = Array.isArray(brand.outletSupport)
                  ? brand.outletSupport
                  : [];
                const supportsCurrentOutlet = outlets.includes(locationForm.outletType);
                const supportedStates = Array.isArray(brand.supportedStates) ? brand.supportedStates : [];
                const supportsCurrentState = (locationForm.stateId && supportedStates.includes(locationForm.stateId));
                const isEligible = supportsCurrentOutlet && supportsCurrentState;
                const payments = Array.isArray(brand.franchisePayments) ? brand.franchisePayments : [];
                const brandFeeTotal = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
                const royaltyPct = getBrandRoyalty(brand.id);

                return (
                  <div
                    key={brand.id}
                    onClick={() => handleToggleExpandBrand(brand, isEligible)}
                    style={{
                      background: "var(--bg-card)",
                      border: `1.5px solid ${isExpanded ? "var(--accent)" : isSelected ? "var(--accent)" : isEligible ? "var(--border)" : "rgba(239, 68, 68, 0.25)"}`,
                      borderRadius: 16,
                      padding: 20,
                      cursor: isEligible ? "pointer" : "not-allowed",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "all 0.2s ease",
                      position: "relative",
                      opacity: isEligible ? 1 : 0.6,
                      gridColumn: isExpanded ? "1 / -1" : undefined,
                      boxShadow: isExpanded ? "0 8px 24px rgba(203,108,220,0.12)" : undefined,
                    }}
                  >
                    <div>
                      {/* Brand Header */}
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 12,
                              background: brand.branding?.color || "var(--bg-hover)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              overflow: "hidden",
                              flexShrink: 0,
                              border: "1px solid var(--border)",
                            }}
                          >
                            {brand.branding?.logo ? (
                              <img
                                src={brand.branding.logo}
                                alt={brand.businessName}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              <MdStorefront size={24} color="#fff" />
                            )}
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
                              <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-heading)", margin: 0 }}>
                                {brand.businessName}
                              </h4>
                              {(brand.origin || brand.branding?.origin) && (
                                <span
                                  style={{
                                    fontSize: "0.64rem",
                                    fontWeight: 700,
                                    padding: "1px 6px",
                                    borderRadius: 4,
                                    background: "rgba(203,108,220,0.08)",
                                    color: "var(--accent)",
                                    border: "1px solid rgba(203,108,220,0.25)",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 3,
                                  }}
                                >
                                  📍 {brand.origin || brand.branding?.origin}
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                              {brand.branding?.tagline || "Verified Franchise Partner"}
                            </span>
                          </div>
                        </div>

                        {/* Brand Royalty Percentage Badge */}
                        {royaltyPct != null && (
                          <RoyaltyBadge percent={royaltyPct} />
                        )}
                      </div>

                      {/* Outlet Support & State Eligibility Tags */}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                        {outlets.map((ot) => (
                          <span
                            key={ot}
                            style={{
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: 5,
                              background:
                                ot === "KIOSK"
                                  ? "rgba(34,197,94,0.1)"
                                  : ot === "STORE_FRONT"
                                    ? "rgba(245,158,11,0.12)"
                                    : "rgba(99,102,241,0.1)",
                              color:
                                ot === "KIOSK"
                                  ? "#16a34a"
                                  : ot === "STORE_FRONT"
                                    ? "#d97706"
                                    : "#6366f1",
                              border: `1px solid ${ot === "KIOSK"
                                ? "rgba(34,197,94,0.25)"
                                : ot === "STORE_FRONT"
                                  ? "rgba(245,158,11,0.3)"
                                  : "rgba(99,102,241,0.25)"
                                }`,
                            }}
                          >
                            {ot === "KIOSK" ? "Physical Kiosk" : ot === "STORE_FRONT" ? "Store Front" : "Cloud Kitchen"}
                          </span>
                        ))}

                        {!supportsCurrentState && (
                          <span
                            style={{
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: 5,
                              background: "rgba(239, 68, 68, 0.1)",
                              color: "#ef4444",
                              border: "1px solid rgba(239, 68, 68, 0.25)",
                            }}
                          >
                            Unavailable in {locationForm.stateName || "State"}
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: "0.78rem", color: "var(--text-body)", lineHeight: 1.4, margin: "0 0 14px" }}>
                        {brand.branding?.description || "High-growth fast-casual franchise concept with proven unit economics."}
                      </p>
                    </div>

                    {/* Card Footer: License fee & Chevron Toggle */}
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block" }}>
                          Franchise License Fee
                        </span>
                        <strong style={{ fontSize: "0.95rem", color: "var(--text-heading)" }}>
                          {fmt(brandFeeTotal, "NGN")}
                        </strong>
                      </div>
                      <button
                        type="button"
                        disabled={!isEligible}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleExpandBrand(brand, isEligible);
                        }}
                        aria-label={isExpanded ? "Collapse brand setup" : "Expand brand setup"}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          border: `1.5px solid ${isExpanded ? "var(--accent)" : "var(--border)"}`,
                          background: isExpanded ? "rgba(203,108,220,0.12)" : "var(--bg-hover)",
                          color: isExpanded ? "var(--accent)" : "var(--text-heading)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: isEligible ? "pointer" : "not-allowed",
                          transition: "all 0.2s ease",
                          padding: 0,
                        }}
                      >
                        <LuChevronDown
                          size={20}
                          style={{
                            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.25s ease",
                          }}
                        />
                      </button>
                    </div>

                    {/* ── Expanded Brand Setup & Analysis ── */}
                    {isExpanded && (
                      <BrandExpandedConfig
                        brand={brand}
                        menuItems={brandMenuItems}
                        loadingMenu={loadingMenu}
                        selectedMenuIds={selectedMenuIds}
                        onToggleMenu={(id) =>
                          setSelectedMenuIds((prev) =>
                            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                          )
                        }
                        onToggleAll={() =>
                          setSelectedMenuIds((prev) =>
                            prev.length === brandMenuItems.length ? [] : brandMenuItems.map((m) => m.id)
                          )
                        }
                        onOpenMenuDrawer={(item) => setActiveMenu(item)}
                        costMap={menuCostMap}
                        loadingCosts={loadingCosts}
                        currency={currency}
                        fmt={fmt}
                        plan={plan}
                        royaltyPercent={royaltyPercent ?? royaltyPct}
                        onRunAnalysis={() => setShowProjection(true)}
                        onProceed={() => {
                          if (selectedMenuIds.length === 0) {
                            return toast.error("Please select at least one menu item to proceed");
                          }
                          setStep(3);
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 3: REVIEW FEES, LOCATION BILLS & E-SIGN ───── */}
      {step === 3 && selectedBrand && (
        <div className="bf-checkout-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 390px", gap: 24, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Location Card */}
            <div className="bf-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  1. Outlet Details
                </span>
                <button
                  type="button"
                  className="app_btn app_btn_cancel"
                  style={{ height: 30, fontSize: "0.72rem", padding: "0 10px" }}
                  onClick={() => setStep(1)}
                >
                  Edit Location
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: locationForm.outletType === "CLOUD_KITCHEN" ? "rgba(99,102,241,0.12)" : "rgba(203,108,220,0.12)",
                    color: locationForm.outletType === "CLOUD_KITCHEN" ? "#6366f1" : "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {locationForm.outletType === "CLOUD_KITCHEN" ? <LuCloud size={22} /> : <LuStore size={22} />}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-heading)", margin: 0 }}>
                      {locationForm.name}
                    </h4>
                    <span
                      style={{
                        fontSize: "0.66rem",
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 5,
                        background:
                          locationForm.outletType === "CLOUD_KITCHEN"
                            ? "rgba(99,102,241,0.1)"
                            : locationForm.outletType === "STORE_FRONT"
                              ? "rgba(245,158,11,0.12)"
                              : "rgba(34,197,94,0.1)",
                        color:
                          locationForm.outletType === "CLOUD_KITCHEN"
                            ? "#6366f1"
                            : locationForm.outletType === "STORE_FRONT"
                              ? "#d97706"
                              : "#16a34a",
                      }}
                    >
                      {locationForm.outletType === "CLOUD_KITCHEN"
                        ? "Commercial Cloud Kitchen Hub"
                        : locationForm.outletType === "STORE_FRONT"
                          ? "Prime Retail Store Front"
                          : "Physical Kiosk Stand"}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "4px 0 0" }}>
                    {locationForm.address}, {locationForm.city}, {locationForm.stateName} ({locationForm.country})
                  </p>
                  {(locationForm.outletType === "CLOUD_KITCHEN" || locationForm.outletType === "STORE_FRONT") && parseImages(selectedCloudLocation?.images).length > 0 && (
                    <div style={{ marginTop: 12, display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                      {parseImages(selectedCloudLocation.images).map((imgUrl, i) => (
                        <img
                          key={i}
                          src={imgUrl}
                          alt="Facility photo"
                          onClick={() => setPreviewModalImage(imgUrl)}
                          title="Click to view photo"
                          style={{
                            width: 68,
                            height: 48,
                            borderRadius: 6,
                            objectFit: "cover",
                            border: "1px solid var(--border)",
                            cursor: "pointer",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Slot check indicator */}
              <div
                style={{
                  marginTop: 14,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: checkingSlots
                    ? "var(--bg-hover)"
                    : availableSlots !== null && availableSlots <= 0
                      ? "rgba(239,68,68,0.1)"
                      : "rgba(34,197,94,0.1)",
                  border: `1px solid ${checkingSlots
                    ? "var(--border)"
                    : availableSlots !== null && availableSlots <= 0
                      ? "rgba(239,68,68,0.3)"
                      : "rgba(34,197,94,0.3)"
                    }`,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: "0.76rem",
                }}
              >
                <MdInfoOutline size={16} />
                {checkingSlots ? (
                  <span>Checking slot availability...</span>
                ) : availableSlots !== null && availableSlots <= 0 ? (
                  <span style={{ color: "#ef4444", fontWeight: 600 }}>
                    Deployment warning: Slots for this brand are fully booked in this radius.
                  </span>
                ) : (
                  <span style={{ color: "#16a34a", fontWeight: 600 }}>
                    Location confirmed: Exclusivity slot is open for {selectedBrand.businessName}!
                  </span>
                )}
              </div>
            </div>

            {/* Brand & Menu Items Card */}
            <div className="bf-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  2. Selected Brand &amp; Recipes
                </span>
                <button
                  type="button"
                  className="app_btn app_btn_cancel"
                  style={{ height: 30, fontSize: "0.72rem", padding: "0 10px" }}
                  onClick={() => setStep(2)}
                >
                  Change Brand
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: selectedBrand.branding?.color || "var(--bg-hover)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                  }}
                >
                  {selectedBrand.branding?.logo ? (
                    <img
                      src={selectedBrand.branding.logo}
                      alt={selectedBrand.businessName}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <MdStorefront size={22} color="#fff" />
                  )}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-heading)", margin: 0 }}>
                      {selectedBrand.businessName}
                    </h4>
                    {(selectedBrand.origin || selectedBrand.branding?.origin) && (
                      <span
                        style={{
                          fontSize: "0.64rem",
                          fontWeight: 700,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: "rgba(203,108,220,0.08)",
                          color: "var(--accent)",
                          border: "1px solid rgba(203,108,220,0.25)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        📍 {selectedBrand.origin || selectedBrand.branding?.origin}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                    {selectedMenuIds.length} of {brandMenuItems.length} recipes and menu items selected
                  </span>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <RoyaltyBadge percent={royaltyPercent} loading={loadingRoyalty} />
                </div>
              </div>

              {brandMenuItems.length > 0 && (
                <BrandMenuSelector
                  items={brandMenuItems}
                  selectedIds={selectedMenuIds}
                  onToggle={(id) =>
                    setSelectedMenuIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
                  }
                  onToggleAll={() =>
                    setSelectedMenuIds((prev) => (prev.length === brandMenuItems.length ? [] : brandMenuItems.map((m) => m.id)))
                  }
                  onOpen={setActiveMenu}
                />
              )}

              {selectedMenuIds.length > 0 && (
                <button
                  type="button"
                  className="app_btn"
                  onClick={() => setShowProjection(true)}
                  style={{ marginTop: 14, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  <MdTrendingUp size={18} /> Project Profit for {selectedMenuIds.length} Menu{selectedMenuIds.length === 1 ? "" : "s"}
                </button>
              )}
            </div>
          </div>

          {/* Checkout & E-Sign Sidebar */}
          <div
            className="bf-card bf-sticky"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 24,
              position: "sticky",
              top: 24,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <MdOutlineReceiptLong size={20} style={{ color: "var(--accent)" }} />
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-heading)", margin: 0 }}>
                Franchise Investment
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              {/* Section 1: Brand Fees */}
              <div>
                <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  Brand License Fees
                </span>
                {vendorPayments.length === 0 ? (
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                    No custom brand fees configured.
                  </div>
                ) : (
                  vendorPayments.map((p, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: 4 }}>
                      <span style={{ color: "var(--text-body)" }}>{p.title}</span>
                      <strong style={{ color: "var(--text-heading)" }}>
                        {fmt(parseFloat(p.amount) || 0, currency)}
                      </strong>
                    </div>
                  ))
                )}
              </div>

              {/* Section 2: Location Bills (for Cloud Kitchen and Store Front) */}
              {(locationForm.outletType === "CLOUD_KITCHEN" || locationForm.outletType === "STORE_FRONT") && (
                <>
                  <div style={{ height: 1, background: "var(--border)", margin: "2px 0" }} />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                        Location Facility Bills
                      </span>
                      {selectedCloudLocation && (
                        <span
                          style={{
                            fontSize: "0.68rem",
                            color: locationForm.outletType === "STORE_FRONT" ? "#d97706" : "#6366f1",
                            fontWeight: 700,
                          }}
                        >
                          {selectedCloudLocation.name}
                        </span>
                      )}
                    </div>

                    {selectedLocationBills.length === 0 ? (
                      <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                        No recurring facility bills configured for this location.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {selectedLocationBills.map((bill, idx) => (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: "0.82rem" }}>
                            <div>
                              <span style={{ color: "var(--text-body)", display: "block", fontWeight: 600 }}>{bill.title}</span>
                              <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
                                {bill.recurring && (
                                  <span style={{ fontSize: "0.62rem", color: "#6366f1", background: "rgba(99,102,241,0.1)", padding: "1px 5px", borderRadius: 4 }}>
                                    {bill.intervalInDays ? `Every ${bill.intervalInDays}d` : "Recurring"}
                                  </span>
                                )}
                                {bill.refundable && (
                                  <span style={{ fontSize: "0.62rem", color: "#16a34a", background: "rgba(22,163,74,0.1)", padding: "1px 5px", borderRadius: 4 }}>
                                    Refundable Deposit
                                  </span>
                                )}
                              </div>
                            </div>
                            <strong style={{ color: "var(--text-heading)", marginLeft: 8 }}>
                              {fmt(parseFloat(bill.amount) || 0, currency)}
                            </strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Section 3: Platform Setup & Licensing */}
              {filteredGlobalPayments.length > 0 && (
                <>
                  <div style={{ height: 1, background: "var(--border)", margin: "2px 0" }} />
                  <div>
                    <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                      Platform Setup &amp; Licensing
                    </span>

                    {/* Non-optional Platform Payments */}
                    {mandatoryGlobalItems.map((p, idx) => {
                      const isPct = Boolean(p.isPercentage);
                      const amt = isPct
                        ? totalVendorPayments * ((parseFloat(p.amount) || 0) / 100)
                        : parseFloat(p.amount) || 0;
                      return (
                        <div key={`mand-${idx}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: "0.82rem", marginBottom: 6 }}>
                          <div>
                            <span style={{ color: "var(--text-body)", display: "block" }}>
                              {p.title} {isPct ? `(${p.amount}%)` : ""}
                            </span>
                            <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
                              {p.recurring && (
                                <span style={{ fontSize: "0.62rem", color: "#6366f1", background: "rgba(99,102,241,0.1)", padding: "1px 5px", borderRadius: 4 }}>
                                  {p.intervalInDays ? `Every ${p.intervalInDays}d` : "Recurring"}
                                </span>
                              )}
                              {p.refundable && (
                                <span style={{ fontSize: "0.62rem", color: "#16a34a", background: "rgba(22,163,74,0.1)", padding: "1px 5px", borderRadius: 4 }}>
                                  Refundable Deposit
                                </span>
                              )}
                            </div>
                          </div>
                          <strong style={{ color: "var(--text-heading)", marginLeft: 8 }}>
                            {fmt(amt, currency)}
                          </strong>
                        </div>
                      );
                    })}

                    {/*  & Services (Checkboxes) */}
                    {optionalGlobalItems.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                          :
                        </span>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {optionalGlobalItems.map((p, idx) => {
                            const isPct = Boolean(p.isPercentage);
                            const amt = isPct
                              ? totalVendorPayments * ((parseFloat(p.amount) || 0) / 100)
                              : parseFloat(p.amount) || 0;
                            const isChecked = selectedOptionalPayments.includes(p.title);
                            return (
                              <label
                                key={`opt-${idx}`}
                                onClick={() => toggleOptionalPayment(p.title)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  fontSize: "0.82rem",
                                  padding: "8px 10px",
                                  borderRadius: 8,
                                  background: isChecked ? "rgba(203,108,220,0.08)" : "var(--bg-hover)",
                                  border: `1px solid ${isChecked ? "var(--accent)" : "var(--border)"}`,
                                  cursor: "pointer",
                                  userSelect: "none",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => { }}
                                    style={{ accentColor: "var(--accent)", cursor: "pointer", margin: 0 }}
                                  />
                                  <div>
                                    <span style={{ color: "var(--text-heading)", fontWeight: 600, display: "block" }}>
                                      {p.title} {isPct ? `(${p.amount}%)` : ""}
                                    </span>
                                    <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 2 }}>
                                      {p.recurring && (
                                        <span style={{ fontSize: "0.62rem", color: "#6366f1", background: "rgba(99,102,241,0.1)", padding: "1px 5px", borderRadius: 4 }}>
                                          {p.intervalInDays ? `Every ${p.intervalInDays}d` : "Recurring"}
                                        </span>
                                      )}
                                      <span style={{ fontSize: "0.68rem", color: isChecked ? "var(--accent)" : "var(--text-muted)" }}>
                                        {p.description || "Optional add-on service"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <strong style={{ color: isChecked ? "var(--text-heading)" : "var(--text-muted)" }}>
                                  {fmt(amt, currency)}
                                </strong>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Total Due */}
            <div
              style={{
                paddingTop: 16,
                borderTop: "2px dashed var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 20,
              }}
            >
              <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-heading)" }}>
                Total Due
              </span>
              <span style={{ fontSize: "1.35rem", fontWeight: 900, color: "var(--accent)" }}>
                {fmt(totalFranchiseCost, currency)}
              </span>
            </div>
            {isConverted(currency) && (
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textAlign: "right", marginTop: -12, marginBottom: 16 }}>
                Billed in {currency} {totalFranchiseCost.toLocaleString()}. Converted amounts are estimates based on the selected state's currency.
              </p>
            )}

            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.4, marginBottom: 20 }}>
              An invoice will be generated. Once paid, your location bills and franchise deployment will be activated.
            </p>

            <button
              type="button"
              className="app_btn app_btn_confirm"
              style={{ width: "100%", height: 46, fontSize: "0.88rem", fontWeight: 800 }}
              disabled={submitting}
              onClick={() => setShowSignDrawer(true)}
            >
              Review &amp; Sign Agreement →
            </button>
          </div>
        </div>
      )}

      {/* ── E-SIGN DRAWER ─────────────────────────────────── */}
      {showSignDrawer && (
        <ESignDrawer
          isOpen={showSignDrawer}
          onClose={() => setShowSignDrawer(false)}
          title={`Franchise Agreement: ${selectedBrand?.businessName}`}
          description="Review the franchise licensing terms and provide your e-signature to complete your purchase."
          templateText={countrySettings?.terms}
          variables={{
            buyer_name: user?.fullName || user?.email || "Franchisee Partner",
            buyer_address: `${locationForm.address}, ${locationForm.city}, ${locationForm.stateName}`,
            brand_name: selectedBrand?.businessName || "Nora Brand Partner",
            purchase_price: totalFranchiseCost.toLocaleString(),
            currency: currency,
            outlet_type:
              locationForm.outletType === "CLOUD_KITCHEN"
                ? "Commercial Cloud Kitchen"
                : locationForm.outletType === "STORE_FRONT"
                  ? "Retail Store Front"
                  : "Modular Physical Kiosk",
            location_address: `${locationForm.name} - ${locationForm.address}, ${locationForm.city}`,
          }}
          submitting={submitting}
          onSubmit={handleSignSubmit}
        />
      )}

      {/* ── DRAWERS (FRANCHISE MENU & PROFIT PROJECTION) ─── */}
      <FranchiseMenuDrawer
        menu={activeMenu}
        stateId={locationForm.stateId || selectedCloudLocation?.stateId}
        currency={currency}
        fmt={fmt}
        plan={plan}
        onClose={() => setActiveMenu(null)}
      />

      <ProfitProjectionDrawer
        isOpen={showProjection}
        onClose={() => setShowProjection(false)}
        menus={brandMenuItems.filter((m) => selectedMenuIds.includes(m.id))}
        stateId={locationForm.stateId || selectedCloudLocation?.stateId}
        currency={currency}
        fmt={fmt}
        plan={plan}
        royaltyPercent={royaltyPercent ?? (selectedBrand ? getBrandRoyalty(selectedBrand.id) : null)}
        externalCostMap={menuCostMap}
      />

      {/* Lightbox Preview Modal for Cloud Kitchen Images */}
      {previewModalImage && (
        <div
          className="bf-lightbox"
          onClick={() => setPreviewModalImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(6px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              maxWidth: "92vw",
              maxHeight: "90vh",
              background: "#000",
              borderRadius: 14,
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            }}
          >
            <button
              onClick={() => setPreviewModalImage(null)}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                background: "rgba(0,0,0,0.65)",
                border: "none",
                color: "#fff",
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 10,
              }}
            >
              <MdClose size={22} />
            </button>
            <img
              src={previewModalImage}
              alt="Cloud Kitchen Facility Preview"
              style={{
                display: "block",
                maxWidth: "100%",
                maxHeight: "85vh",
                objectFit: "contain",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
