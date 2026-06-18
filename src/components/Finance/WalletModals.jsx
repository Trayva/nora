import { useState, useEffect, useRef } from "react";
import Modal from "../Modal";
import { toast } from "react-toastify";
import { useAuth } from "../../contexts/AuthContext";
import {
  initiateTopup, withdrawFunds, setPin, changePin,
  resetPin, verifyBankAccount, updateSettlementAccount, getBanks,
} from "../../api/finance";
import { MdDownload } from "react-icons/md";
import moment from "moment";

// ── Topup Modal ──────────────────────────────────────────────────

export function TopupModal({ isOpen, onClose, onSuccess, currency }) {
  const [amount, setAmount] = useState("");
  const [gateway, setGateway] = useState(currency === 'NGN' ? "paystack" : "stripe");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || amount < 100)
      return toast.error("Please enter a valid amount (min 100)");
    setLoading(true);
    try {
      const res = await initiateTopup(Number(amount), gateway);
      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        toast.success(res.message || "Topup initiated");
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to initiate topup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Topup Wallet"
      description="Enter the amount and select your payment gateway.">
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="form-field">
            <label className="modal-label">Amount ({currency})</label>
            <input
              className="modal-input"
              type="number"
              placeholder="e.g. 5000"
              min="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="form-field" style={{ marginBottom: 16 }}>
            <label className="modal-label">Payment Gateway</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setGateway("paystack")}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: gateway === "paystack" ? "2px solid var(--accent)" : "1px solid var(--border)",
                  background: gateway === "paystack" ? "var(--bg-active)" : "var(--bg-card)",
                  color: "var(--text-heading)",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s"
                }}
              >
                Paystack
              </button>
              <button
                type="button"
                onClick={() => setGateway("stripe")}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: gateway === "stripe" ? "2px solid var(--accent)" : "1px solid var(--border)",
                  background: gateway === "stripe" ? "var(--bg-active)" : "var(--bg-card)",
                  color: "var(--text-heading)",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s"
                }}
              >
                Stripe
              </button>
            </div>
          </div>
          <div className="modal-footer">
            <button className="app_btn app_btn_cancel" type="button" onClick={onClose}>
              Cancel
            </button>
            <button
              className={`app_btn app_btn_confirm ${loading ? "btn_loading" : ""}`}
              type="submit"
              disabled={loading}
              style={{ position: "relative", minWidth: 120 }}
            >
              <span className="btn_text">Initiate Topup</span>
              {loading && <span className="btn_loader" style={{ width: 16, height: 16 }} />}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// ── PinInput Helper Component ─────────────────────────────────────

export function PinInput({ length = 4, value, onChange, type = "password" }) {
  const inputRefs = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] || "");

  const handleChange = (i, val) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = digit;
    const nextValue = next.join("");
    onChange(nextValue);
    if (digit && i < length - 1) {
      inputRefs.current[i + 1]?.focus();
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      if (digits[i]) {
        const next = [...digits];
        next[i] = "";
        onChange(next.join(""));
      } else if (i > 0) {
        inputRefs.current[i - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && i > 0) inputRefs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < length - 1) inputRefs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    const lastIdx = Math.min(pasted.length, length - 1);
    inputRefs.current[lastIdx]?.focus();
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        marginTop: 6,
        marginBottom: 6,
        justifyContent: "flex-start",
        width: "100%",
      }}
      onPaste={handlePaste}
    >
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          type={type}
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          style={{
            width: 44,
            height: 44,
            textAlign: "center",
            fontSize: "1.2rem",
            fontWeight: 800,
            fontFamily: "monospace",
            borderRadius: 10,
            border: `1.5px solid ${digit ? "var(--accent)" : "var(--border)"}`,
            background: digit ? "var(--bg-active)" : "var(--bg-hover)",
            color: "var(--text-heading)",
            outline: "none",
            transition: "border-color 0.15s, background 0.15s",
            caretColor: "var(--accent)",
            boxSizing: "border-box",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "var(--accent)";
            e.target.style.boxShadow = "0 0 0 3px rgba(203,108,220,0.15)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = digit ? "var(--accent)" : "var(--border)";
            e.target.style.boxShadow = "none";
          }}
        />
      ))}
    </div>
  );
}

// ── Withdraw Modal ────────────────────────────────────────────────

export function WithdrawModal({ isOpen, onClose, onSuccess, balance }) {
  const [amount, setAmount] = useState("");
  const [pin, setPinValue] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || amount > balance) return toast.error("Invalid amount");
    if (!pin || pin.length !== 4) return toast.error("Transaction pin must be 4 digits");
    setLoading(true);
    try {
      await withdrawFunds(pin, Number(amount), desc);
      toast.success("Withdrawal successful");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Withdraw Funds"
      description="Transfer funds from your wallet to your settlement account.">
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="form-field">
            <label className="modal-label">Amount (NGN)</label>
            <input
              className="modal-input"
              type="number"
              placeholder="e.g. 1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label className="modal-label">Transaction Pin</label>
            <PinInput
              length={4}
              value={pin}
              onChange={setPinValue}
              type="password"
            />
          </div>
          <div className="form-field">
            <label className="modal-label">Description (Optional)</label>
            <input
              className="modal-input"
              type="text"
              placeholder="e.g. For supplies"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
          <div className="modal-footer">
            <button className="app_btn app_btn_cancel" type="button" onClick={onClose}>
              Cancel
            </button>
            <button
              className={`app_btn app_btn_confirm ${loading ? "btn_loading" : ""}`}
              type="submit"
              disabled={loading}
              style={{ position: "relative", minWidth: 120 }}
            >
              <span className="btn_text">Withdraw</span>
              {loading && <span className="btn_loader" style={{ width: 16, height: 16 }} />}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// ── Pin Modal ─────────────────────────────────────────────────────

export function PinModal({ isOpen, onClose, hasPin, onSuccess }) {
  const { user } = useAuth();
  const [mode, setMode] = useState("set");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(hasPin ? "change" : "set");
      setCurrentPin(""); setNewPin(""); setConfirmPin("");
    }
  }, [isOpen, hasPin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPin !== confirmPin) return toast.error("Pins do not match");
    if (newPin.length !== 4) return toast.error("Pin must be 4 digits");
    setLoading(true);
    try {
      if (mode === "change") await changePin(currentPin, newPin);
      else if (mode === "reset") await resetPin(user?.id, newPin);
      else await setPin(newPin);
      toast.success(mode === "reset" ? "Pin reset" : hasPin ? "Pin changed" : "Pin set");
      onSuccess?.(); onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update pin");
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "reset" ? "Reset Transaction Pin"
    : hasPin ? "Change Transaction Pin" : "Set Transaction Pin";
  const desc = mode === "reset" ? "Enter a new 4-digit pin to reset your access."
    : hasPin ? "Enter your current pin and a new 4-digit pin."
      : "Create a 4-digit pin to secure your transactions.";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} description={desc}>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {mode === "change" && (
            <div className="form-field">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className="modal-label">Current Pin</label>
                <button
                  type="button"
                  className="login_forgot_link"
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                  onClick={() => setMode("reset")}
                >
                  Forgot Pin?
                </button>
              </div>
              <PinInput
                length={4}
                value={currentPin}
                onChange={setCurrentPin}
                type="password"
              />
            </div>
          )}
          <div className="form-field">
            <label className="modal-label">New Pin</label>
            <PinInput
              length={4}
              value={newPin}
              onChange={setNewPin}
              type="password"
            />
          </div>
          <div className="form-field">
            <label className="modal-label">Confirm New Pin</label>
            <PinInput
              length={4}
              value={confirmPin}
              onChange={setConfirmPin}
              type="password"
            />
          </div>
          <div className="modal-footer">
            {mode === "reset" ? (
              <button
                type="button"
                className="app_btn app_btn_cancel"
                onClick={() => setMode("change")}
              >
                ← Back
              </button>
            ) : (
              <button className="app_btn app_btn_cancel" type="button" onClick={onClose}>
                Cancel
              </button>
            )}
            <button
              className={`app_btn app_btn_confirm ${loading ? "btn_loading" : ""}`}
              type="submit"
              disabled={loading}
              style={{ position: "relative", minWidth: 120 }}
            >
              <span className="btn_text">
                {mode === "reset" ? "Reset Pin" : hasPin ? "Update Pin" : "Set Pin"}
              </span>
              {loading && <span className="btn_loader" style={{ width: 16, height: 16 }} />}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// ── Settlement Modal ──────────────────────────────────────────────

export function SettlementModal({ isOpen, onClose, onSuccess }) {
  const [banks, setBanks] = useState([]);
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (isOpen) getBanks().then((res) => setBanks(res || []));
  }, [isOpen]);

  const handleVerify = async () => {
    if (accountNumber.length !== 10 || !bankCode) return;
    setVerifying(true);
    try {
      const res = await verifyBankAccount(accountNumber, bankCode);
      setAccountName(res.data?.account_name || "");
    } catch {
      toast.error("Could not verify account");
      setAccountName("");
    } finally {
      setVerifying(false);
    }
  };

  const handleUpdate = async () => {
    if (!accountName) return toast.error("Please verify account first");
    setUpdating(true);
    try {
      await updateSettlementAccount(accountNumber, bankCode, banks.find(_ => _.code === bankCode)?.name);
      toast.success("Settlement account updated");
      onSuccess?.(); onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settlement Account"
      description="Update where your withdrawals will be sent.">
      <div className="modal-body">
        <div className="form-field">
          <label className="modal-label">Select Bank</label>
          <select
            className="modal-input"
            value={bankCode}
            onChange={(e) => setBankCode(e.target.value)}
          >
            <option value="">Choose a bank...</option>
            {banks.map((b) => (
              <option key={b.code} value={b.code}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label className="modal-label">Account Number</label>
          <input
            className="modal-input"
            type="text"
            maxLength={10}
            placeholder="10-digit account number"
            value={accountNumber}
            onChange={(e) => {
              setAccountNumber(e.target.value);
              if (e.target.value.length === 10) setAccountName("");
            }}
          />
        </div>
        {accountNumber.length === 10 && !accountName && (
          <button
            type="button"
            className={`app_btn app_btn_cancel ${verifying ? "btn_loading" : ""}`}
            style={{ width: "100%", height: 40, position: "relative" }}
            onClick={handleVerify}
            disabled={verifying || !bankCode}
          >
            <span className="btn_text">Verify Account</span>
            {verifying && <span className="btn_loader" style={{ width: 16, height: 16, borderColor: "var(--accent)", borderTopColor: "transparent" }} />}
          </button>
        )}
        {accountName && (
          <div className="wallet_verified_box">
            <span className="wallet_verified_label">Verified Account</span>
            <span className="wallet_verified_name">{accountName}</span>
          </div>
        )}
        <div className="modal-footer">
          <button className="app_btn app_btn_cancel" onClick={onClose}>Cancel</button>
          <button
            className={`app_btn app_btn_confirm ${updating ? "btn_loading" : ""}`}
            onClick={handleUpdate}
            disabled={!accountName || updating}
            style={{ position: "relative", minWidth: 140 }}
          >
            <span className="btn_text">Update Account</span>
            {updating && <span className="btn_loader" style={{ width: 16, height: 16 }} />}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Transaction Detail Modal ──────────────────────────────────────

function getLoggedInUser() {
  try {
    const auth = JSON.parse(localStorage.getItem("trayva-auth") || "{}");
    return auth.user || null;
  } catch {
    return null;
  }
}

function generateTransactionReceiptHTML(tx, currency) {
  const user = getLoggedInUser();
  const na = (v) => (v != null && v !== "" ? v : "—");
  const cur = (currency || "NGN").toUpperCase();
  const isCredit = tx.type === "CREDIT";
  const statusLabel = tx.status === "COMPLETED" ? "✓  COMPLETED" : tx.status;
  const displayAmount = new Intl.NumberFormat("en-NG", { style: "currency", currency: cur }).format(
    Math.abs(tx.amount || 0)
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Transaction Receipt · NORA AI · ${tx.id.slice(0, 8).toUpperCase()}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>
  /* ── Reset ── */
  *{margin:0;padding:0;box-sizing:border-box}
  html{-webkit-print-color-adjust:exact;print-color-adjust:exact}

  /* ── Tokens — mirrors your CSS vars ── */
  :root{
    --ink:#0a0a0a;
    --ink-sub:#444444;
    --ink-muted:#777777;
    --bg:#ffffff;
    --bg-card:#f5f5f5;
    --bg-hover:#e8e8e8;
    --border:#e0e0e0;
    --accent:#cb6cdc;
    --accent-bg:rgba(203,108,220,0.08);
    --accent-border:rgba(203,108,220,0.25);
    --green:#16a34a;
    --green-bg:rgba(34,197,94,0.08);
    --green-border:rgba(34,197,94,0.2);
    --blue:#2563eb;
    --blue-bg:rgba(37,99,235,0.07);
    --amber:#ca8a04;
    --amber-bg:rgba(234,179,8,0.08);
    --amber-border:rgba(234,179,8,0.25);
    --red:#ef4444;
    --red-bg:rgba(239,68,68,0.08);
    --red-border:rgba(239,68,68,0.2);
  }

  body{
    font-family:'DM Sans',sans-serif;
    background:var(--bg);
    color:var(--ink);
    max-width:800px;
    margin:0 auto;
    padding:0;
    font-size:13px;
    line-height:1.5;
  }

  /* ── Page shell ── */
  .page{padding:48px 52px 44px;position:relative}

  /* Subtle diagonal grid watermark */
  .page::after{
    content:'';
    position:fixed;inset:0;
    background-image:
      linear-gradient(rgba(203,108,220,.04) 1px,transparent 1px),
      linear-gradient(90deg,rgba(203,108,220,.04) 1px,transparent 1px);
    background-size:32px 32px;
    pointer-events:none;z-index:0;
  }
  .page>*{position:relative;z-index:1}

  /* ── Header ── */
  .header{
    display:flex;justify-content:space-between;align-items:flex-start;
    padding-bottom:24px;
    border-bottom:1px solid var(--border);
    margin-bottom:28px;
  }

  /* Logo */
  .logo-block{}
  .logo-wordmark{
    display:flex;align-items:center;gap:0;
    font-family:'DM Sans',sans-serif;
    font-size:22px;font-weight:700;
    color:var(--ink);letter-spacing:-0.02em;line-height:1;
  }
  .logo-wordmark .dot{
    display:inline-block;
    width:7px;height:7px;
    border-radius:50%;
    background:var(--accent);
    margin-left:2px;
    margin-bottom:12px;
    flex-shrink:0;
  }
  .logo-tagline{
    font-size:9.5px;font-weight:500;
    color:var(--accent);
    letter-spacing:0.16em;text-transform:uppercase;
    margin-top:5px;
  }
  .logo-address{
    font-size:10px;font-weight:400;
    color:var(--ink-muted);
    margin-top:4px;line-height:1.5;
  }
  .logo-socials{
    display:flex;gap:10px;margin-top:5px;flex-wrap:wrap;
  }
  .logo-socials span{
    font-size:9.5px;font-weight:500;
    color:var(--ink-muted);letter-spacing:0.04em;
  }
  .logo-socials .sep{color:var(--border)}

  /* Receipt meta — right side */
  .receipt-meta{text-align:right}
  .receipt-eyebrow{
    font-size:9px;font-weight:600;
    letter-spacing:0.2em;text-transform:uppercase;
    color:var(--ink-muted);margin-bottom:6px;
  }
  .receipt-num{
    font-family:'DM Mono',monospace;
    font-size:18px;font-weight:500;
    color:var(--ink);letter-spacing:0.02em;line-height:1;
  }
  .receipt-issued{
    font-size:10px;color:var(--ink-muted);
    margin-top:5px;font-weight:400;
  }
  .status-chip{
    display:inline-block;margin-top:9px;
    padding:4px 14px;border-radius:999px;
    font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;
  }
  .chip-completed{background:var(--green-bg);color:var(--green);border:1px solid var(--green-border)}
  .chip-pending{background:var(--amber-bg);color:var(--amber);border:1px solid var(--amber-border)}
  .chip-failed{background:var(--red-bg);color:var(--red);border:1px solid var(--red-border)}
  .chip-refunded{background:var(--blue-bg);color:var(--blue);border:1px solid var(--blue)}

  /* ── Accent bar under header ── */
  .accent-bar{
    height:2px;
    background:linear-gradient(90deg,var(--accent),rgba(203,108,220,0));
    border-radius:999px;
    margin-bottom:28px;
  }

  /* ── Party cards ── */
  .party-row{
    display:grid;grid-template-columns:repeat(2,1fr);
    gap:1px;
    background:var(--border);
    border:1px solid var(--border);
    border-radius:14px;overflow:hidden;
    margin-bottom:24px;
  }
  .party-card{
    background:var(--bg-card);
    padding:18px 16px;
    position:relative;
  }
  .party-card::before{
    content:'';position:absolute;
    top:0;left:0;right:0;height:2px;
  }
  .party-card.pc-customer::before{background:var(--blue)}
  .party-card.pc-company::before{background:var(--accent)}

  .party-eyebrow{
    font-size:8.5px;font-weight:700;
    letter-spacing:0.18em;text-transform:uppercase;
    color:var(--ink-muted);margin-bottom:12px;
  }
  .party-field{margin-bottom:8px}
  .party-field:last-child{margin-bottom:0}
  .party-key{
    font-size:8.5px;font-weight:600;
    letter-spacing:0.1em;text-transform:uppercase;
    color:var(--ink-muted);margin-bottom:2px;
  }
  .party-val{
    font-size:12.5px;font-weight:500;
    color:var(--ink);word-break:break-word;line-height:1.35;
  }
  .party-val.bold{font-weight:700}
  .party-val.small{font-size:10.5px;color:var(--ink-sub)}

  /* ── Meta strip ── */
  .meta-strip{
    display:flex;flex-wrap:wrap;
    border:1px solid var(--border);
    border-radius:10px;overflow:hidden;
    margin-bottom:24px;
  }
  .meta-cell{
    flex:1;min-width:100px;
    padding:11px 14px;
    background:var(--bg);
    border-right:1px solid var(--border);
  }
  .meta-cell:last-child{border-right:none}
  .meta-key{
    font-size:8px;font-weight:600;
    letter-spacing:0.18em;text-transform:uppercase;
    color:var(--ink-muted);margin-bottom:3px;
  }
  .meta-val{
    font-size:12.5px;font-weight:600;
    color:var(--ink);
    font-family:'DM Sans',sans-serif;
  }

  /* ── Details Table ── */
  .details-wrap{
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 24px;
  }
  .details-table{width:100%;border-collapse:collapse}
  .details-table tr{border-bottom:1px solid var(--border)}
  .details-table tr:last-child{border-bottom:none}
  .details-table td{padding:12px 16px;font-size:13px}
  .details-label{color:var(--ink-muted);font-weight:500;width:35%}
  .details-value{color:var(--ink);font-weight:600;text-align:right}

  /* ── Total box ── */
  .total-box{
    display:flex;justify-content:space-between;align-items:center;
    background:var(--accent-bg);
    border:1px solid var(--accent-border);
    border-radius:10px;
    padding:14px 18px;
    margin-top:8px;margin-bottom:32px;
  }
  .total-label{
    font-size:10px;font-weight:600;
    letter-spacing:0.14em;text-transform:uppercase;
    color:var(--accent);
  }
  .total-amount{
    font-family:'DM Mono',monospace;
    font-size:22px;font-weight:500;
    color:var(--accent);letter-spacing:-0.01em;
  }

  /* ── Footer ── */
  .footer{
    display:flex;justify-content:space-between;align-items:flex-end;
    border-top:1px solid var(--border);
    padding-top:18px;
  }
  .footer-left{font-size:9.5px;color:var(--ink-muted);line-height:1.8}
  .footer-left strong{color:var(--ink-sub);font-weight:600}
  .footer-right{text-align:right}
  .footer-mono{
    font-family:'DM Mono',monospace;
    font-size:8.5px;color:var(--ink-muted);letter-spacing:0.06em;
    line-height:1.8;
  }
  .footer-mono .hl{color:var(--accent)}

  @media print{
    body{margin:0}
    .page{padding:28px 36px}
    @page{size:A4;margin:10mm}
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="logo-block">
      <div class="logo-wordmark">NORA AI<span class="dot"></span></div>
      <div class="logo-tagline">Sustainable Urban Mobility</div>
      <div class="logo-address">50 Ebitu Ukiwe Street, Jabi, Abuja</div>
      <div class="logo-socials">
        <span>@trynora</span><span class="sep">·</span>
        <span>in/trynora</span><span class="sep">·</span>
        <span>x.com/trynora</span><span class="sep">·</span>
        <span>contact@trynora.net</span>
      </div>
    </div>
    <div class="receipt-meta">
      <div class="receipt-eyebrow">Transaction Receipt</div>
      <div class="receipt-num">#${tx.id.slice(0, 8).toUpperCase()}</div>
      <div class="receipt-issued">Issued ${moment(tx.createdAt).format("DD MMMM, YYYY")}</div>
      <div class="status-chip chip-${tx.status.toLowerCase()}">${statusLabel}</div>
    </div>
  </div>

  <div class="accent-bar"></div>

  <!-- Party cards -->
  <div class="party-row">
    <div class="party-card pc-customer">
      <div class="party-eyebrow">User / Customer</div>
      <div class="party-field"><div class="party-key">Name</div><div class="party-val bold">${na(user?.fullName || user?.name)}</div></div>
      <div class="party-field"><div class="party-key">Email</div><div class="party-val">${na(user?.email)}</div></div>
      <div class="party-field"><div class="party-key">Phone</div><div class="party-val">${na(user?.phone)}</div></div>
    </div>
    <div class="party-card pc-company">
      <div class="party-eyebrow">Issuing Company</div>
      <div class="party-field"><div class="party-key">Company</div><div class="party-val bold">NORA AI Ltd</div></div>
      <div class="party-field"><div class="party-key">Address</div><div class="party-val small">50 Ebitu Ukiwe St, Jabi, Abuja</div></div>
      <div class="party-field"><div class="party-key">Email</div><div class="party-val">contact@trynora.net</div></div>
    </div>
  </div>

  <!-- Meta strip -->
  <div class="meta-strip">
    <div class="meta-cell"><div class="meta-key">Date / Time</div><div class="meta-val">${moment(tx.createdAt).format("DD/MM/YYYY HH:mm")}</div></div>
    <div class="meta-cell"><div class="meta-key">Type</div><div class="meta-val">${tx.type}</div></div>
    <div class="meta-cell"><div class="meta-key">Currency</div><div class="meta-val">${cur}</div></div>
  </div>

  <!-- Details -->
  <div class="details-wrap">
    <table class="details-table">
      <tbody>
        <tr>
          <td class="details-label">Transaction ID</td>
          <td class="details-value" style="font-family: monospace;">${tx.id}</td>
        </tr>
        <tr>
          <td class="details-label">Reference</td>
          <td class="details-value" style="font-family: monospace;">${tx.reference}</td>
        </tr>
        <tr>
          <td class="details-label">Description</td>
          <td class="details-value">${tx.description || (isCredit ? "Wallet Top Up" : "Withdrawal")}</td>
        </tr>
        <tr>
          <td class="details-label">Transaction Type</td>
          <td class="details-value" style="color: ${isCredit ? '#22c55e' : 'var(--ink)'}">${tx.type}</td>
        </tr>
        ${tx.balance != null ? `
        <tr>
          <td class="details-label">Previous Balance</td>
          <td class="details-value">${new Intl.NumberFormat("en-NG", { style: "currency", currency: cur }).format(tx.balance)}</td>
        </tr>
        ` : ""}
        ${tx.newBalance != null ? `
        <tr>
          <td class="details-label">New Balance</td>
          <td class="details-value">${new Intl.NumberFormat("en-NG", { style: "currency", currency: cur }).format(tx.newBalance)}</td>
        </tr>
        ` : ""}
      </tbody>
    </table>
  </div>

  <!-- Total -->
  <div class="total-box">
    <div class="total-label">Amount (${isCredit ? "Credit" : "Debit"})</div>
    <div class="total-amount">${isCredit ? "+" : "−"} ${displayAmount}</div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-left">
      <strong>NORA AI Ltd</strong> · 50 Ebitu Ukiwe Street, Jabi, Abuja<br/>
      Sustainable Urban Mobility · contact@trynora.net<br/>
      This is an official receipt — please retain for your records.
    </div>
    <div class="footer-right">
      <div class="footer-mono">Generated ${moment().format("DD/MM/YYYY")}</div>
      <div class="footer-mono">Ref: <span class="hl">${tx.reference}</span></div>
    </div>
  </div>

</div>
</body>
</html>`;
}

export function downloadTransactionReceipt(tx, currency) {
  const html = generateTransactionReceiptHTML(tx, currency);
  const win = window.open("", "_blank");
  if (!win) {
    toast.error("Please allow pop-ups to download the receipt");
    return;
  }
  win.document.write(html);
  win.document.close();
  let printed = false;
  const doPrint = () => {
    if (printed) return;
    printed = true;
    win.focus();
    win.print();
  };
  win.onload = doPrint;
  setTimeout(doPrint, 800);
  toast.success("Receipt ready — select 'Save as PDF' in the print dialog");
}

export function TransactionDetailModal({ isOpen, onClose, transaction, currency = "NGN" }) {
  if (!transaction) return null;
  const isCredit = transaction.type === "CREDIT";

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(
      Math.abs(amount || 0),
    );

  const statusColors = {
    PENDING: { bg: "rgba(234,179,8,0.1)", color: "#ca8a04", border: "rgba(234,179,8,0.25)" },
    COMPLETED: { bg: "rgba(34,197,94,0.1)", color: "#16a34a", border: "rgba(34,197,94,0.25)" },
    FAILED: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", border: "rgba(239,68,68,0.25)" },
    REFUNDED: { bg: "rgba(37,99,235,0.1)", color: "#2563eb", border: "rgba(37,99,235,0.25)" },
  };

  const status = transaction.status || "PENDING";
  const s = statusColors[status] || statusColors.PENDING;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transaction Details"
      description={`Reference: ${transaction.reference}`}
    >
      <div className="modal-body">
        {/* Status + download */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <span
            className="quick_inv_status"
            style={{
              background: s.bg,
              color: s.color,
              border: `1px solid ${s.border}`,
              padding: "4px 10px",
              borderRadius: 999,
              fontSize: "0.68rem",
              fontWeight: 700,
            }}
          >
            {status}
          </span>

          <button
            onClick={() => downloadTransactionReceipt(transaction, currency)}
            style={{
              marginLeft: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              height: 30,
              padding: "0 12px",
              borderRadius: 7,
              border: "1px solid rgba(203,108,220,0.3)",
              background: "rgba(203,108,220,0.08)",
              color: "var(--accent)",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "0.74rem",
              fontWeight: 700,
              transition: "opacity 0.15s",
            }}
          >
            <MdDownload size={14} /> Download Receipt
          </button>
        </div>

        {/* Amount */}
        <div style={{ textAlign: "center", margin: "20px 0 30px" }}>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>
            Amount ({transaction.type})
          </div>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              color: isCredit ? "#22c55e" : "var(--text-heading)",
              marginTop: 4,
            }}
          >
            {isCredit ? "+" : "−"} {formatCurrency(transaction.amount)}
          </div>
        </div>

        {/* Info Grid */}
        <div className="wallet_info_block" style={{ marginBottom: 20 }}>
          <div className="wallet_info_row">
            <span className="wallet_info_label">Date & Time</span>
            <span className="wallet_info_value">
              {moment(transaction.createdAt).format("MMM DD, YYYY • hh:mm A")}
            </span>
          </div>
          <div className="wallet_info_row">
            <span className="wallet_info_label">Type</span>
            <span className="wallet_info_value" style={{ color: isCredit ? "#22c55e" : "inherit" }}>
              {transaction.type}
            </span>
          </div>
          <div className="wallet_info_row">
            <span className="wallet_info_label">Description</span>
            <span className="wallet_info_value">
              {transaction.description || (isCredit ? "Wallet Top Up" : "Withdrawal")}
            </span>
          </div>
          <div className="wallet_info_row">
            <span className="wallet_info_label">Reference</span>
            <span className="wallet_info_value" style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>
              {transaction.reference}
            </span>
          </div>
          {transaction.balance != null && (
            <div className="wallet_info_row">
              <span className="wallet_info_label">Balance Before</span>
              <span className="wallet_info_value">{formatCurrency(transaction.balance)}</span>
            </div>
          )}
          {transaction.newBalance != null && (
            <div className="wallet_info_row">
              <span className="wallet_info_label">Balance After</span>
              <span className="wallet_info_value">{formatCurrency(transaction.newBalance)}</span>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ marginTop: 10 }}>
          <button className="app_btn app_btn_cancel w-100" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}