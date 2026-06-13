import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTicketDetails, replyToTicket } from "../../../api/ticketApi";
import { MdArrowBack, MdSend } from "react-icons/md";
import moment from "moment";
import { toast } from "react-toastify";
import "./Support.css";

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchTicket();
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [ticket?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const data = await getTicketDetails(id);
      setTicket(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load ticket details");
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      setSending(true);
      await replyToTicket(id, { message: replyText });
      setReplyText("");
      fetchTicket(); // Refresh to get new message and updated status
    } catch (err) {
      console.error(err);
      toast.error("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
  };

  if (loading) return <div className="page_wrapper loading-state">Loading ticket...</div>;
  if (!ticket) return <div className="page_wrapper empty-state">Ticket not found</div>;

  const isClosed = ticket.status === "RESOLVED" || ticket.status === "CLOSED";

  return (
    <div className="ticket-detail-page page_wrapper">
      <div className="ticket-detail-header">
        <div>
          <button onClick={() => navigate("/app/support")} style={{ marginBottom: "12px", background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, padding: 0 }}>
            <MdArrowBack size={18} /> Back to Tickets
          </button>
          <h2 className="page_title_big m-0" style={{ marginBottom: 8 }}>{ticket.subject}</h2>
          <div className="ticket-meta">
            <span>Ticket #{ticket.id.slice(0, 8)}</span>
            <span>•</span>
            <span>{ticket.category}</span>
            <span>•</span>
            <span style={{ fontWeight: 600, color: `var(--${ticket.priority === 'HIGH' || ticket.priority === 'URGENT' ? 'error' : 'text-muted'})` }}>
              {ticket.priority}
            </span>
            <span>•</span>
            <span>Status: <strong>{ticket.status.replace(/_/g, " ")}</strong></span>
          </div>
        </div>
      </div>

      <div className="chat-container">
        {/* Original Description as first message */}
        <div className="chat-message">
          <div className="chat-avatar">
            {ticket.user?.image ? (
              <img src={ticket.user.image} alt="User" style={{ width: "100%", height: "100%", borderRadius: "50%" }} />
            ) : (
              getInitials(ticket.user?.fullName)
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div className="chat-sender-info">
              <span>{ticket.user?.fullName || "You"}</span>
              <span>{moment(ticket.createdAt).format("MMM D, YYYY h:mm a")}</span>
            </div>
            <div className="chat-bubble">
              {ticket.description}
            </div>
          </div>
        </div>

        {/* Replies */}
        {ticket.messages.map((msg) => {
          const isOwn = msg.senderId === ticket.userId;
          return (
            <div key={msg.id} className={`chat-message ${isOwn ? "own" : ""}`}>
              {!isOwn && (
                <div className="chat-avatar" style={{ background: "var(--accent)", color: "#fff" }}>
                  N
                </div>
              )}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: isOwn ? "flex-end" : "flex-start" }}>
                <div className="chat-sender-info">
                  <span>{isOwn ? "You" : (msg.sender?.fullName || "Support Team")}</span>
                  <span>{moment(msg.createdAt).format("MMM D, h:mm a")}</span>
                </div>
                <div className="chat-bubble">
                  {msg.message}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {!isClosed && (
        <form className="chat-input-area" onSubmit={handleSendReply}>
          <div className="chat-input-form">
            <textarea
              className="chat-textarea"
              placeholder="Type your reply here..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              disabled={sending}
            />
            <div className="chat-actions">
              <button type="submit" className="app_btn app_btn_confirm" disabled={sending || !replyText.trim()} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {sending ? "Sending..." : "Send Reply"} <MdSend size={16} />
              </button>
            </div>
          </div>
        </form>
      )}

      {isClosed && (
        <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", background: "var(--bg-hover)", borderRadius: "8px", marginTop: "16px" }}>
          This ticket has been marked as <strong>{ticket.status}</strong> and cannot receive new replies.
        </div>
      )}
    </div>
  );
}
