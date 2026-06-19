import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  MdClose,
  MdCheck,
  MdCircle,
  MdEdit,
  MdAdd,
  MdOutlineAccountBalanceWallet,
  MdOutlineReceiptLong,
  MdOutlinePerson,
  MdOutlineShield,
  MdExpandMore,
  MdExpandLess,
  MdUpload,
} from "react-icons/md";
import { LuPlus } from "react-icons/lu";
import Drawer from "../../components/Drawer";
import api from "../../api/axios";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });
const fmtDt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : "—";

const ALL_ROLES = [
  "CUSTOMER",
  "VENDOR",
  "OPERATOR",
  "SUPPLIER",
  "AGGREGATOR",
  "ADMIN",
  "STAFF"
];

const ROLE_COLORS = {
  ADMIN: {
    bg: "rgba(203,108,220,0.1)",
    color: "var(--accent)",
    border: "rgba(203,108,220,0.25)",
  },
  VENDOR: {
    bg: "rgba(59,130,246,0.1)",
    color: "#3b82f6",
    border: "rgba(59,130,246,0.25)",
  },
  OPERATOR: {
    bg: "rgba(245,158,11,0.1)",
    color: "#f59e0b",
    border: "rgba(245,158,11,0.25)",
  },
  CUSTOMER: {
    bg: "rgba(34,197,94,0.1)",
    color: "#16a34a",
    border: "rgba(34,197,94,0.25)",
  },
  SUPPLIER: {
    bg: "rgba(139,92,246,0.1)",
    color: "#8b5cf6",
    border: "rgba(139,92,246,0.25)",
  },
  AGGREGATOR: {
    bg: "rgba(6,182,212,0.1)",
    color: "#06b6d4",
    border: "rgba(6,182,212,0.25)",
  },
};

function Section({ icon: Icon, title, children, defaultOpen = true, extra }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: 1,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px 0",
            fontFamily: "inherit",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "var(--bg-active)",
              border: "1px solid rgba(203,108,220,0.2)",
              color: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon size={14} />
          </div>
          <span
            style={{
              fontSize: "0.82rem",
              fontWeight: 800,
              color: "var(--text-heading)",
              flex: 1,
              textAlign: "left",
            }}
          >
            {title}
          </span>
          {open ? (
            <MdExpandLess size={16} style={{ color: "var(--text-muted)" }} />
          ) : (
            <MdExpandMore size={16} style={{ color: "var(--text-muted)" }} />
          )}
        </button>
        {extra && <div style={{ paddingLeft: 8 }}>{extra}</div>}
      </div>
      {open && <div style={{ paddingTop: 6 }}>{children}</div>}
    </div>
  );
}

function InvoiceRow({ inv, onMarkPaid, onDiscount }) {
  const [expanded, setExpanded] = useState(false);
  const [paying, setPaying] = useState(false);
  const [discounting, setDiscounting] = useState(false);
  const [discountAmount, setDiscountAmount] = useState("");
  const isPaid = inv.status === "PAID";
  const s = isPaid
    ? {
      bg: "rgba(34,197,94,0.1)",
      color: "#16a34a",
      border: "rgba(34,197,94,0.25)",
    }
    : {
      bg: "rgba(234,179,8,0.1)",
      color: "#ca8a04",
      border: "rgba(234,179,8,0.25)",
    };

  const handleMark = async () => {
    setPaying(true);
    try {
      await onMarkPaid(inv.id);
    } finally {
      setPaying(false);
    }
  };

  const handleApplyDiscount = async (e) => {
    e.stopPropagation();
    if (!discountAmount || isNaN(discountAmount)) return;
    setPaying(true);
    try {
      await onDiscount(inv.id, Number(discountAmount));
      setDiscounting(false);
      setDiscountAmount("");
    } catch {
      // Toast already handled in parent
    } finally {
      setPaying(false);
    }
  };

  return (
    <div
      style={{
        background: "var(--bg-hover)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: 6,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          cursor: "pointer",
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 3,
            }}
          >
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "var(--text-body)",
                fontFamily: "monospace",
              }}
            >
              #{inv.id.slice(0, 8).toUpperCase()}
            </span>
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: 800,
                padding: "1px 7px",
                borderRadius: 999,
                background: s.bg,
                color: s.color,
                border: `1px solid ${s.border}`,
              }}
            >
              {inv.status}
            </span>
          </div>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
            Due: {fmtDt(inv.dueDate)} · {inv.currency} {fmt(inv.total)}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {!isPaid && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {discounting ? (
                <div
                  style={{ display: "flex", alignItems: "center", gap: 4 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="number"
                    style={{
                      width: 66,
                      height: 26,
                      fontSize: "0.7rem",
                      borderRadius: 6,
                      border: "1px solid var(--accent)",
                      background: "var(--bg-active)",
                      color: "var(--accent)",
                      padding: "0 8px",
                      outline: "none",
                      fontWeight: 700,
                    }}
                    placeholder="Amt"
                    autoFocus
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                  />
                  <button
                    className={`app_btn app_btn_confirm${paying ? " btn_loading" : ""}`}
                    style={{
                      height: 26,
                      padding: "0 10px",
                      fontSize: "0.7rem",
                      borderRadius: 6,
                    }}
                    onClick={handleApplyDiscount}
                    disabled={paying || !discountAmount}
                  >
                    <span className="btn_text">Apply</span>
                  </button>
                  <button
                    className="app_btn app_btn_cancel"
                    style={{ height: 26, padding: "0 6px", borderRadius: 6 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDiscounting(false);
                      setDiscountAmount("");
                    }}
                    disabled={paying}
                  >
                    <MdClose size={12} />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    style={{
                      height: 26,
                      padding: "0 8px",
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      color: "var(--text-muted)",
                      background: "var(--bg-card)",
                      border: "1px dashed var(--border)",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDiscounting(true);
                    }}
                  >
                    DISCOUNT
                  </button>
                  <button
                    className={`app_btn app_btn_confirm${paying ? " btn_loading" : ""}`}
                    style={{
                      height: 26,
                      padding: "0 10px",
                      fontSize: "0.7rem",
                      position: "relative",
                      borderRadius: 6,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMark();
                    }}
                    disabled={paying}
                  >
                    <span className="btn_text">Mark Paid</span>
                    {paying && (
                      <span
                        className="btn_loader"
                        style={{ width: 11, height: 11 }}
                      />
                    )}
                  </button>
                </>
              )}
            </div>
          )}

          {expanded ? (
            <MdExpandLess size={14} style={{ color: "var(--text-muted)" }} />
          ) : (
            <MdExpandMore size={14} style={{ color: "var(--text-muted)" }} />
          )}
        </div>
      </div>
      {expanded && inv.items?.length > 0 && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "8px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {inv.items.map((item, i) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <span
                style={{
                  flex: 1,
                  fontSize: "0.72rem",
                  color: "var(--text-body)",
                }}
              >
                {item.title} × {item.quantity}
              </span>
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "var(--text-heading)",
                }}
              >
                {inv.currency} {fmt(item.amount * item.quantity)}
              </span>
            </div>
          ))}
          {inv.discount > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "var(--accent)",
                paddingLeft: 8,
              }}
            >
              <span>Discount</span>
              <span>
                - {inv.currency} {fmt(inv.discount)}
              </span>
            </div>
          )}
          {inv.paidAt && (
            <div
              style={{
                fontSize: "0.68rem",
                color: "var(--text-muted)",
                marginTop: 4,
              }}
            >
              Paid: {fmtDt(inv.paidAt)} via {inv.paymentMethod}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminUserDetail({ user: initialUser, onClose }) {
  const [currentUser, setCurrentUser] = useState(initialUser);
  const user = currentUser;

  const [wallet, setWallet] = useState(null);
  const [transactions, setTxns] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Roles
  const [roles, setRoles] = useState([]);
  const [savingRoles, setSavingRoles] = useState(false);

  // Wallet actions
  const [walletAction, setWalletAction] = useState(null); // "credit" | "debit"
  const [confirmMarkPaid, setConfirmMarkPaid] = useState(null); // invoice id
  const [walletAmount, setWalletAmount] = useState("");
  const [walletNote, setWalletNote] = useState("");
  const [doingWallet, setDoingWallet] = useState(false);
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [isEditingWalletSettings, setIsEditingWalletSettings] = useState(false);
  const [editCurrency, setEditCurrency] = useState("");
  const [editWithdrawalLimit, setEditWithdrawalLimit] = useState("");

  // Invoice create
  const [showInvForm, setShowInvForm] = useState(false);
  const [invForm, setInvForm] = useState({
    currency: "NGN",
    dueDate: "",
    items: [{ title: "", amount: "", quantity: 1, description: "" }],
  });
  const [creatingInv, setCreatingInv] = useState(false);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [fullName, setFullName] = useState(initialUser.fullName || "");
  const [email, setEmail] = useState(initialUser.email || "");
  const [phone, setPhone] = useState(initialUser.phone || "");
  const [isActive, setIsActive] = useState(initialUser.isActive ?? true);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  // KYC Edit State
  const [isEditingKyc, setIsEditingKyc] = useState(false);
  const [savingKyc, setSavingKyc] = useState(false);
  const [address, setAddress] = useState(initialUser.address || "");
  const [city, setCity] = useState(initialUser.city || "");
  const [country, setCountry] = useState(initialUser.country || "");
  const [govIdType, setGovIdType] = useState(initialUser.governmentIdType || "");
  const [govIdNumber, setGovIdNumber] = useState(initialUser.governmentIdNumber || "");
  const [bvnVerified, setBvnVerified] = useState(initialUser.bvnVerified ?? false);
  const [kycStatus, setKycStatus] = useState(initialUser.kycStatus || "PENDING");
  const [govIdImageFile, setGovIdImageFile] = useState(null);
  const [govIdImagePreview, setGovIdImagePreview] = useState(null);

  // Custom permissions
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [permissionGroups, setPermissionGroups] = useState({});
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  useEffect(() => {
    setLoadingPermissions(true);
    api.get("/account/permissions")
      .then((res) => {
        setPermissionGroups(res.data.data || {});
      })
      .catch((err) => {
        console.error("Failed to load permissions catalog", err);
      })
      .finally(() => {
        setLoadingPermissions(false);
      });
  }, []);

  const formatPermissionLabel = (value) => {
    if (!value) return "";
    return value
      .split(/[._-]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const togglePermission = (permission) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const toggleGroupPermissions = (groupKeys) => {
    const allSelected = groupKeys.every((key) => selectedPermissions.includes(key));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((p) => !groupKeys.includes(p)));
    } else {
      setSelectedPermissions((prev) => [
        ...prev,
        ...groupKeys.filter((key) => !prev.includes(key)),
      ]);
    }
  };

  const handleSavePermissions = async () => {
    setSavingPermissions(true);
    try {
      const payload = new FormData();
      payload.append("permissions", JSON.stringify(selectedPermissions));

      const res = await api.put(`/account/${currentUser.id}`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCurrentUser(res.data.data);
      toast.success("Direct permissions updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update permissions");
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const payload = new FormData();
      payload.append("fullName", fullName);
      payload.append("email", email);
      payload.append("phone", phone);
      payload.append("isActive", isActive);
      if (profileImageFile) {
        payload.append("image", profileImageFile);
      }

      const res = await api.put(`/account/${currentUser.id}`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCurrentUser(res.data.data);
      setIsEditingProfile(false);
      setProfileImageFile(null);
      setProfileImagePreview(null);
      toast.success("Profile details updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveKyc = async () => {
    setSavingKyc(true);
    try {
      const payload = new FormData();
      payload.append("address", address);
      payload.append("city", city);
      payload.append("country", country);
      payload.append("governmentIdType", govIdType);
      payload.append("governmentIdNumber", govIdNumber);
      payload.append("bvnVerified", bvnVerified);
      payload.append("kycStatus", kycStatus);
      if (govIdImageFile) {
        payload.append("governmentIdImage", govIdImageFile);
      }

      const res = await api.put(`/account/${currentUser.id}`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCurrentUser(res.data.data);
      setIsEditingKyc(false);
      setGovIdImageFile(null);
      setGovIdImagePreview(null);
      toast.success("KYC details updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update KYC");
    } finally {
      setSavingKyc(false);
    }
  };

  useEffect(() => {
    setCurrentUser(initialUser);
  }, [initialUser]);

  useEffect(() => {
    // Sync if currentUser changes
    setFullName(currentUser?.fullName || "");
    setEmail(currentUser?.email || "");
    setPhone(currentUser?.phone || "");
    setIsActive(currentUser?.isActive ?? true);
    setAddress(currentUser?.address || "");
    setCity(currentUser?.city || "");
    setCountry(currentUser?.country || "");
    setGovIdType(currentUser?.governmentIdType || "");
    setGovIdNumber(currentUser?.governmentIdNumber || "");
    setBvnVerified(currentUser?.bvnVerified ?? false);
    setKycStatus(currentUser?.kycStatus || "PENDING");
    setRoles(currentUser?.roles?.map((r) => r.role || r) || []);
    setSelectedPermissions(currentUser?.permissions || []);
  }, [currentUser]);

  useEffect(() => {
    if (!user?.id) return;
    // Fetch wallet + invoices in parallel
    setLoading(true);
    Promise.allSettled([
      api.get("/finance/wallet", { params: { userId: user.id } }),
      api.get("/finance/wallet/transactions", { params: { userId: user.id } }),
      api.get("/finance/invoice", { params: { userId: user.id } }),
    ])
      .then(([wR, tR, iR]) => {
        if (wR.status === "fulfilled") setWallet(wR.value.data.data);
        if (tR.status === "fulfilled") {
          const d = tR.value.data.data;
          setTxns(Array.isArray(d) ? d : d?.items || []);
        }
        if (iR.status === "fulfilled") {
          const d = iR.value.data.data;
          setInvoices(Array.isArray(d) ? d : []);
        }
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleSaveRoles = async () => {
    if (!roles.length) return toast.error("Select at least one role");
    setSavingRoles(true);
    try {
      await api.put(`/account/${user.id}/roles`, { roles });
      toast.success("Roles updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSavingRoles(false);
    }
  };

  const toggleRole = (role) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const handleWalletAction = async () => {
    if (!walletAmount || Number(walletAmount) < 1)
      return toast.error("Enter a valid amount");
    setDoingWallet(true);
    try {
      // Debit = negative amount, Credit = positive
      const amount =
        walletAction === "debit" ? -Number(walletAmount) : Number(walletAmount);
      await api.post("/finance/wallet/manual-credit", {
        userId: user.id,
        amount,
        description: walletNote || undefined,
      });
      toast.success(
        walletAction === "debit" ? "Wallet debited" : "Wallet credited",
      );
      setWalletAction(null);
      setWalletAmount("");
      setWalletNote("");
      const r = await api.get("/finance/wallet", {
        params: { userId: user.id },
      });
      setWallet(r.data.data);
      // Also refresh transactions
      const t = await api.get("/finance/wallet/transactions", {
        params: { userId: user.id },
      });
      const td = t.data.data;
      setTxns(Array.isArray(td) ? td : td?.items || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setDoingWallet(false);
    }
  };

  const handleToggleBlock = async (field, currentValue) => {
    try {
      setUpdatingSettings(true);
      await api.patch("/finance/wallet/settings", {
        userId: user.id,
        [field]: !currentValue,
      });
      const r = await api.get("/finance/wallet", {
        params: { userId: user.id },
      });
      setWallet(r.data.data);
      toast.success("Wallet settings updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update wallet settings");
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleSaveWalletSettings = async () => {
    try {
      setUpdatingSettings(true);
      await api.patch("/finance/wallet/settings", {
        userId: user.id,
        currency: editCurrency.trim().toUpperCase(),
        withdrawalLimit: editWithdrawalLimit ? Number(editWithdrawalLimit) : null,
      });
      const r = await api.get("/finance/wallet", {
        params: { userId: user.id },
      });
      setWallet(r.data.data);
      setIsEditingWalletSettings(false);
      toast.success("Wallet settings updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update wallet settings");
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleMarkPaid = async (invId) => {
    setConfirmMarkPaid(invId);
  };

  const confirmAndMarkPaid = async () => {
    const invId = confirmMarkPaid;
    setConfirmMarkPaid(null);
    try {
      await api.patch(`/finance/invoice/${invId}/mark-paid`);
      toast.success("Marked as paid");
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invId
            ? { ...inv, status: "PAID", paidAt: new Date().toISOString() }
            : inv,
        ),
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const updateInvItem = (i, k, v) =>
    setInvForm((p) => {
      const items = [...p.items];
      items[i] = { ...items[i], [k]: v };
      return { ...p, items };
    });
  const addInvItem = () =>
    setInvForm((p) => ({
      ...p,
      items: [
        ...p.items,
        { title: "", amount: "", quantity: 1, description: "" },
      ],
    }));
  const removeInvItem = (i) =>
    setInvForm((p) => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));

  const handleCreateInvoice = async () => {
    if (!invForm.dueDate) return toast.error("Due date required");
    if (
      !invForm.items.length ||
      invForm.items.some((it) => !it.title || !it.amount)
    )
      return toast.error("Each item needs title and amount");
    setCreatingInv(true);
    try {
      await api.post("/finance/invoice", {
        userId: user.id,
        currency: invForm.currency,
        dueDate: invForm.dueDate,
        items: invForm.items.map((it) => ({
          title: it.title,
          amount: Number(it.amount),
          quantity: Number(it.quantity) || 1,
          description: it.description || "",
        })),
      });
      toast.success("Invoice created");
      setShowInvForm(false);
      setInvForm({
        currency: "NGN",
        dueDate: "",
        items: [{ title: "", amount: "", quantity: 1, description: "" }],
      });
      const r = await api.get("/finance/invoice", {
        params: { userId: user.id },
      });
      setInvoices(Array.isArray(r.data.data) ? r.data.data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setCreatingInv(false);
    }
  };

  const handleApplyInvDiscount = async (invId, discount) => {
    try {
      const res = await api.patch(`/finance/invoice/${invId}/discount`, {
        discount,
      });
      toast.success("Discount applied successfully");
      setInvoices((prev) =>
        prev.map((i) => (i.id === invId ? res.data.data : i)),
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to apply discount");
      throw err;
    }
  };

  const handleUnlock = async () => {
    try {
      await api.put(`/account/${user.id}/unlock`);
      toast.success("Account unlocked");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <>
      <Drawer
        isOpen
        onClose={onClose}
        title={user.fullName || "User"}
        description={user.email}
        width={540}
      >
        {/* Profile Header Card */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: 16,
            background: "var(--bg-active)",
            border: "1px solid rgba(203,108,220,0.2)",
            borderRadius: 12,
            marginBottom: 20,
          }}
        >
          <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
            <img
              src={profileImagePreview || user.image || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"}
              alt={user.fullName}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid var(--accent)",
              }}
              onError={(e) => {
                e.target.src = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
              }}
            />
            {isEditingProfile && (
              <label
                style={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  border: "2px solid var(--bg-card)",
                }}
              >
                <MdUpload size={14} />
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setProfileImageFile(file);
                      setProfileImagePreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "1.1rem", fontWeight: 800, color: "var(--text-heading)" }}>
              {user.fullName || "User"}
            </h3>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", wordBreak: "break-all" }}>
              {user.email}
            </span>
          </div>
        </div>

        {/* Header chips */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 20,
          }}
        >
          {user.roles?.map((r) => {
            const role = r.role || r;
            const c = ROLE_COLORS[role] || ROLE_COLORS.CUSTOMER;
            return (
              <span
                key={role}
                style={{
                  fontSize: "0.62rem",
                  fontWeight: 800,
                  padding: "2px 9px",
                  borderRadius: 999,
                  background: c.bg,
                  color: c.color,
                  border: `1px solid ${c.border}`,
                  textTransform: "uppercase",
                }}
              >
                {role}
              </span>
            );
          })}
          {user.passwordLockedUntil && (
            <button
              className="app_btn app_btn_cancel"
              style={{ height: 26, padding: "0 10px", fontSize: "0.7rem" }}
              onClick={handleUnlock}
            >
              Unlock Account
            </button>
          )}
        </div>

        {/* Basic info */}
        <Section
          icon={MdOutlinePerson}
          title="Profile"
          extra={
            !isEditingProfile && (
              <button
                onClick={() => setIsEditingProfile(true)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  fontFamily: "inherit",
                }}
              >
                <MdEdit size={14} /> Edit
              </button>
            )
          }
        >
          {isEditingProfile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="admin_form_grid" style={{ marginBottom: 0 }}>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label className="modal-label">Full Name</label>
                  <input
                    className="modal-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                  />
                </div>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label className="modal-label">Email</label>
                  <input
                    className="modal-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                  />
                </div>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label className="modal-label">Phone</label>
                  <input
                    className="modal-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone Number"
                  />
                </div>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label className="modal-label">Status</label>
                  <select
                    className="modal-input"
                    value={String(isActive)}
                    onChange={(e) => setIsActive(e.target.value === "true")}
                    style={{
                      background: "var(--bg-active)",
                      color: "var(--text-body)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  className="app_btn app_btn_cancel"
                  style={{ height: 34 }}
                  onClick={() => {
                    setIsEditingProfile(false);
                    setProfileImageFile(null);
                    setProfileImagePreview(null);
                    setFullName(currentUser?.fullName || "");
                    setEmail(currentUser?.email || "");
                    setPhone(currentUser?.phone || "");
                    setIsActive(currentUser?.isActive ?? true);
                  }}
                  disabled={savingProfile}
                >
                  Cancel
                </button>
                <button
                  className={`app_btn app_btn_confirm${savingProfile ? " btn_loading" : ""}`}
                  style={{ height: 34, minWidth: 90, position: "relative" }}
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                >
                  <span className="btn_text">Save</span>
                  {savingProfile && (
                    <span className="btn_loader" style={{ width: 12, height: 12 }} />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
            >
              {[
                { l: "Phone", v: user.phone || "—" },
                { l: "Joined", v: fmtDt(user.createdAt) },
                { l: "Email Verified", v: user.emailVerified ? "Yes" : "No" },
                { l: "Phone Verified", v: user.phoneVerified ? "Yes" : "No" },
                { l: "Active", v: user.isActive ? "Yes" : "No" },
                { l: "Attempts", v: user.passwordAttempts ?? "—" },
              ].map(({ l, v }) => (
                <div
                  key={l}
                  style={{
                    padding: "8px 10px",
                    background: "var(--bg-hover)",
                    border: "1px solid var(--border)",
                    borderRadius: 9,
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 3,
                    }}
                  >
                    {l}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "var(--text-body)",
                    }}
                  >
                    {String(v)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* KYC Section */}
        <Section
          icon={MdOutlinePerson}
          title="KYC"
          defaultOpen={true}
          extra={
            !isEditingKyc && (
              <button
                onClick={() => setIsEditingKyc(true)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  fontFamily: "inherit",
                }}
              >
                <MdEdit size={14} /> Edit
              </button>
            )
          }
        >
          {isEditingKyc ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="admin_form_grid" style={{ marginBottom: 0 }}>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label className="modal-label">Address</label>
                  <input
                    className="modal-input"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street Address"
                  />
                </div>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label className="modal-label">City</label>
                  <input
                    className="modal-input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label className="modal-label">Country</label>
                  <input
                    className="modal-input"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Country"
                  />
                </div>
                {/* <div className="form-field" style={{ marginBottom: 0 }}>
                  <label className="modal-label">BVN</label>
                  <input
                    className="modal-input"
                    value={bvn}
                    onChange={(e) => setBvn(e.target.value)}
                    placeholder="Bank Verification Number"
                  />
                </div> */}
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label className="modal-label">BVN Verified</label>
                  <select
                    className="modal-input"
                    value={String(bvnVerified)}
                    onChange={(e) => setBvnVerified(e.target.value === "true")}
                    style={{
                      background: "var(--bg-active)",
                      color: "var(--text-body)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <option value="true">Verified</option>
                    <option value="false">Not Verified</option>
                  </select>
                </div>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label className="modal-label">KYC Status</label>
                  <select
                    className="modal-input"
                    value={kycStatus}
                    onChange={(e) => setKycStatus(e.target.value)}
                    style={{
                      background: "var(--bg-active)",
                      color: "var(--text-body)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label className="modal-label">Gov ID Type</label>
                  <input
                    className="modal-input"
                    value={govIdType}
                    onChange={(e) => setGovIdType(e.target.value)}
                    placeholder="e.g. National ID, Passport"
                  />
                </div>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label className="modal-label">Gov ID Number</label>
                  <input
                    className="modal-input"
                    value={govIdNumber}
                    onChange={(e) => setGovIdNumber(e.target.value)}
                    placeholder="ID Number"
                  />
                </div>
              </div>

              {/* Gov ID Image Upload/Preview */}
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 4 }}>
                <div style={{ position: "relative" }}>
                  {govIdImagePreview || user.governmentIdImage ? (
                    <img
                      src={govIdImagePreview || user.governmentIdImage}
                      alt="gov-id-preview"
                      style={{
                        width: 140,
                        height: 90,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 140,
                        height: 90,
                        borderRadius: 8,
                        background: "var(--bg-active)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-muted)",
                        border: "1px dashed var(--border)",
                        fontSize: "0.8rem",
                      }}
                    >
                      No document
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label
                    className="app_btn"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                      height: 30,
                      padding: "0 12px",
                      fontSize: "0.75rem",
                    }}
                  >
                    <MdUpload size={14} /> Upload Document
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setGovIdImageFile(file);
                          setGovIdImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                  {govIdImageFile && (
                    <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", wordBreak: "break-all" }}>
                      Selected: {govIdImageFile.name}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
                <button
                  className="app_btn app_btn_cancel"
                  style={{ height: 34 }}
                  onClick={() => {
                    setIsEditingKyc(false);
                    setGovIdImageFile(null);
                    setGovIdImagePreview(null);
                    setAddress(currentUser?.address || "");
                    setCity(currentUser?.city || "");
                    setCountry(currentUser?.country || "");
                    setGovIdType(currentUser?.governmentIdType || "");
                    setGovIdNumber(currentUser?.governmentIdNumber || "");
                    setBvnVerified(currentUser?.bvnVerified ?? false);
                    setKycStatus(currentUser?.kycStatus || "PENDING");
                  }}
                  disabled={savingKyc}
                >
                  Cancel
                </button>
                <button
                  className={`app_btn app_btn_confirm${savingKyc ? " btn_loading" : ""}`}
                  style={{ height: 34, minWidth: 90, position: "relative" }}
                  onClick={handleSaveKyc}
                  disabled={savingKyc}
                >
                  <span className="btn_text">Save</span>
                  {savingKyc && (
                    <span className="btn_loader" style={{ width: 12, height: 12 }} />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    background: "var(--bg-hover)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 6 }}>
                    Address
                  </div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>
                    {user.address || "—"}
                  </div>
                </div>
                <div
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    background: "var(--bg-hover)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 6 }}>
                    City / Country
                  </div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>
                    {[user.city, user.country].filter(Boolean).join(" / ") || "—"}
                  </div>
                </div>
                <div
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    background: "var(--bg-hover)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 6 }}>
                    Government ID
                  </div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>
                    {user.governmentIdType || "—"}{" "}
                    {user.governmentIdNumber ? `· ${user.governmentIdNumber}` : ""}
                  </div>
                </div>
                <div
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    background: "var(--bg-hover)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 6 }}>
                    BVN
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {user.bvnVerified ? (
                      <span style={{ color: "green", fontWeight: 700 }}>Verified</span>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>Not verified</span>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    background: "var(--bg-hover)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 6 }}>
                    KYC Status
                  </div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>
                    {user.kycStatus === "APPROVED" ? (
                      <span style={{ color: "green" }}>{user.kycStatus}</span>
                    ) : user.kycStatus === "REJECTED" ? (
                      <span style={{ color: "red" }}>{user.kycStatus}</span>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>{user.kycStatus || "PENDING"}</span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
                <div>
                  {user.governmentIdImage ? (
                    <a href={user.governmentIdImage} target="_blank" rel="noreferrer">
                      <img
                        src={user.governmentIdImage}
                        alt="gov-id"
                        style={{
                          width: 140,
                          height: 90,
                          objectFit: "cover",
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                        }}
                      />
                    </a>
                  ) : (
                    <div
                      style={{
                        width: 140,
                        height: 90,
                        borderRadius: 8,
                        background: "var(--bg-active)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-muted)",
                        border: "1px dashed var(--border)",
                      }}
                    >
                      No document
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="app_btn app_btn_confirm"
                      onClick={async () => {
                        try {
                          await api.put(`/account/${user.id}`, {
                            kycStatus: "APPROVED",
                            kycVerifiedAt: new Date().toISOString(),
                          });
                          toast.success("KYC approved");
                          onClose();
                        } catch (err) {
                          toast.error(err.response?.data?.message || "Failed to approve KYC");
                        }
                      }}
                    >
                      <MdCheck /> Approve KYC
                    </button>
                    <button
                      className="app_btn app_btn_cancel"
                      onClick={async () => {
                        try {
                          await api.put(`/account/${user.id}`, {
                            kycStatus: "REJECTED",
                          });
                          toast.success("KYC rejected");
                          onClose();
                        } catch (err) {
                          toast.error(err.response?.data?.message || "Failed to reject KYC");
                        }
                      }}
                    >
                      Reject
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="app_btn"
                      onClick={async () => {
                        try {
                          await api.put(`/account/${user.id}`, {
                            bvnVerified: true,
                          });
                          toast.success("BVN marked verified");
                          onClose();
                        } catch (err) {
                          toast.error(err.response?.data?.message || "Failed to mark BVN");
                        }
                      }}
                    >
                      Mark BVN Verified
                    </button>
                    <button
                      className="app_btn app_btn_cancel"
                      onClick={async () => {
                        try {
                          await api.put(`/account/${user.id}`, {
                            bvnVerified: false,
                          });
                          toast.success("BVN unverified");
                          onClose();
                        } catch (err) {
                          toast.error(err.response?.data?.message || "Failed to unverify BVN");
                        }
                      }}
                    >
                      Unverify BVN
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </Section>

        {/* Roles editor */}
        <Section icon={MdOutlineShield} title="Roles">
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginBottom: 12,
            }}
          >
            {ALL_ROLES.map((role) => {
              const active = roles.includes(role);
              const c = ROLE_COLORS[role] || ROLE_COLORS.CUSTOMER;
              return (
                <button
                  key={role}
                  onClick={() => toggleRole(role)}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 8,
                    border: `1px solid ${active ? c.border : "var(--border)"}`,
                    background: active ? c.bg : "var(--bg-hover)",
                    color: active ? c.color : "var(--text-muted)",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {role}
                </button>
              );
            })}
          </div>
          <button
            className={`app_btn app_btn_confirm${savingRoles ? " btn_loading" : ""}`}
            style={{ height: 34, padding: "0 16px", position: "relative" }}
            onClick={handleSaveRoles}
            disabled={savingRoles}
          >
            <span className="btn_text">Save Roles</span>
            {savingRoles && (
              <span className="btn_loader" style={{ width: 12, height: 12 }} />
            )}
          </button>
        </Section>

        {/* Direct Permissions editor */}
        <Section icon={MdOutlineShield} title="Direct Permissions (Custom)" defaultOpen={false}>
          {loadingPermissions ? (
            <div
              className="page_loader_spinner"
              style={{ width: 20, height: 20, margin: "12px auto" }}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 12 }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                These permissions are granted directly to this user in addition to their role permissions.
              </div>

              {Object.entries(permissionGroups).map(([groupName, permsObj]) => {
                const perms = Object.entries(permsObj).map(([key, val]) => ({
                  label: formatPermissionLabel(val),
                  value: val,
                }));
                const groupValues = perms.map((p) => p.value);
                const allSelected = groupValues.every((val) => selectedPermissions.includes(val));

                return (
                  <div
                    key={groupName}
                    style={{
                      background: "var(--bg-hover)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      padding: 12,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: "1px solid var(--border)",
                        paddingBottom: 6,
                        marginBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          color: "var(--text-heading)",
                          letterSpacing: "0.03em",
                        }}
                      >
                        {groupName}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleGroupPermissions(groupValues)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--accent)",
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          fontFamily: "inherit",
                        }}
                      >
                        {allSelected ? "DESELECT ALL" : "SELECT ALL"}
                      </button>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "8px 12px",
                      }}
                    >
                      {perms.map((perm) => {
                        const isChecked = selectedPermissions.includes(perm.value);
                        return (
                          <label
                            key={perm.value}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              cursor: "pointer",
                              fontSize: "0.72rem",
                              color: isChecked ? "var(--text-body)" : "var(--text-muted)",
                              fontWeight: isChecked ? 700 : 500,
                              userSelect: "none",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePermission(perm.value)}
                              style={{
                                accentColor: "var(--accent)",
                                cursor: "pointer",
                                width: 14,
                                height: 14,
                              }}
                            />
                            <span
                              style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {perm.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            className={`app_btn app_btn_confirm${savingPermissions ? " btn_loading" : ""}`}
            style={{ height: 34, padding: "0 16px", position: "relative" }}
            onClick={handleSavePermissions}
            disabled={savingPermissions}
          >
            <span className="btn_text">Save Permissions</span>
            {savingPermissions && (
              <span className="btn_loader" style={{ width: 12, height: 12 }} />
            )}
          </button>
        </Section>

        {/* Wallet */}
        <Section icon={MdOutlineAccountBalanceWallet} title="Wallet">
          {loading ? (
            <div
              className="page_loader_spinner"
              style={{ width: 20, height: 20, margin: "12px auto" }}
            />
          ) : !wallet ? (
            <div
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                padding: "12px 0",
              }}
            >
              No wallet found.
            </div>
          ) : (
            <>
              {/* Balance card */}
              <div
                style={{
                  background: "var(--bg-active)",
                  border: "1px solid rgba(203,108,220,0.2)",
                  borderRadius: 12,
                  padding: "14px 16px",
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 4,
                    }}
                  >
                    Balance
                  </div>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 900,
                      color: "var(--accent)",
                    }}
                  >
                    {wallet.currency} {fmt(wallet.balance)}
                  </div>
                </div>
                {wallet.bankName && (
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        color: "var(--text-body)",
                      }}
                    >
                      {wallet.bankName}
                    </div>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {wallet.bankAccount}
                    </div>
                    <div
                      style={{
                        fontSize: "0.68rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {wallet.accountName}
                    </div>
                  </div>
                )}
              </div>

              {/* Wallet blocking controls */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "10px 12px",
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  marginBottom: 12,
                }}
              >
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>Block Transactions</span>
                  <label className="switch_label" style={{ position: "relative", display: "inline-block", width: 34, height: 20 }}>
                    <input
                      type="checkbox"
                      checked={!!wallet.blockTransactions}
                      onChange={() => handleToggleBlock("blockTransactions", !!wallet.blockTransactions)}
                      disabled={updatingSettings}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        cursor: "pointer",
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: wallet.blockTransactions ? "var(--accent)" : "#ccc",
                        transition: ".2s",
                        borderRadius: 20,
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          content: '""',
                          height: 14, width: 14,
                          left: wallet.blockTransactions ? 16 : 4,
                          bottom: 3,
                          backgroundColor: "white",
                          transition: ".2s",
                          borderRadius: "50%",
                        }}
                      />
                    </span>
                  </label>
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>Block Withdrawals</span>
                  <label className="switch_label" style={{ position: "relative", display: "inline-block", width: 34, height: 20 }}>
                    <input
                      type="checkbox"
                      checked={!!wallet.blockWithdrawals}
                      onChange={() => handleToggleBlock("blockWithdrawals", !!wallet.blockWithdrawals)}
                      disabled={updatingSettings}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        cursor: "pointer",
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: wallet.blockWithdrawals ? "var(--accent)" : "#ccc",
                        transition: ".2s",
                        borderRadius: 20,
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          content: '""',
                          height: 14, width: 14,
                          left: wallet.blockWithdrawals ? 16 : 4,
                          bottom: 3,
                          backgroundColor: "white",
                          transition: ".2s",
                          borderRadius: "50%",
                        }}
                      />
                    </span>
                  </label>
                </div>
              </div>

              {/* Edit Wallet Limit & Currency form */}
              {isEditingWalletSettings ? (
                <div className="admin_form_card" style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-heading)" }}>
                      Edit Wallet Configurations
                    </span>
                    <button className="biz_icon_btn" onClick={() => setIsEditingWalletSettings(false)}>
                      <MdClose size={13} />
                    </button>
                  </div>
                  <div className="admin_form_grid" style={{ marginBottom: 10 }}>
                    <div className="form-field" style={{ marginBottom: 0 }}>
                      <label className="modal-label">Currency Code</label>
                      <input
                        className="modal-input"
                        placeholder="e.g. USD"
                        value={editCurrency}
                        onChange={(e) => setEditCurrency(e.target.value.toUpperCase())}
                      />
                    </div>
                    <div className="form-field" style={{ marginBottom: 0 }}>
                      <label className="modal-label">Withdrawal Limit</label>
                      <input
                        className="modal-input"
                        type="number"
                        placeholder="e.g. 50000 (Empty for none)"
                        value={editWithdrawalLimit}
                        onChange={(e) => setEditWithdrawalLimit(e.target.value)}
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button className="app_btn app_btn_cancel" style={{ height: 30 }} onClick={() => setIsEditingWalletSettings(false)}>
                      Cancel
                    </button>
                    <button
                      className={`app_btn app_btn_confirm${updatingSettings ? " btn_loading" : ""}`}
                      style={{ height: 30, minWidth: 70 }}
                      onClick={handleSaveWalletSettings}
                      disabled={updatingSettings}
                    >
                      <span className="btn_text">Save</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 10, marginBottom: 12 }}>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-body)", fontWeight: 700 }}>
                    Withdrawal Limit: <span style={{ color: "var(--accent)" }}>{wallet.withdrawalLimit != null ? `${wallet.currency} ${wallet.withdrawalLimit.toLocaleString()}` : "None"}</span>
                  </div>
                  <button
                    className="app_btn"
                    style={{ height: 26, fontSize: "0.7rem", padding: "0 8px" }}
                    onClick={() => {
                      setEditCurrency(wallet.currency || "NGN");
                      setEditWithdrawalLimit(wallet.withdrawalLimit != null ? String(wallet.withdrawalLimit) : "");
                      setIsEditingWalletSettings(true);
                    }}
                  >
                    Edit Config
                  </button>
                </div>
              )}

              {/* Credit / Debit action */}
              {walletAction ? (
                <div className="admin_form_card" style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "var(--text-heading)",
                      }}
                    >
                      Wallet Adjustment
                    </span>
                    <button
                      className="biz_icon_btn"
                      onClick={() => {
                        setWalletAction(null);
                        setWalletAmount("");
                        setWalletNote("");
                      }}
                    >
                      <MdClose size={13} />
                    </button>
                  </div>
                  {/* Credit / Debit toggle */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                    {[
                      { k: "credit", l: "Credit", color: "#16a34a" },
                      { k: "debit", l: "Debit", color: "#ef4444" },
                    ].map(({ k, l, color }) => (
                      <button
                        key={k}
                        onClick={() => setWalletAction(k)}
                        style={{
                          flex: 1,
                          height: 34,
                          borderRadius: 8,
                          border: `1px solid ${walletAction === k ? color + "55" : "var(--border)"}`,
                          background:
                            walletAction === k
                              ? color + "12"
                              : "var(--bg-hover)",
                          color:
                            walletAction === k ? color : "var(--text-muted)",
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          transition: "all 0.12s",
                        }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  <div className="admin_form_grid" style={{ marginBottom: 10 }}>
                    <div className="form-field" style={{ marginBottom: 0 }}>
                      <label className="modal-label">
                        Amount ({wallet.currency}) *
                      </label>
                      <input
                        className="modal-input"
                        type="number"
                        min="1"
                        placeholder="e.g. 5000"
                        value={walletAmount}
                        onChange={(e) => setWalletAmount(e.target.value)}
                      />
                    </div>
                    <div className="form-field" style={{ marginBottom: 0 }}>
                      <label className="modal-label">Note</label>
                      <input
                        className="modal-input"
                        placeholder="Optional description"
                        value={walletNote}
                        onChange={(e) => setWalletNote(e.target.value)}
                      />
                    </div>
                  </div>
                  {walletAmount && (
                    <div
                      style={{
                        marginBottom: 10,
                        padding: "8px 11px",
                        background:
                          walletAction === "debit"
                            ? "rgba(239,68,68,0.06)"
                            : "rgba(34,197,94,0.06)",
                        border: `1px solid ${walletAction === "debit" ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`,
                        borderRadius: 8,
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: walletAction === "debit" ? "#ef4444" : "#16a34a",
                      }}
                    >
                      {walletAction === "debit" ? "−" : "+"}
                      {wallet.currency}{" "}
                      {Number(walletAmount || 0).toLocaleString("en-NG")} will
                      be{" "}
                      {walletAction === "debit" ? "deducted from" : "added to"}{" "}
                      this wallet
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      className="app_btn app_btn_cancel"
                      style={{ height: 34 }}
                      onClick={() => setWalletAction(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className={`app_btn app_btn_confirm${doingWallet ? " btn_loading" : ""}`}
                      style={{
                        height: 34,
                        minWidth: 90,
                        position: "relative",
                        ...(walletAction === "debit"
                          ? {
                            background: "rgba(239,68,68,0.9)",
                            borderColor: "transparent",
                          }
                          : {}),
                      }}
                      onClick={handleWalletAction}
                      disabled={doingWallet}
                    >
                      <span className="btn_text">
                        {walletAction === "debit"
                          ? "Debit Wallet"
                          : "Credit Wallet"}
                      </span>
                      {doingWallet && (
                        <span
                          className="btn_loader"
                          style={{ width: 12, height: 12 }}
                        />
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                  <button
                    className="app_btn app_btn_confirm biz_add_btn"
                    onClick={() => setWalletAction("credit")}
                  >
                    <LuPlus size={13} /> Credit
                  </button>
                  <button
                    className="app_btn biz_add_btn"
                    style={{
                      height: 30,
                      padding: "0 12px",
                      fontSize: "0.75rem",
                      border: "1px solid rgba(239,68,68,0.3)",
                      background: "rgba(239,68,68,0.08)",
                      color: "#ef4444",
                    }}
                    onClick={() => setWalletAction("debit")}
                  >
                    − Debit
                  </button>
                </div>
              )}

              {/* Transactions */}
              {transactions.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 8,
                    }}
                  >
                    Recent Transactions
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 5,
                      maxHeight: 200,
                      overflowY: "auto",
                    }}
                  >
                    {transactions.slice(0, 20).map((tx) => {
                      const isCredit =
                        tx.type === "CREDIT" || tx.type === "TOPUP";
                      return (
                        <div
                          key={tx.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "8px 10px",
                            background: "var(--bg-hover)",
                            border: "1px solid var(--border)",
                            borderRadius: 9,
                          }}
                        >
                          <div
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: isCredit ? "#16a34a" : "#ef4444",
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                color: "var(--text-body)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {tx.description || tx.type}
                            </div>
                            <div
                              style={{
                                fontSize: "0.62rem",
                                color: "var(--text-muted)",
                              }}
                            >
                              {fmtDt(tx.createdAt)}
                            </div>
                          </div>
                          <div
                            style={{
                              fontSize: "0.78rem",
                              fontWeight: 800,
                              color: isCredit ? "#16a34a" : "#ef4444",
                              flexShrink: 0,
                            }}
                          >
                            {isCredit ? "+" : "-"}
                            {wallet.currency} {fmt(tx.amount)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </Section>

        {/* Invoices */}
        <Section
          icon={MdOutlineReceiptLong}
          title={`Invoices (${invoices.length})`}
        >
          {/* Create invoice button */}
          {!showInvForm && (
            <button
              className="app_btn app_btn_confirm biz_add_btn"
              style={{ marginBottom: 12 }}
              onClick={() => setShowInvForm(true)}
            >
              <LuPlus size={13} /> Create Invoice
            </button>
          )}
          {showInvForm && (
            <div className="admin_form_card" style={{ marginBottom: 12 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: "var(--text-heading)",
                  }}
                >
                  New Invoice
                </span>
                <button
                  className="biz_icon_btn"
                  onClick={() => setShowInvForm(false)}
                >
                  <MdClose size={13} />
                </button>
              </div>
              <div className="admin_form_grid" style={{ marginBottom: 10 }}>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label className="modal-label">Currency</label>
                  <input
                    className="modal-input"
                    value={invForm.currency}
                    onChange={(e) =>
                      setInvForm((p) => ({ ...p, currency: e.target.value }))
                    }
                  />
                </div>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label className="modal-label">Due Date *</label>
                  <input
                    className="modal-input"
                    type="date"
                    value={invForm.dueDate}
                    onChange={(e) =>
                      setInvForm((p) => ({ ...p, dueDate: e.target.value }))
                    }
                  />
                </div>
              </div>
              {invForm.items.map((it, i) => (
                <div key={i} className="admin_payment_item">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                      }}
                    >
                      Item {i + 1}
                    </span>
                    {invForm.items.length > 1 && (
                      <button
                        className="biz_icon_btn biz_icon_btn_danger"
                        onClick={() => removeInvItem(i)}
                        style={{ width: 20, height: 20 }}
                      >
                        <MdClose size={11} />
                      </button>
                    )}
                  </div>
                  <div className="admin_form_grid" style={{ marginBottom: 6 }}>
                    <div className="form-field" style={{ marginBottom: 0 }}>
                      <label className="modal-label">Title *</label>
                      <input
                        className="modal-input"
                        value={it.title}
                        onChange={(e) =>
                          updateInvItem(i, "title", e.target.value)
                        }
                      />
                    </div>
                    <div className="form-field" style={{ marginBottom: 0 }}>
                      <label className="modal-label">Amount *</label>
                      <input
                        className="modal-input"
                        type="number"
                        min="0"
                        value={it.amount}
                        onChange={(e) =>
                          updateInvItem(i, "amount", e.target.value)
                        }
                      />
                    </div>
                    <div className="form-field" style={{ marginBottom: 0 }}>
                      <label className="modal-label">Qty</label>
                      <input
                        className="modal-input"
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) =>
                          updateInvItem(i, "quantity", e.target.value)
                        }
                      />
                    </div>
                    <div className="form-field" style={{ marginBottom: 0 }}>
                      <label className="modal-label">Description</label>
                      <input
                        className="modal-input"
                        value={it.description}
                        onChange={(e) =>
                          updateInvItem(i, "description", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addInvItem}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  background: "none",
                  border: "none",
                  color: "var(--accent)",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  padding: "4px 0",
                  marginBottom: 10,
                }}
              >
                <LuPlus size={13} /> Add Item
              </button>
              <div
                style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
              >
                <button
                  className="app_btn app_btn_cancel"
                  style={{ height: 34 }}
                  onClick={() => setShowInvForm(false)}
                >
                  Cancel
                </button>
                <button
                  className={`app_btn app_btn_confirm${creatingInv ? " btn_loading" : ""}`}
                  style={{ height: 34, minWidth: 90, position: "relative" }}
                  onClick={handleCreateInvoice}
                  disabled={creatingInv}
                >
                  <span className="btn_text">Create</span>
                  {creatingInv && (
                    <span
                      className="btn_loader"
                      style={{ width: 12, height: 12 }}
                    />
                  )}
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div
              className="page_loader_spinner"
              style={{ width: 20, height: 20, margin: "12px auto" }}
            />
          ) : invoices.length === 0 ? (
            <div
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                padding: "8px 0",
              }}
            >
              No invoices.
            </div>
          ) : (
            invoices.map((inv) => (
              <InvoiceRow
                key={inv.id}
                inv={inv}
                onMarkPaid={handleMarkPaid}
                onDiscount={handleApplyInvDiscount}
              />
            ))
          )}
        </Section>
      </Drawer>

      {/* ── Mark Paid Confirmation ── */}
      {confirmMarkPaid && (
        <MarkPaidConfirm
          invId={confirmMarkPaid}
          inv={invoices.find((i) => i.id === confirmMarkPaid)}
          onConfirm={confirmAndMarkPaid}
          onCancel={() => setConfirmMarkPaid(null)}
        />
      )}
    </>
  );
}

function MarkPaidConfirm({ invId, inv, onConfirm, onCancel }) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 1200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 24,
          width: "100%",
          maxWidth: 360,
        }}
      >
        <div
          style={{
            fontSize: "1rem",
            fontWeight: 800,
            color: "var(--text-heading)",
            marginBottom: 6,
          }}
        >
          Mark Invoice as Paid
        </div>
        <div
          style={{
            fontSize: "0.82rem",
            color: "var(--text-muted)",
            marginBottom: 16,
          }}
        >
          Are you sure you want to mark invoice{" "}
          <span
            style={{
              fontFamily: "monospace",
              fontWeight: 700,
              color: "var(--text-body)",
            }}
          >
            #{invId.slice(0, 8).toUpperCase()}
          </span>
          {inv && (
            <>
              {" "}
              for{" "}
              <strong>
                {inv.currency} {Number(inv.total || 0).toLocaleString()}
              </strong>
            </>
          )}{" "}
          as paid? This cannot be undone.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="app_btn app_btn_cancel"
            style={{ flex: 1, height: 40 }}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="app_btn app_btn_confirm"
            style={{ flex: 1, height: 40 }}
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
