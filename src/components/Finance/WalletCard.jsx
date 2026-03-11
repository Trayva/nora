import {
  MdAdd,
  MdFileUpload,
  MdVisibility,
  MdVisibilityOff,
} from "react-icons/md";
import { useState } from "react";

export default function WalletCard({
  balance,
  currency = "NGN",
  onTopup,
  onWithdraw,
}) {
  const [hidden, setHidden] = useState(false);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(
      amount || 0,
    );

  return (
    <div className="wallet_card">
      <div className="wallet_card_bg" />

      <div className="wallet_card_top">
        <span className="wallet_balance_label">Available Balance</span>
        <button
          className="wallet_hide_btn"
          onClick={() => setHidden((v) => !v)}
          title={hidden ? "Show balance" : "Hide balance"}
        >
          {hidden ? <MdVisibilityOff size={16} /> : <MdVisibility size={16} />}
        </button>
      </div>

      <div className="wallet_balance_amount">
        {hidden ? "••••••••" : formatCurrency(balance)}
      </div>

      <div className="wallet_currency_row">
        <span className="wallet_currency_chip">{currency}</span>
      </div>

      <div className="wallet_actions">
        <button className="wallet_action_btn" onClick={onTopup}>
          <MdAdd size={18} />
          Top Up
        </button>
        <div className="wallet_action_divider" />
        <button className="wallet_action_btn" onClick={onWithdraw}>
          <MdFileUpload size={18} />
          Withdraw
        </button>
      </div>
    </div>
  );
}
