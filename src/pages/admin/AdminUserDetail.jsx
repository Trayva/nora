import { useState, useEffect } from "react";
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

function Section({ icon: Icon, title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
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
      {open && <div style={{ paddingTop: 6 }}>{children}</div>}
    </div>
  );
}

function InvoiceRow({ inv, onMarkPaid }) {
  const [expanded, setExpanded] = useState(false);
  const [paying, setPaying] = useState(false);
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
            <button
              className={`app_btn app_btn_confirm${paying ? " btn_loading" : ""}`}
              style={{
                height: 26,
                padding: "0 10px",
                fontSize: "0.7rem",
                position: "relative",
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

export default function AdminUserDetail({ user, onClose }) {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTxns] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Roles
  const [roles, setRoles] = useState([]);
  const [savingRoles, setSavingRoles] = useState(false);

  // Wallet actions
  const [walletAction, setWalletAction] = useState(null); // "credit" | "debit"
  const [walletAmount, setWalletAmount] = useState("");
  const [walletNote, setWalletNote] = useState("");
  const [doingWallet, setDoingWallet] = useState(false);

  // Invoice create
  const [showInvForm, setShowInvForm] = useState(false);
  const [invForm, setInvForm] = useState({
    currency: "NGN",
    dueDate: "",
    items: [{ title: "", amount: "", quantity: 1, description: "" }],
  });
  const [creatingInv, setCreatingInv] = useState(false);

  useEffect(() => {
    // Extract current roles
    setRoles(user.roles?.map((r) => r.role || r) || []);
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
  }, [user.id]);

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
      await api.post("/finance/wallet/manual-credit", {
        userId: user.id,
        amount: Number(walletAmount),
        description: walletNote || undefined,
      });
      toast.success("Wallet credited");
      setWalletAction(null);
      setWalletAmount("");
      setWalletNote("");
      // Refresh wallet
      const r = await api.get("/finance/wallet", {
        params: { userId: user.id },
      });
      setWallet(r.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setDoingWallet(false);
    }
  };

  const handleMarkPaid = async (invId) => {
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

  const handleUnlock = async () => {
    try {
      await api.put(`/account/${user.id}/unlock`);
      toast.success("Account unlocked");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={user.fullName || "User"}
      description={user.email}
      width={540}
    >
      {/* Header chips */}
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}
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
      <Section icon={MdOutlinePerson} title="Profile">
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
                    style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}
                  >
                    {wallet.bankAccount}
                  </div>
                  <div
                    style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}
                  >
                    {wallet.accountName}
                  </div>
                </div>
              )}
            </div>

            {/* Credit action */}
            {walletAction ? (
              <div className="admin_form_card" style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "var(--text-heading)",
                    }}
                  >
                    Manual Credit
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
                    style={{ height: 34, minWidth: 90, position: "relative" }}
                    onClick={handleWalletAction}
                    disabled={doingWallet}
                  >
                    <span className="btn_text">Credit Wallet</span>
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
              <button
                className="app_btn app_btn_confirm biz_add_btn"
                style={{ marginBottom: 12 }}
                onClick={() => setWalletAction("credit")}
              >
                <LuPlus size={13} /> Credit Wallet
              </button>
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
            <InvoiceRow key={inv.id} inv={inv} onMarkPaid={handleMarkPaid} />
          ))
        )}
      </Section>
    </Drawer>
  );
}
