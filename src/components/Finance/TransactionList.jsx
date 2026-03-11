import moment from "moment";
import { MdArrowDownward, MdArrowUpward } from "react-icons/md";

export default function TransactionList({ transactions, currency = "NGN" }) {
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(
      Math.abs(amount || 0),
    );

  if (!transactions || transactions.length === 0) {
    return (
      <div className="wallet_empty">
        <MdArrowDownward
          size={24}
          style={{ color: "var(--text-muted)", opacity: 0.4 }}
        />
        <p>No transactions yet.</p>
      </div>
    );
  }

  return (
    <div className="transaction_list">
      {transactions.map((tx) => {
        const isCredit = tx.type === "CREDIT";
        return (
          <div key={tx.id} className="transaction_item">
            <div className="transaction_info">
              <div
                className={`transaction_icon ${isCredit ? "icon_credit" : "icon_debit"}`}
              >
                {isCredit ? (
                  <MdArrowDownward size={15} />
                ) : (
                  <MdArrowUpward size={15} />
                )}
              </div>
              <div className="transaction_details">
                <span className="transaction_desc">
                  {tx.description ||
                    (isCredit ? "Wallet Top Up" : "Withdrawal")}
                </span>
                <span className="transaction_date">
                  {moment(tx.createdAt).format("MMM DD, YYYY • hh:mm A")}
                </span>
              </div>
            </div>
            <div
              className={`transaction_amount ${isCredit ? "amount_credit" : "amount_debit"}`}
            >
              {isCredit ? "+" : "−"}
              {formatCurrency(tx.amount)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
