import { MdAdd, MdFileUpload } from "react-icons/md";

export default function WalletCard({ balance, onTopup, onWithdraw }) {
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount || 0);

  return (
    <div className="wallet_card">
      <div className="wallet_card_bg" />
      <div className="wallet_balance_label">Available Balance</div>
      <div className="wallet_balance_amount">{formatCurrency(balance)}</div>
      <div className="wallet_actions">
        <button className="wallet_action_btn" onClick={onTopup}>
          <MdAdd size={18} />
          Topup
        </button>
        <button className="wallet_action_btn" onClick={onWithdraw}>
          <MdFileUpload size={18} />
          Withdraw
        </button>
      </div>
    </div>
  );
}