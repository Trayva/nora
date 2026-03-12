import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  MdPerson,
  MdAdd,
  MdCheck,
  MdClose,
  MdRefresh,
  MdBlock,
  MdWorkOutline,
  MdAccessTime,
  MdSearch,
} from "react-icons/md";
import api from "../../api/axios";

const offerStatusColors = {
  PENDING: {
    bg: "rgba(234,179,8,0.1)",
    color: "#ca8a04",
    border: "rgba(234,179,8,0.25)",
  },
  ACCEPTED: {
    bg: "rgba(34,197,94,0.1)",
    color: "#16a34a",
    border: "rgba(34,197,94,0.25)",
  },
  REJECTED: {
    bg: "rgba(239,68,68,0.1)",
    color: "#ef4444",
    border: "rgba(239,68,68,0.25)",
  },
  TERMINATED: {
    bg: "rgba(107,114,128,0.1)",
    color: "#6b7280",
    border: "rgba(107,114,128,0.25)",
  },
  EXPIRED: {
    bg: "rgba(107,114,128,0.1)",
    color: "#6b7280",
    border: "rgba(107,114,128,0.25)",
  },
};

function StatusPill({ status }) {
  const s = offerStatusColors[status] || offerStatusColors.PENDING;
  return (
    <span
      className="icart_status_badge"
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {status}
    </span>
  );
}

/* ── Hire Form ─────────────────────────────────────────────── */
function HireForm({ cartId, onHired }) {
  const [hireable, setHireable] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [durationDays, setDurationDays] = useState(30);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoadingList(true);
      try {
        const res = await api.get("/icart/operator/hirable");
        setHireable(res.data.data?.items || res.data.data || []);
      } catch {
        toast.error("Failed to load operators");
      } finally {
        setLoadingList(false);
      }
    };
    fetch();
  }, []);

  const filtered = hireable.filter((op) => {
    const name = op.user?.name || op.user?.email || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const handleSubmit = async () => {
    if (!selectedOperator) return toast.error("Select an operator");
    if (!durationDays || durationDays < 1)
      return toast.error("Enter valid duration");

    setSubmitting(true);
    try {
      await api.post("/icart/operator/job-offers", {
        operatorId: selectedOperator.id,
        cartId,
        durationDays: Number(durationDays),
      });
      toast.success("Job offer sent");
      onHired();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send offer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="icart_hire_form">
      <div className="form-field">
        <label className="modal-label">Search Operators</label>
        <div className="icart_search_wrap">
          <MdSearch
            size={16}
            style={{ color: "var(--text-muted)", flexShrink: 0 }}
          />
          <input
            className="modal-input"
            style={{
              border: "none",
              background: "transparent",
              padding: 0,
              flex: 1,
              outline: "none",
            }}
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loadingList ? (
        <div className="drawer_loading" style={{ padding: "20px 0" }}>
          <div
            className="page_loader_spinner"
            style={{ width: 20, height: 20 }}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="icart_empty_inline">
          <MdPerson size={18} style={{ opacity: 0.3 }} />
          <span>No operators found</span>
        </div>
      ) : (
        <div className="icart_operator_list">
          {filtered.map((op) => (
            <div
              key={op.id}
              className={`icart_operator_row ${selectedOperator?.id === op.id ? "icart_operator_selected" : ""}`}
              onClick={() => setSelectedOperator(op)}
            >
              <div className="icart_operator_avatar">
                {(op.user?.name || op.user?.email || "?")[0].toUpperCase()}
              </div>
              <div className="icart_operator_info">
                <div className="icart_operator_name">
                  {op.user?.name || op.user?.email}
                </div>
                {op.state?.name && (
                  <div className="icart_operator_meta">{op.state.name}</div>
                )}
              </div>
              {selectedOperator?.id === op.id && (
                <MdCheck
                  size={16}
                  style={{ color: "var(--accent)", flexShrink: 0 }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="form-field" style={{ marginTop: 12 }}>
        <label className="modal-label">Contract Duration (days)</label>
        <input
          className="modal-input"
          type="number"
          min={1}
          value={durationDays}
          onChange={(e) => setDurationDays(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button
          className={`app_btn app_btn_confirm ${submitting ? "btn_loading" : ""}`}
          style={{ flex: 1, height: 40 }}
          onClick={handleSubmit}
          disabled={submitting || !selectedOperator}
        >
          <span className="btn_text">Send Job Offer</span>
          {submitting && (
            <span className="btn_loader" style={{ width: 14, height: 14 }} />
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Job Offer Card ────────────────────────────────────────── */
function JobOfferCard({ offer, onRefresh }) {
  const [renewDays, setRenewDays] = useState(30);
  const [showRenew, setShowRenew] = useState(false);
  const [loading, setLoading] = useState(false);

  const canTerminate = offer.status === "ACCEPTED";
  const canRenew = offer.status === "ACCEPTED" || offer.status === "EXPIRED";

  const handleTerminate = async () => {
    if (!window.confirm("Terminate this contract?")) return;
    setLoading(true);
    try {
      await api.patch(`/icart/operator/job-offers/${offer.id}/terminate`);
      toast.success("Contract terminated");
      onRefresh();
    } catch {
      toast.error("Failed to terminate");
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async () => {
    if (!renewDays || renewDays < 1) return toast.error("Enter valid days");
    setLoading(true);
    try {
      await api.patch(`/icart/operator/job-offers/${offer.id}/renew`, {
        durationDays: Number(renewDays),
      });
      toast.success("Contract renewed");
      setShowRenew(false);
      onRefresh();
    } catch {
      toast.error("Failed to renew");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const operatorName =
    offer.operator?.user?.name || offer.operator?.user?.email || "Operator";

  return (
    <div className="icart_offer_card">
      <div className="icart_offer_top">
        <div
          className="icart_operator_avatar"
          style={{ width: 36, height: 36, fontSize: "0.85rem" }}
        >
          {operatorName[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="icart_operator_name">{operatorName}</div>
          <div className="icart_task_meta">
            <MdAccessTime size={11} />
            {offer.durationDays} days · Ends {formatDate(offer.endDate)}
          </div>
        </div>
        <StatusPill status={offer.status} />
      </div>

      {(canTerminate || canRenew) && (
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          {canRenew && (
            <button
              className="app_btn app_btn_cancel"
              style={{ flex: 1, height: 32, fontSize: "0.72rem" }}
              onClick={() => setShowRenew((v) => !v)}
            >
              <MdRefresh size={13} /> {showRenew ? "Cancel" : "Renew"}
            </button>
          )}
          {canTerminate && (
            <button
              className="app_btn"
              style={{
                flex: 1,
                height: 32,
                fontSize: "0.72rem",
                color: "#ef4444",
                border: "1px solid rgba(239,68,68,0.3)",
                background: "rgba(239,68,68,0.05)",
              }}
              onClick={handleTerminate}
              disabled={loading}
            >
              <MdBlock size={13} /> Terminate
            </button>
          )}
        </div>
      )}

      {showRenew && (
        <div
          style={{
            marginTop: 10,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <input
            className="modal-input"
            type="number"
            style={{ flex: 1, height: 36 }}
            placeholder="Days to add"
            value={renewDays}
            onChange={(e) => setRenewDays(e.target.value)}
          />
          <button
            className={`app_btn app_btn_confirm ${loading ? "btn_loading" : ""}`}
            style={{ height: 36, padding: "0 16px", fontSize: "0.75rem" }}
            onClick={handleRenew}
            disabled={loading}
          >
            <span className="btn_text">Confirm</span>
            {loading && (
              <span className="btn_loader" style={{ width: 12, height: 12 }} />
            )}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Main IcartWorkforce ───────────────────────────────────── */
export default function IcartWorkforce({ cart, onRefresh: parentRefresh }) {
  const [view, setView] = useState("offers"); // offers | hire
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      // Filter by cartId if API supports it, else filter client-side
      const res = await api.get(`/icart/operator/job-offers?cartId=${cart.id}`);
      const all = res.data.data?.items || res.data.data || [];
      setOffers(
        all.filter
          ? all.filter(
              (o) =>
                !o.cartId || o.cartId === cart.id || o.cart?.id === cart.id,
            )
          : all,
      );
    } catch {
      // Fallback: try without cartId param
      try {
        const res = await api.get("/icart/operator/job-offers");
        const all = res.data.data?.items || res.data.data || [];
        setOffers(
          all.filter((o) => o.cartId === cart.id || o.cart?.id === cart.id),
        );
      } catch {
        toast.error("Failed to load job offers");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === "offers") fetchOffers();
  }, [view]);

  // Current active operator
  const activeOperator = cart.operator || cart.currentOperator;

  return (
    <div className="icart_tab_content">
      {/* Current operator */}
      {activeOperator && (
        <>
          <div className="drawer_section_title">Current Operator</div>
          <div className="icart_current_operator">
            <div className="icart_operator_avatar icart_operator_avatar_lg">
              {(activeOperator.user?.name ||
                activeOperator.user?.email ||
                "O")[0].toUpperCase()}
            </div>
            <div>
              <div
                className="icart_operator_name"
                style={{ fontSize: "0.95rem" }}
              >
                {activeOperator.user?.name || activeOperator.user?.email}
              </div>
              {activeOperator.user?.email && activeOperator.user?.name && (
                <div className="icart_operator_meta">
                  {activeOperator.user.email}
                </div>
              )}
              {activeOperator.state?.name && (
                <div className="icart_operator_meta">
                  {activeOperator.state.name}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Sub-nav */}
      <div
        className="icart_sub_nav"
        style={{ marginTop: activeOperator ? 20 : 0 }}
      >
        <button
          className={`icart_sub_nav_btn ${view === "offers" ? "icart_sub_nav_active" : ""}`}
          onClick={() => setView("offers")}
        >
          <MdWorkOutline size={13} /> Job Offers
        </button>
        <button
          className={`icart_sub_nav_btn ${view === "hire" ? "icart_sub_nav_active" : ""}`}
          onClick={() => setView("hire")}
          style={{ marginLeft: "auto" }}
        >
          <MdAdd size={13} /> Hire Operator
        </button>
      </div>

      {view === "hire" ? (
        <HireForm
          cartId={cart.id}
          onHired={() => {
            setView("offers");
            fetchOffers();
            parentRefresh();
          }}
        />
      ) : loading ? (
        <div className="drawer_loading">
          <div className="page_loader_spinner" />
        </div>
      ) : offers.length === 0 ? (
        <div className="icart_empty_inline" style={{ padding: "32px 0" }}>
          <MdWorkOutline size={24} style={{ opacity: 0.3 }} />
          <span>No job offers yet</span>
        </div>
      ) : (
        <div className="icart_tasks_list">
          {offers.map((offer) => (
            <JobOfferCard
              key={offer.id}
              offer={offer}
              onRefresh={fetchOffers}
            />
          ))}
        </div>
      )}
    </div>
  );
}
