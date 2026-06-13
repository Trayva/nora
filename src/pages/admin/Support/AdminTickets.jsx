import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminGetAllTickets } from "../../../api/ticketApi";
import { MdSearch, MdFilterList, MdOutlineVisibility } from "react-icons/md";
import moment from "moment";
import { toast } from "react-toastify";
import "../../app/support/Support.css";

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", priority: "", category: "" });
  const navigate = useNavigate();

  useEffect(() => {
    fetchTickets();
  }, [filters]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await adminGetAllTickets(filters);
      setTickets(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load tickets");
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
    <div className="page_wrapper">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h2 className="page_title_big m-0">Support Tickets Management</h2>
          <p className="welcome_message" style={{ marginTop: 4 }}>View and manage all user support requests.</p>
        </div>
      </div>

      <div className="filters-bar" style={{ display: "flex", gap: "16px", marginBottom: "24px", background: "var(--bg-card)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border)" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-hover)", padding: "8px 12px", borderRadius: "6px" }}>
          <MdFilterList size={18} color="var(--text-muted)" />
          <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>Filters:</span>
        </div>
        <select 
          className="modal-input" 
          value={filters.status} 
          onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
          style={{ width: "200px" }}
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="WAITING_ON_USER">Waiting on User</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
        
        <select 
          className="modal-input" 
          value={filters.priority} 
          onChange={(e) => setFilters(f => ({ ...f, priority: e.target.value }))}
          style={{ width: "200px" }}
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>

        <select 
          className="modal-input" 
          value={filters.category} 
          onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
          style={{ width: "200px" }}
        >
          <option value="">All Categories</option>
          <option value="GENERAL">General</option>
          <option value="TECHNICAL">Technical</option>
          <option value="BILLING">Billing</option>
          <option value="ACCOUNT">Account</option>
          <option value="KIOSK_ISSUE">Kiosk Issue</option>
        </select>
      </div>

      <div className="table-responsive" style={{ background: "var(--bg-card)", borderRadius: "16px", border: "1px solid var(--border)", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", padding: "8px", animation: "slideUpFade 0.4s ease-out" }}>
        <table className="nora-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Subject</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "40px" }}>Loading tickets...</td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "40px" }}>No tickets found matching criteria.</td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>#{t.id.slice(0, 6)}</td>
                  <td>
                    <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                      {t.user?.fullName || t.guestName || "—"}
                      {!t.userId && (
                        <span style={{ fontSize: "0.65rem", background: "rgba(108,99,255,0.1)", color: "#6c63ff", padding: "2px 6px", borderRadius: 999, fontWeight: 700, flexShrink: 0 }}>
                          Guest
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {t.user?.email || t.guestEmail || ""}
                    </div>
                  </td>
                  <td style={{ maxWidth: "250px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {t.subject}
                  </td>
                  <td>{t.category}</td>
                  <td style={{ fontWeight: 600, color: t.priority === "HIGH" || t.priority === "URGENT" ? "var(--error)" : "inherit" }}>
                    {t.priority}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "20px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        backgroundColor: `${getStatusColor(t.status)}20`,
                        color: getStatusColor(t.status),
                      }}
                    >
                      {t.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    {moment(t.updatedAt).format("MMM D, HH:mm")}
                  </td>
                  <td>
                    <button 
                      className="app_btn app_btn_cancel" 
                      style={{ padding: "6px", display: "inline-flex" }}
                      onClick={() => navigate(`/app/admin/support/${t.id}`)}
                      title="View Details"
                    >
                      <MdOutlineVisibility size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
