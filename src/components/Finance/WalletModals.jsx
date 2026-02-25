import { useState, useEffect } from "react";
import Modal from "../Modal";
import Input from "../Input";
import Button from "../Button";
import { toast } from "react-toastify";
import { useAuth } from "../../contexts/AuthContext";
import {
    initiateTopup,
    withdrawFunds,
    setPin,
    changePin,
    resetPin,
    verifyBankAccount,
    updateSettlementAccount,
    getBanks,
} from "../../api/finance";

// ── Topup Modal ──────────────────────────────────────────────────

export function TopupModal({ isOpen, onClose, onSuccess }) {
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || isNaN(amount) || amount < 100) {
            return toast.error("Please enter a valid amount (min 100)");
        }
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
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Topup Wallet"
            description="Enter the amount you'd like to add to your wallet."
        >
            <form onSubmit={handleSubmit} className="p-3">
                <Input
                    labelClassName="modal-label"
                    className="modal-input"
                    label="Amount (NGN)"
                    type="number"
                    placeholder="e.g. 5000"
                    value={amount}
                    onChange={setAmount}
                    containerClassName="mb-3"
                />
                <Button
                    type="submit"
                    loading={loading}
                    title="Initiate Topup"
                    className="app_btn_confirm w-100"
                />
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
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Withdraw Funds"
            description="Transfer funds from your wallet to your settlement account."
        >
            <form onSubmit={handleSubmit} className="p-3">
                <Input
                    labelClassName="modal-label"
                    className="modal-input"
                    label="Amount (NGN)"
                    type="number"
                    placeholder="e.g. 1000"
                    value={amount}
                    onChange={setAmount}
                    containerClassName="mb-3"
                />
                <Input
                    labelClassName="modal-label"
                    className="modal-input"
                    label="Transaction Pin"
                    type="password"
                    placeholder="****"
                    maxLength={4}
                    value={pin}
                    onChange={setPinValue}
                    containerClassName="mb-3"
                />
                <Input
                    labelClassName="modal-label"
                    className="modal-input"
                    label="Description (Optional)"
                    placeholder="e.g. For supplies"
                    value={desc}
                    onChange={setDesc}
                    containerClassName="mb-3"
                />
                <Button
                    type="submit"
                    loading={loading}
                    title="Withdraw"
                    className="app_btn_confirm w-100"
                />
            </form>
        </Modal>
    );
}

// ── Pin Management Modal ──────────────────────────────────────────

export function PinModal({ isOpen, onClose, hasPin, onSuccess }) {
    const { user } = useAuth();
    const [mode, setMode] = useState("auto"); // 'auto', 'change', 'reset'
    const [currentPin, setCurrentPin] = useState("");
    const [newPin, setNewPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setMode(hasPin ? "change" : "set");
            setCurrentPin("");
            setNewPin("");
            setConfirmPin("");
        }
    }, [isOpen, hasPin]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPin !== confirmPin) return toast.error("Pins do not match");
        if (newPin.length !== 4) return toast.error("Pin must be 4 digits");

        setLoading(true);
        try {
            if (mode === "change") {
                await changePin(currentPin, newPin);
                toast.success("Pin changed successfully");
            } else if (mode === "reset") {
                await resetPin(user?.id, newPin);
                toast.success("Pin reset successfully");
            } else {
                await setPin(newPin);
                toast.success("Pin set successfully");
            }
            onSuccess?.();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update pin");
        } finally {
            setLoading(false);
        }
    };

    const getTitle = () => {
        if (mode === "reset") return "Reset Transaction Pin";
        return hasPin ? "Change Transaction Pin" : "Set Transaction Pin";
    };

    const getDesc = () => {
        if (mode === "reset") return "Enter a new 4-digit pin to reset your access.";
        return hasPin ? "Enter your old pin and a new 4-digit pin." : "Create a 4-digit pin for transactions.";
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={getTitle()}
            description={getDesc()}
        >
            <form onSubmit={handleSubmit} className="p-3">
                {mode === "change" && (
                    <div className="mb-3">
                        <Input
                            labelClassName="modal-label"
                            className="modal-input"
                            label="Current Pin"
                            type="password"
                            maxLength={4}
                            value={currentPin}
                            onChange={setCurrentPin}
                        />
                        <div className="text-end mt-1">
                            <button
                                type="button"
                                className="login_forgot_link border-0 bg-transparent p-0"
                                onClick={() => setMode("reset")}
                            >
                                Forgot Pin?
                            </button>
                        </div>
                    </div>
                )}
                <Input
                    labelClassName="modal-label"
                    className="modal-input"
                    label="New Pin"
                    type="password"
                    maxLength={4}
                    value={newPin}
                    onChange={setNewPin}
                    containerClassName="mb-3"
                />
                <Input
                    labelClassName="modal-label"
                    className="modal-input"
                    label="Confirm New Pin"
                    type="password"
                    maxLength={4}
                    value={confirmPin}
                    onChange={setConfirmPin}
                    containerClassName="mb-3"
                />
                <Button
                    type="submit"
                    loading={loading}
                    title={mode === "reset" ? "Reset Pin" : (hasPin ? "Update Pin" : "Set Pin")}
                    className="app_btn_confirm w-100"
                />
                {mode === "reset" && (
                    <Button
                        type="button"
                        title="Back to Change Pin"
                        onClick={() => setMode("change")}
                        className="app_btn_cancel w-100 mt-2"
                        style={{ height: '40px' }}
                    />
                )}
            </form>
        </Modal>
    );
}

// ── Settlement Account Modal ──────────────────────────────────────

export function SettlementModal({ isOpen, onClose, onSuccess }) {
    const [banks, setBanks] = useState([]);
    const [accountNumber, setAccountNumber] = useState("");
    const [bankCode, setBankCode] = useState("");
    const [accountName, setAccountName] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            getBanks().then((res) => {
                setBanks(res || [])
            });
        }
    }, [isOpen]);

    const handleVerify = async () => {
        if (accountNumber.length !== 10 || !bankCode) return;
        setVerifying(true);
        try {
            const res = await verifyBankAccount(accountNumber, bankCode);
            setAccountName(res.data?.account_name || "");
        } catch (err) {
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
            onSuccess?.();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || "Update failed");
        } finally {
            setUpdating(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Settlement Account"
            description="Update where your withdrawals will be sent."
        >
            <div className="p-3">
                <Input
                    labelClassName="modal-label"
                    className="modal-input"
                    label="Select Bank"
                    select
                    options={banks.map((b) => ({ label: b.name, value: b.code }))}
                    value={bankCode}
                    onChange={setBankCode}
                    containerClassName="mb-3"
                />
                <Input
                    labelClassName="modal-label"
                    className="modal-input"
                    label="Account Number"
                    type="text"
                    maxLength={10}
                    value={accountNumber}
                    onChange={(val) => {
                        setAccountNumber(val);
                        if (val.length === 10) setAccountName(""); // reset if editing
                    }}
                    containerClassName="mb-3"
                />
                {accountNumber.length === 10 && (
                    <div className="mb-3">
                        <Button
                            title={verifying ? "Verifying..." : "Verify Account"}
                            onClick={handleVerify}
                            disabled={verifying || !bankCode}
                            className="app_btn_cancel w-100"
                            style={{ height: "35px" }}
                        />
                    </div>
                )}
                {accountName && (
                    <div className="settlement_box mb-3" style={{ background: "rgba(34, 197, 94, 0.05)", borderColor: "#22c55e" }}>
                        <div className="settlement_header" style={{ color: "#22c55e" }}>Verified Account Name</div>
                        <div className="settlement_value">{accountName}</div>
                    </div>
                )}
                <Button
                    title="Update Account"
                    loading={updating}
                    disabled={!accountName || updating}
                    onClick={handleUpdate}
                    className="app_btn_confirm w-100"
                />
            </div>
        </Modal>
    );
}
