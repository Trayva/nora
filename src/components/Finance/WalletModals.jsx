import { useState, useEffect } from "react";
import Modal from "../Modal";
import { toast } from "react-toastify";
import { useAuth } from "../../contexts/AuthContext";
import {
  initiateTopup, withdrawFunds, setPin, changePin,
  resetPin, verifyBankAccount, updateSettlementAccount, getBanks,
} from "../../api/finance";

// ── Topup Modal ──────────────────────────────────────────────────

export function TopupModal({ isOpen, onClose, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || amount < 100)
      return toast.error("Please enter a valid amount (min 100)");
    setLoading(true);
    try {
      const res = await initiateTopup(Number(amount));
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
      description="Enter the amount you'd like to add to your wallet.">
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="form-field">
            <label className="modal-label">Amount (NGN)</label>
            <input
              className="modal-input"
              type="number"
              placeholder="e.g. 5000"
              min="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
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
              <span className="btn_text">Initiate Topup</span>
              {loading && <span className="btn_loader" style={{ width: 16, height: 16 }} />}
            </button>
          </div>
        </div>
      </form>
    </Modal>
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
    if (!pin) return toast.error("Transaction pin is required");
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
            <input
              className="modal-input"
              type="password"
              placeholder="••••"
              maxLength={4}
              value={pin}
              onChange={(e) => setPinValue(e.target.value)}
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
              <input
                className="modal-input otp_input"
                type="password"
                maxLength={4}
                placeholder="••••"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
              />
            </div>
          )}
          <div className="form-field">
            <label className="modal-label">New Pin</label>
            <input
              className="modal-input otp_input"
              type="password"
              maxLength={4}
              placeholder="••••"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label className="modal-label">Confirm New Pin</label>
            <input
              className="modal-input otp_input"
              type="password"
              maxLength={4}
              placeholder="••••"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
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
      await updateSettlementAccount(accountNumber, bankCode);
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