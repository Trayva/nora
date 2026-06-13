import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyTickets } from "../../../api/ticketApi";
import {
  MdAdd,
  MdOutlineHelpOutline,
  MdChatBubbleOutline,
} from "react-icons/md";
import moment from "moment";
import CreateTicketModal from "../../../components/Support/CreateTicketModal";
import "../Profile.css"; // Reuse some card styles or create Support.css
import "./Support.css";

export default function UserTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await getMyTickets();
      setTickets(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "OPEN": return "var(--info)";
      case "IN_PROGRESS": return "var(--warning)";
      case "WAITING_ON_USER": return "var(--accent)";
      case "RESOLVED": return "var(--success)";
      case "CLOSED": return "var(--text-muted)";
      default: return "var(--text-muted)";
    }
  };

  return (
    <div className="support-dashboard page_wrapper">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <h2 className="page_title_big m-0">Support Tickets</h2>
          <p className="welcome_message" style={{ marginTop: 4 }}>Need help? We're here for you.</p>
        </div>
        <button
          className="app_btn app_btn_confirm"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
          onClick={() => setCreateModalOpen(true)}
        >
          <MdAdd size={18} />
          <span>New Ticket</span>
        </button>
      </div>

      <div className="tickets-list">
        {loading ? (
          <div className="loading-state">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            <MdOutlineHelpOutline size={48} className="empty-icon" />
            <h3 style={{ margin: "0 0 8px" }}>No tickets found</h3>
            <p style={{ margin: "0 0 20px" }}>You don't have any open support requests.</p>
            <button className="app_btn app_btn_confirm" onClick={() => setCreateModalOpen(true)}>
              Open a Ticket
            </button>
          </div>
        ) : (
          <div className="ticket-cards">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="ticket-card"
                onClick={() => navigate(`/app/support/${t.id}`)}
              >
                <div className="ticket-header">
                  <h4>{t.subject}</h4>
                  <span
                    className="ticket-status"
                    style={{
                      backgroundColor: `${getStatusColor(t.status)}20`,
                      color: getStatusColor(t.status),
                    }}
                  >
                    {t.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="ticket-meta">
                  <span className="ticket-id">#{t.id.slice(0, 8)}</span>
                  <span className="ticket-category">{t.category}</span>
                  <span className="ticket-date">
                    {moment(t.updatedAt).format("MMM D, YYYY")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <CreateTicketModal
          isOpen={isCreateModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false);
            fetchTickets();
          }}
        />
      )}
    </div>
  );
}
