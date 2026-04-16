import React, { useState, useEffect, useRef } from "react";
import {
  BsChatDotsFill,
  BsSendFill,
  BsRobot,
  BsXCircleFill,
  BsArrowsAngleExpand,
  BsArrowsAngleContract
} from "react-icons/bs";
import { LuSparkles } from "react-icons/lu";
import api from "../api/axios";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import "./SmartSupport.css";
import nora_white from "../assets/nora_white - icon.png";
import nora_dark from "../assets/nora_dark - icon.png";
import nora_white_icon from "../assets/nora_white_icon.png";

const SmartSupport = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const nora_logo = theme === "dark" ? nora_white : nora_dark;
  const assistant_avatar = theme === "dark" ? nora_white_icon : nora_dark;
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeView, setActiveView] = useState("landing"); // landing, chat, history
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load sessions when opened
  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  const loadSessions = async () => {
    try {
      const res = await api.get("/ai-support/my-sessions");
      setSessions(res.data.data);
    } catch (err) {
      console.error("Failed to load sessions", err);
    }
  };

  const handleStartSession = async () => {
    setActiveView("chat");
    try {
      setIsOnline(true);
      const res = await api.post("/ai-support/session");
      const { sessionId, report } = res.data.data;
      setSessionId(sessionId);

      // Add initial AI message
      setMessages([
        {
          role: "ai",
          content: report,
          suggestions: [
            "Show my wallet balance",
            "List my pending invoices",
            "Any open maintenance issues?",
            "Help me with tasks today"
          ]
        }
      ]);
    } catch (err) {
      console.error("Failed to start AI session", err);
      setIsOnline(false);
      setMessages([
        {
          role: "ai",
          content: "I'm having trouble connecting to the support system right now. Please try again in a moment."
        }
      ]);
    }
  };

  const resumeSession = async (id) => {
    setActiveView("chat");
    setIsLoading(true);
    try {
      const res = await api.get(`/ai-support/my-sessions/${id}`);
      const session = res.data.data;
      setSessionId(session.id);
      setMessages(session.messages.map(m => ({
        role: m.role === 'model' || m.role === 'assistant' ? 'ai' : 'user',
        content: m.content,
        action: m.action,
        actionResult: m.action?.result,
        suggestions: []
      })));
      setIsOnline(true);
    } catch (err) {
      console.error("Failed to resume session", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (text = inputValue) => {
    const msg = text.trim();
    if (!msg || !sessionId || isLoading) return;

    setInputValue("");
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setIsLoading(true);

    try {
      const res = await api.post("/ai-support/chat", {
        sessionId,
        message: msg
      });

      const { reply, action, actionResult, suggestions } = res.data.data;

      setMessages(prev => [
        ...prev,
        {
          role: "ai",
          content: reply,
          action,
          actionResult,
          suggestions
        }
      ]);
    } catch (err) {
      console.error("Chat error", err);
      setMessages(prev => [
        ...prev,
        { role: "ai", content: "Sorry, something went wrong. Let me try that again." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const parseMarkdown = (text) => {
    if (!text) return "";
    let html = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Table extraction & formatting
    html = html.replace(/(?:^\|.*\|$\n?)+/gm, (match) => {
      const rows = match.trim().split("\n");
      let tableHtml = '<div class="table-container"><table class="md-table">';
      rows.forEach((row, rowIndex) => {
        if (row.includes("---")) return;
        let cleanRow = row.trim();
        if (cleanRow.startsWith("|")) cleanRow = cleanRow.substring(1);
        if (cleanRow.endsWith("|")) cleanRow = cleanRow.substring(0, cleanRow.length - 1);
        const cols = cleanRow.split("|");
        tableHtml += "<tr>";
        cols.forEach(col => {
          const tag = rowIndex === 0 ? "th" : "td";
          const content = col.trim();
          const cellValue = rowIndex === 0 ? content : formatBadge(content);
          tableHtml += `<${tag}>${cellValue}</${tag}>`;
        });
        tableHtml += "</tr>";
      });
      tableHtml += "</table></div>";
      return tableHtml;
    });

    html = html
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/(?:^|\n)\s*\*\s+(.*)/g, '<br><span style="color:#818cf8">•</span>&nbsp; $1')
      .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.1);padding:2px 4px;border-radius:4px;font-family:monospace;font-size:0.9em;color:#818cf8;">$1</code>')
      .replace(/\n/g, "<br>");

    // Re-enable <br> tags that might have been escaped or intended as line breaks
    html = html.replace(/&lt;br\s*\/?&gt;/gi, "<br>");

    return html;
  };

  const formatBadge = (text) => {
    const status = text.toUpperCase();
    const successStates = ['COMPLETED', 'PAID', 'SUCCESS', 'DELIVERED', 'ACTIVE', 'RECEIVED', 'CREDIT'];
    const warningStates = ['PENDING', 'PROCESSING', 'SHIPPED', 'INITIALIZED'];
    const dangerStates = ['FAILED', 'OVERDUE', 'CANCELLED', 'ERROR'];
    const infoStates = ['DEBIT', 'WITHDRAWAL', 'REFUND'];

    let className = "";
    if (successStates.includes(status)) className = "status-completed";
    else if (warningStates.includes(status)) className = "status-pending";
    else if (dangerStates.includes(status)) className = "status-failed";
    else if (infoStates.includes(status)) className = "status-info";
    else return text;

    return `<span class="status-badge ${className}">${text}</span>`;
  };

  return (
    <div className={`smart-support-container ${isOpen ? 'open' : ''}`}>
      {/* FAB Button */}
      <button
        className={`smart-support-fab ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle AI Support"
      >
        {isOpen ? <BsXCircleFill className="fab-icon" /> : <img style={{ width: 35, height: 35, marginBottom: 2 }} src={nora_logo} alt="NORA" className="fab-icon" />}
        {!isOpen && <div className="fab-glow" />}
      </button>

      {/* Chat Window */}
      <div className={`smart-support-window ${isOpen ? 'visible' : ''} ${isFullScreen ? 'full-screen' : ''}`}>
        <div className="support-header">
          <div className="support-brand">
            <img src={nora_logo} alt="NORA" className="support-logo" />
            <div>
              <div className="support-title">NORA AI Manager</div>
              <div className="support-status">
                <span className={`status-dot ${isOnline || activeView === 'landing' ? 'online' : ''}`}></span>
                {isOnline || activeView === 'landing' ? 'Fully Operational' : 'Offline'}
              </div>
            </div>
          </div>
          <div className="header-actions">
            {activeView !== 'landing' && (
              <button
                className={`history-btn ${activeView === 'history' ? 'active' : ''}`}
                onClick={() => setActiveView(activeView === 'history' ? 'chat' : 'history')}
                title="Session History"
              >
                <BsRobot size={18} />
              </button>
            )}
            <button
              className="expand-btn"
              onClick={() => setIsFullScreen(!isFullScreen)}
              title={isFullScreen ? "Exit Fullscreen" : "Expand to Fullscreen"}
            >
              {isFullScreen ? <BsArrowsAngleContract size={16} /> : <BsArrowsAngleExpand size={16} />}
            </button>
            <LuSparkles 
              className="sparkle-icon" 
              onClick={() => setActiveView('landing')} 
              style={{ cursor: 'pointer' }}
              title="Home"
            />
            <button className="mobile-close-btn" onClick={() => setIsOpen(false)}>
              <BsXCircleFill size={20} />
            </button>
          </div>
        </div>

        {activeView === 'landing' && (
          <div className="support-landing">
            <div className="landing-hero">
              <div className="hero-logo-wrapper">
                <img src={nora_logo} alt="NORA" className="hero-logo" />
                <div className="hero-logo-glow" />
              </div>
              <h2 className="landing-title">NORA AI Manager</h2>
              <p className="landing-description">
                Welcome back! I'm your intelligent virtual manager, here to help you navigate NORA, manage your finances, maintenance, and track your business performance.
              </p>
            </div>

            <div className="landing-actions">
              <button 
                className="action-card primary" 
                onClick={handleStartSession}
                disabled={isLoading}
              >
                <div className="action-icon-circle">
                  <BsChatDotsFill size={20} />
                </div>
                <div className="action-text">
                  <span className="action-label">Start New Chat</span>
                  <span className="action-sub">Get instant help from NORA</span>
                </div>
              </button>

              <button 
                className="action-card secondary" 
                onClick={() => setActiveView('history')}
              >
                <div className="action-icon-circle">
                  <BsRobot size={20} />
                </div>
                <div className="action-text">
                  <span className="action-label">View History</span>
                  <span className="action-sub">Resume past conversations</span>
                </div>
              </button>
            </div>
            
            <div className="landing-footer">
              <span className="footer-tag">AI Powered • Real-time Data • Secure</span>
            </div>
          </div>
        )}

        {activeView === 'history' && (
          <div className="support-history">
            <div className="history-title">Recent Sessions</div>
            {sessions.length > 0 ? (
              <div className="history-list">
                {sessions.map(s => (
                  <div key={s.id} className="history-item" onClick={() => resumeSession(s.id)}>
                    <div className="history-date">
                      {new Date(s.createdAt).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                    <div className="history-preview">
                      {s.messages.length > 0 ? s.messages[0].content : "No messages"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="history-empty">No previous sessions found.</div>
            )}
            <button className="new-session-btn" onClick={handleStartSession}>
              + Start New Session
            </button>
          </div>
        )}

        {activeView === 'chat' && (
          <>
            <div className="support-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`message ${msg.role === 'user' ? 'user' : 'ai'}`}>
                  <div className="avatar">
                    {msg.role === 'user' ? (
                      user?.image ? <img src={user.image} alt={user.fullName} /> : <span>{user?.fullName?.substring(0, 2).toUpperCase() || "U"}</span>
                    ) : (
                      <img src={assistant_avatar} alt="NORA" style={{ padding: '4px' }} />
                    )}
                  </div>
                  <div className="bubble-wrapper">
                    <div
                      className="bubble"
                      dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
                    />

                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="suggestion-chips" style={{ marginTop: '12px' }}>
                        {msg.suggestions.map((s, si) => (
                          <button
                            key={si}
                            className="chip"
                            onClick={() => handleSendMessage(s)}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}

                    {msg.action && (
                      <div className={`action-badge ${msg.actionResult?.success ? 'ok' : 'pending'}`}>
                        ⚡ {msg.action.type} — {msg.actionResult?.success ? '✅ Done' : '⏳ Processing'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="message ai">
                  <div className="avatar">
                    <img src={nora_logo} alt="NORA" style={{ padding: '4px' }} />
                  </div>
                  <div className="typing-indicator">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="support-input-container">
              <div className="input-wrapper">
                <input
                  type="text"
                  className="support-input"
                  placeholder="Ask NORA anything..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={isLoading || !isOnline}
                />
                <button
                  className="send-button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isLoading || !isOnline}
                >
                  <BsSendFill size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SmartSupport;
