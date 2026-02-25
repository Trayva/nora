import { useState } from "react";
import { MdAdd, MdFileUpload } from "react-icons/md";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";

export default function WalletCard({ balance, currency, onTopup, onWithdraw }) {
    const [showBalance, setShowBalance] = useState(true);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: currency || "NGN",
        }).format(amount || 0);
    };

    return (
        <div className="wallet_card">
            <div className="wallet_balance_header">
                <div className="wallet_balance_label">Available Balance</div>
                <button
                    className="balance_toggle_btn"
                    onClick={() => setShowBalance(!showBalance)}
                    title={showBalance ? "Hide Balance" : "Show Balance"}
                >
                    {showBalance ? <IoMdEyeOff size={20} /> : <IoMdEye size={20} />}
                </button>
            </div>
            <div className="wallet_balance_amount">
                {showBalance ? formatCurrency(balance) : "****"}
            </div>
            <div className="wallet_actions">
                <button className="wallet_action_btn" onClick={onTopup}>
                    <MdAdd size={20} />
                    Topup
                </button>
                <button className="wallet_action_btn" onClick={onWithdraw}>
                    <MdFileUpload size={20} />
                    Withdraw
                </button>
            </div>
        </div>
    );
}
