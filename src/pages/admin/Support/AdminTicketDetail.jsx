import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminGetTicketDetails, adminReplyToTicket, adminUpdateTicket } from "../../../api/ticketApi";
import { MdArrowBack, MdSend, MdOutlineNoteAlt } from "react-icons/md";
import moment from "moment";
import { toast } from "react-toastify";
import { useAuth } from "../../../contexts/AuthContext";
import "../../app/support/Support.css"; // Reuse chat styles

export default function AdminTicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Reply State
  const [replyText, setReplyText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Update State
  const [updating, setUpdating] = useState(false);

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
      const data = await adminGetTicketDetails(id);
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
      await adminReplyToTicket(id, { message: replyText, isInternal });
      setReplyText("");
      // Don't reset isInternal automatically so they can send multiple notes if needed
      fetchTicket(); 
    } catch (err) {
      console.error(err);
      toast.error("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const handleUpdateTicket = async (field, value) => {
    try {
      setUpdating(true);
      await adminUpdateTicket(id, { [field]: value });
      toast.success(`${field} updated successfully`);
      fetchTicket();
    } catch (err) {
      console.error(err);
      toast.error(`Failed to update ${field}`);
    } finally {
      setUpdating(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
  };

  if (loading) return <div className="page_wrapper loading-state">Loading ticket...</div>;
  if (!ticket) return <div className="page_wrapper empty-state">Ticket not found</div>;

  return (
    <div className="ticket-detail-page page_wrapper" style={{ display: "flex", flexDirection: "row", gap: "24px" }}>
      
      {/* Left Column: Chat UI */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div className="ticket-detail-header">
          <div>
            <button onClick={() => navigate("/app/admin/support")} style={{ marginBottom: "12px", background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, padding: 0 }}>
              <MdArrowBack size={18} /> Back to Tickets
            </button>
            <h2 className="page_title_big m-0" style={{ marginBottom: 8 }}>{ticket.subject}</h2>
            <div className="ticket-meta">
              <span>Ticket #{ticket.id.slice(0, 8)}</span>
              <span>•</span>
              <span>{ticket.category}</span>
              <span>•</span>
              <span>Created {moment(ticket.createdAt).format("MMM D, YYYY")}</span>
            </div>
          </div>
        </div>

        <div className="chat-container">
          {/* Original Description */}
          <div className="chat-message">
            <div className="chat-avatar">
              {ticket.user?.image ? (
                <img src={ticket.user.image} alt="User" style={{ width: "100%", height: "100%", borderRadius: "50%" }} />
              ) : (
                getInitials(ticket.user?.fullName || ticket.guestName)
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div className="chat-sender-info">
                <span>
                  {ticket.user?.fullName || ticket.guestName}
                  {!ticket.userId && (
                    <span style={{ marginLeft: 6, fontSize: "0.7rem", background: "rgba(108,99,255,0.1)", color: "#6c63ff", padding: "2px 7px", borderRadius: 999, fontWeight: 700 }}>Guest</span>
                  )}
                </span>
                <span>{moment(ticket.createdAt).format("MMM D, YYYY h:mm a")}</span>
              </div>
              <div className="chat-bubble">
                {ticket.description}
              </div>
            </div>
          </div>

          {/* Replies */}
          {ticket.messages.map((msg) => {
            // In Admin view, "own" means any admin reply
            const isFromUser = ticket.userId ? msg.senderId === ticket.userId : !msg.senderId;
            const isOwn = !isFromUser; 
            const senderName = msg.sender?.fullName || msg.senderName || ticket.guestName || "User";

            return (
              <div key={msg.id} className={`chat-message ${isOwn ? "own" : ""} ${msg.isInternal ? "internal" : ""}`}>
                {!isOwn && (
                  <div className="chat-avatar">
                    {msg.sender?.image ? (
                      <img src={msg.sender.image} alt="User" style={{ width: "100%", height: "100%", borderRadius: "50%" }} />
                    ) : (
                      getInitials(senderName)
                    )}
                  </div>
                )}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: isOwn ? "flex-end" : "flex-start" }}>
                  <div className="chat-sender-info" style={{ color: msg.isInternal ? "var(--warning)" : "inherit" }}>
                    <span>
                      {isFromUser ? senderName : `${senderName} (Admin)`}
                      {msg.isInternal && " • Internal Note"}
                    </span>
                    <span>{moment(msg.createdAt).format("MMM D, h:mm a")}</span>
                  </div>
                  <div className="chat-bubble" style={msg.isInternal ? { background: "var(--warning)", color: "#000", borderColor: "var(--warning)" } : {}}>
                    {msg.message}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-area" onSubmit={handleSendReply}>
          <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.9rem", color: "var(--text-body)" }}>
              <input 
                type="checkbox" 
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
              />
              <MdOutlineNoteAlt size={18} color="var(--warning)" />
              Internal Note (Hidden from user)
            </label>
          </div>
          <div className="chat-input-form">
            <textarea
              className="chat-textarea"
              placeholder={isInternal ? "Type an internal note for admins..." : "Type your reply to the user..."}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              disabled={sending}
              style={isInternal ? { borderLeft: "4px solid var(--warning)", background: "rgba(245, 158, 11, 0.05)" } : {}}
            />
            <div className="chat-actions">
              <button 
                type="submit" 
                className="app_btn app_btn_confirm" 
                disabled={sending || !replyText.trim()}
                style={{ display: "flex", alignItems: "center", gap: 6, ...(isInternal ? { background: "var(--warning)", color: "#000" } : {}) }}
              >
                {sending ? "Sending..." : (isInternal ? "Add Note" : "Send Reply")} 
                {!isInternal && <MdSend size={16} />}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Right Column: Ticket Controls */}
      <div style={{ width: "300px", display: "flex", flexDirection: "column", gap: "24px" }}>
        
        <div className="card" style={{ padding: "20px", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem" }}>Ticket Properties</h3>
          
          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>Status</label>
            <select 
              className="modal-input" 
              value={ticket.status}
              onChange={(e) => handleUpdateTicket("status", e.target.value)}
              disabled={updating}
            >
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_ON_USER">Waiting on User</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>Priority</label>
            <select 
              className="modal-input" 
              value={ticket.priority}
              onChange={(e) => handleUpdateTicket("priority", e.target.value)}
              disabled={updating}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>Category</label>
            <select 
              className="modal-input" 
              value={ticket.category}
              onChange={(e) => handleUpdateTicket("category", e.target.value)}
              disabled={updating}
            >
              <option value="GENERAL">General</option>
              <option value="TECHNICAL">Technical</option>
              <option value="BILLING">Billing</option>
              <option value="ACCOUNT">Account</option>
              <option value="KIOSK_ISSUE">Kiosk Issue</option>
            </select>
          </div>

          <div className="form-group">
            <label style={{ display: "block", marginBottom: "8px", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>Assignee</label>
            {/* For a real app, you'd fetch list of admins. For now, a quick "assign to me" toggle */}
            {ticket.assigneeId ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-hover)", padding: "10px", borderRadius: "8px" }}>
                <span>{ticket.assignee?.fullName}</span>
                {ticket.assigneeId === user.id ? (
                  <button className="app_btn app_btn_cancel" onClick={() => handleUpdateTicket("assigneeId", null)} style={{ padding: "4px 8px", fontSize: "0.75rem" }}>Unassign</button>
                ) : (
                  <button className="app_btn app_btn_cancel" onClick={() => handleUpdateTicket("assigneeId", user.id)} style={{ padding: "4px 8px", fontSize: "0.75rem" }}>Steal</button>
                )}
              </div>
            ) : (
              <button 
                className="app_btn app_btn_cancel" 
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => handleUpdateTicket("assigneeId", user.id)}
                disabled={updating}
              >
                Assign to Me
              </button>
            )}
          </div>

        </div>

        <div className="card" style={{ padding: "20px", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem" }}>
            {ticket.userId ? "User Info" : "Guest Info"}
          </h3>
          {!ticket.userId && (
            <div style={{ marginBottom: 12, display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.72rem", fontWeight: 700, background: "rgba(108,99,255,0.08)", color: "#6c63ff", padding: "3px 10px", borderRadius: 999, border: "1px solid rgba(108,99,255,0.2)" }}>
              Guest Ticket (Unregistered User)
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.9rem" }}>
            <div><strong>Name:</strong> {ticket.user?.fullName || ticket.guestName || "—"}</div>
            <div><strong>Email:</strong> {ticket.user?.email || ticket.guestEmail || "—"}</div>
            {ticket.guestPhone && (
              <div><strong>Phone:</strong> {ticket.guestPhone}</div>
            )}
            {ticket.userId && (
              <div><strong>Account:</strong> <span style={{ color: "#22c55e", fontWeight: 600 }}>Registered</span></div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
