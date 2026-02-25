import moment from "moment";
import { MdArrowDownward, MdArrowUpward } from "react-icons/md";

export default function TransactionList({ transactions }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
        }).format(Math.abs(amount || 0));
    };

    if (!transactions || transactions.length === 0) {
        return (
            <div className="text-center py-4 muted">
                No transactions found.
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
                            <div className={`transaction_icon ${isCredit ? "icon_credit" : "icon_debit"}`}>
                                {isCredit ? <MdArrowDownward /> : <MdArrowUpward />}
                            </div>
                            <div className="transaction_details">
                                <span className="transaction_desc">{tx.description || (isCredit ? "Wallet Topup" : "Withdrawal")}</span>
                                <span className="transaction_date">{moment(tx.createdAt).format("MMM DD, YYYY • hh:mm A")}</span>
                            </div>
                        </div>
                        <div className={`transaction_amount ${isCredit ? "amount_credit" : "amount_debit"}`}>
                            {isCredit ? "+" : "-"}{formatCurrency(tx.amount)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
