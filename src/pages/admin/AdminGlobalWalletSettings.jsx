import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { MdEdit } from "react-icons/md";
import { LuPlus } from "react-icons/lu";
import Drawer from "../../components/Drawer";
import api from "../../api/axios";

const EMPTY_FORM = {
  currency: "",
  minBalance: -1000000,
  blockTransactions: false,
  blockWithdrawals: false,
};

export default function AdminGlobalWalletSettings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const r = await api.get("/finance/wallet/global-settings");
      setSettings(r.data.data || []);
    } catch (err) {
      toast.error("Failed to load global wallet settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (item) => {
    setForm({
      currency: item.currency,
      minBalance: item.minBalance,
      blockTransactions: !!item.blockTransactions,
      blockWithdrawals: !!item.blockWithdrawals,
    });
    setEditing(item);
    setOpen(true);
  };

  const set = (k) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((p) => ({ ...p, [k]: value }));
  };

  const handleSave = async () => {
    if (!form.currency.trim()) {
      return toast.error("Currency is required");
    }
    setSaving(true);
    try {
      await api.patch("/finance/wallet/global-settings", {
        currency: form.currency.trim().toUpperCase(),
        minBalance: Number(form.minBalance),
        blockTransactions: form.blockTransactions,
        blockWithdrawals: form.blockWithdrawals,
      });
      toast.success(editing ? "Global wallet settings updated" : "Global wallet settings created");
      setOpen(false);
      fetchSettings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="admin_settings_panel" style={{ gridColumn: "1 / -1", marginTop: 16 }}>
        <div className="admin_settings_panel_header">
          <span className="admin_settings_panel_title">Global Wallet Settings</span>
          <button className="app_btn app_btn_confirm biz_add_btn" onClick={openCreate}>
            <LuPlus size={13} /> Add Config
          </button>
        </div>
        <div className="admin_settings_panel_body">
          {loading ? (
            <div className="page_loader" style={{ padding: 24 }}>
              <div className="page_loader_spinner" />
            </div>
          ) : settings.length === 0 ? (
            <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>
              No global wallet configurations set yet.
            </div>
          ) : (
            settings.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-heading)", marginBottom: 4 }}>
                    Currency: {item.currency}
                  </div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    <span className="admin_meta_chip">
                      Min Balance: {item.minBalance.toLocaleString()}
                    </span>
                    {item.blockTransactions && (
                      <span className="admin_meta_chip" style={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}>
                        Txns Blocked
                      </span>
                    )}
                    {item.blockWithdrawals && (
                      <span className="admin_meta_chip" style={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}>
                        Withdrawals Blocked
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <button className="biz_icon_btn" onClick={() => openEdit(item)}>
                    <MdEdit size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Drawer
        isOpen={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit Global Wallet Setting" : "New Global Wallet Setting"}
        description="Configure default credit limits and transaction blocks per currency"
        width={520}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="admin_form_grid">
            <div className="form-field">
              <label className="modal-label">Currency Code *</label>
              <input
                className="modal-input"
                placeholder="e.g. NGN"
                value={form.currency}
                onChange={set("currency")}
                disabled={!!editing}
              />
            </div>
            <div className="form-field">
              <label className="modal-label">Min Wallet Balance *</label>
              <input
                className="modal-input"
                type="number"
                placeholder="e.g. -1000000"
                value={form.minBalance}
                onChange={set("minBalance")}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "8px 0" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.82rem" }}>
              <input
                type="checkbox"
                checked={form.blockTransactions}
                onChange={set("blockTransactions")}
                style={{ width: 16, height: 16 }}
              />
              <span>Block Transactions (Currency-wide)</span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.82rem" }}>
              <input
                type="checkbox"
                checked={form.blockWithdrawals}
                onChange={set("blockWithdrawals")}
                style={{ width: 16, height: 16 }}
              />
              <span>Block Withdrawals (Currency-wide)</span>
            </label>
          </div>

          <div style={{ display: "flex", gap: 8, paddingTop: 8 }}>
            <button className="app_btn app_btn_cancel" style={{ flex: 1, height: 42 }} onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
              style={{ flex: 2, height: 42, position: "relative" }}
              onClick={handleSave}
              disabled={saving}
            >
              <span className="btn_text">{editing ? "Save Changes" : "Create"}</span>
              {saving && <span className="btn_loader" style={{ width: 13, height: 13 }} />}
            </button>
          </div>
        </div>
      </Drawer>
    </>
  );
}
