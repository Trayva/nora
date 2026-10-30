import { useState, useEffect } from "react";
import {
  MdCheckCircle,
  MdWarning,
  MdCancel,
  MdRefresh,
  MdTask,
  MdListAlt,
  MdReportProblem,
  MdVideocam,
  MdGavel,
  MdTrendingUp,
} from "react-icons/md";
import api from "../../api/axios";

export default function SopComplianceAudit({
  cart,
  onNavigateTab,
  showActions = true,
}) {
  const [loading, setLoading] = useState(true);
  const [auditData, setAuditData] = useState({
    templates: [],
    pendingTasks: [],
    ledger: [],
    reports: [],
  });

  const fetchAuditData = async () => {
    if (!cart?.id) return;
    setLoading(true);
    try {
      const [templatesRes, pendingRes, ledgerRes, reportsRes] =
        await Promise.allSettled([
          api.get(`/kiosk/tasks/templates?kioskId=${cart.id}`),
          api.get(`/kiosk/tasks?kioskId=${cart.id}`),
          api.get(`/kiosk/tasks/ledger?kioskId=${cart.id}`),
          api.get(`/kiosk/maintenance/kiosk/${cart.id}`),
        ]);

      const templates =
        templatesRes.status === "fulfilled"
          ? templatesRes.value.data?.data?.items ||
            templatesRes.value.data?.data ||
            []
          : [];

      const pendingTasks =
        pendingRes.status === "fulfilled"
          ? pendingRes.value.data?.data?.items ||
            pendingRes.value.data?.data ||
            []
          : [];

      const ledger =
        ledgerRes.status === "fulfilled"
          ? ledgerRes.value.data?.data?.items ||
            ledgerRes.value.data?.data ||
            []
          : [];

      const reports =
        reportsRes.status === "fulfilled"
          ? reportsRes.value.data?.data?.items ||
            reportsRes.value.data?.data ||
            []
          : cart?.reports || [];

      setAuditData({
        templates: Array.isArray(templates) ? templates : [],
        pendingTasks: Array.isArray(pendingTasks) ? pendingTasks : [],
        ledger: Array.isArray(ledger) ? ledger : [],
        reports: Array.isArray(reports) ? reports : [],
      });
    } catch (err) {
      console.error("Failed to fetch SOP compliance audit data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, [cart?.id]);

  // Compute metrics
  const { templates, pendingTasks, ledger, reports } = auditData;

  const completedTasks = ledger.filter(
    (t) => t.status === "COMPLETED" || t.status === "SUBMITTED"
  );
  const missedTasks = ledger.filter((t) => t.status === "MISSED");
  const totalTrackedTasks = completedTasks.length + missedTasks.length;
  const completionRate =
    totalTrackedTasks > 0
      ? Math.round((completedTasks.length / totalTrackedTasks) * 100)
      : null;

  const openReports = reports.filter(
    (r) => r.status === "PENDING" || r.status === "IN_PROGRESS"
  );
  const resolvedReports = reports.filter(
    (r) => r.status === "RESOLVED" || r.status === "CLOSED"
  );
  const warningReports = reports.filter(
    (r) =>
      (r.reportText || "").toUpperCase().includes("WARNING") ||
      (r.reportText || "").toUpperCase().includes("INFRACTION")
  );

  // Compute compliance score and status
  let score = 85; // baseline
  if (completionRate !== null) {
    score = completionRate;
  }
  if (warningReports.length > 0) {
    score = Math.max(15, score - warningReports.length * 15);
  }
  if (openReports.length > 0) {
    score = Math.max(20, score - openReports.length * 8);
  }
  if (templates.length === 0) {
    score = Math.min(score, 65);
  }

  let complianceStatus = "GOOD";
  let statusColor = "#16a34a";
  let statusBg = "rgba(34,197,94,0.1)";
  let statusBorder = "rgba(34,197,94,0.25)";
  let statusLabel = "GOOD COMPLIANCE";

  if (score < 60 || warningReports.length >= 2 || missedTasks.length >= 4) {
    complianceStatus = "POOR";
    statusColor = "#ef4444";
    statusBg = "rgba(239,68,68,0.1)";
    statusBorder = "rgba(239,68,68,0.25)";
    statusLabel = "NON-COMPLIANT";
  } else if (
    score < 80 ||
    warningReports.length > 0 ||
    openReports.length > 0 ||
    missedTasks.length > 0
  ) {
    complianceStatus = "MODERATE";
    statusColor = "#ca8a04";
    statusBg = "rgba(234,179,8,0.1)";
    statusBorder = "rgba(234,179,8,0.25)";
    statusLabel = "NEEDS MONITORING";
  }

  // Generate granular diagnostic notes
  const goodNotes = [];
  const badNotes = [];

  // 1. SOPs / Templates evaluation
  if (templates.length > 0) {
    const names = templates.slice(0, 3).map((t) => t.name).join(", ");
    goodNotes.push(
      `SOP Checklists Active: ${templates.length} standard procedure template${
        templates.length > 1 ? "s" : ""
      } configured (${names}${templates.length > 3 ? "..." : ""}).`
    );
  } else {
    badNotes.push(
      "Missing SOP Templates: No standardized task templates or opening/closing checklists configured for this outlet."
    );
  }

  // 2. Tasks & Execution evaluation
  if (completionRate !== null) {
    if (completionRate >= 80) {
      goodNotes.push(
        `High Task Execution: ${completionRate}% of scheduled SOP tasks completed on time (${completedTasks.length} completed).`
      );
    } else {
      badNotes.push(
        `Low Task Completion: Only ${completionRate}% of tasks completed on schedule (${completedTasks.length} completed, ${missedTasks.length} missed).`
      );
    }
  } else if (pendingTasks.length > 0) {
    goodNotes.push(
      `${pendingTasks.length} operational task(s) currently active for operator submission.`
    );
  }

  if (missedTasks.length > 0) {
    badNotes.push(
      `${missedTasks.length} Task(s) MISSED: Operational shift checklist was skipped or not submitted within deadline.`
    );
  } else if (completedTasks.length > 0) {
    goodNotes.push(
      "Zero Missed Tasks: 100% submission adherence without any missed operational tasks in recent cycles."
    );
  }

  // 3. Reports & Incidents evaluation
  if (warningReports.length > 0) {
    badNotes.push(
      `Brand Warning Active: ${warningReports.length} formal compliance infraction notice(s) on record for this outlet.`
    );
  } else {
    goodNotes.push(
      "Infraction-Free: Zero brand compliance warnings or procedural violation notices recorded."
    );
  }

  if (openReports.length > 0) {
    badNotes.push(
      `${openReports.length} Unresolved Report(s): Maintenance/incident tickets are still pending resolution.`
    );
  } else if (reports.length > 0) {
    goodNotes.push(
      `All Issues Resolved: All ${reports.length} reported maintenance and incident logs have been resolved.`
    );
  } else {
    goodNotes.push(
      "Facility Health: Zero operational breakdown or incident reports filed."
    );
  }

  // Overall short synthesis note
  let shortSummaryNote = "";
  if (complianceStatus === "GOOD") {
    shortSummaryNote =
      "Overall compliance is GOOD. The franchisee is consistently executing operational SOPs with strong task completion, no active infractions, and clean facility maintenance records.";
  } else if (complianceStatus === "MODERATE") {
    const issues = [];
    if (missedTasks.length > 0) issues.push(`${missedTasks.length} missed task(s)`);
    if (openReports.length > 0)
      issues.push(`${openReports.length} open maintenance ticket(s)`);
    if (warningReports.length > 0)
      issues.push(`${warningReports.length} active warning(s)`);
    if (templates.length === 0) issues.push("unconfigured SOP templates");

    shortSummaryNote = `Compliance is MODERATE with specific attention needed. Core operations are functioning, but improvement is required regarding ${
      issues.length > 0 ? issues.join(", ") : "regular task submission timing"
    }.`;
  } else {
    shortSummaryNote =
      "Overall compliance is NON-COMPLIANT and requires immediate corrective intervention. The outlet demonstrates operational gaps including multiple missed checklists, active warning notices, or unresolved critical issues.";
  }

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        padding: "18px",
        marginBottom: "20px",
      }}
    >
      {/* ── Top Header Row ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.75rem",
              fontWeight: 800,
              padding: "4px 12px",
              borderRadius: 20,
              background: statusBg,
              color: statusColor,
              border: `1px solid ${statusBorder}`,
              letterSpacing: "0.04em",
            }}
          >
            {complianceStatus === "GOOD" ? (
              <MdCheckCircle size={15} />
            ) : complianceStatus === "MODERATE" ? (
              <MdWarning size={15} />
            ) : (
              <MdCancel size={15} />
            )}
            {statusLabel}
          </span>

          <span
            style={{
              fontSize: "0.85rem",
              fontWeight: 800,
              color: "var(--text-heading)",
            }}
          >
            Score: {score}%
          </span>
        </div>

        <button
          onClick={fetchAuditData}
          disabled={loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 10px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--bg-hover)",
            color: "var(--text-muted)",
            fontSize: "0.72rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
          title="Refresh Compliance Audit"
        >
          <MdRefresh
            size={14}
            style={{
              animation: loading ? "spin 1s linear infinite" : "none",
            }}
          />
          {loading ? "Auditing..." : "Refresh Audit"}
        </button>
      </div>

      {/* ── Metrics Summary Chips ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            padding: "8px 12px",
            background: "var(--bg-hover)",
            borderRadius: 10,
            border: "1px solid var(--border)",
          }}
        >
          <span
            style={{
              fontSize: "0.68rem",
              color: "var(--text-muted)",
              display: "block",
            }}
          >
            SOP Templates
          </span>
          <span
            style={{
              fontSize: "0.88rem",
              fontWeight: 800,
              color: "var(--text-heading)",
            }}
          >
            {templates.length} Active
          </span>
        </div>

        <div
          style={{
            padding: "8px 12px",
            background: "var(--bg-hover)",
            borderRadius: 10,
            border: "1px solid var(--border)",
          }}
        >
          <span
            style={{
              fontSize: "0.68rem",
              color: "var(--text-muted)",
              display: "block",
            }}
          >
            Task Adherence
          </span>
          <span
            style={{
              fontSize: "0.88rem",
              fontWeight: 800,
              color: completionRate !== null && completionRate >= 80 ? "#16a34a" : completionRate !== null ? "#ca8a04" : "var(--text-heading)",
            }}
          >
            {completionRate !== null ? `${completionRate}%` : "No cycles"}
          </span>
        </div>

        <div
          style={{
            padding: "8px 12px",
            background: "var(--bg-hover)",
            borderRadius: 10,
            border: "1px solid var(--border)",
          }}
        >
          <span
            style={{
              fontSize: "0.68rem",
              color: "var(--text-muted)",
              display: "block",
            }}
          >
            Missed Tasks
          </span>
          <span
            style={{
              fontSize: "0.88rem",
              fontWeight: 800,
              color: missedTasks.length > 0 ? "#ef4444" : "#16a34a",
            }}
          >
            {missedTasks.length} Missed
          </span>
        </div>

        <div
          style={{
            padding: "8px 12px",
            background: "var(--bg-hover)",
            borderRadius: 10,
            border: "1px solid var(--border)",
          }}
        >
          <span
            style={{
              fontSize: "0.68rem",
              color: "var(--text-muted)",
              display: "block",
            }}
          >
            Open Reports / Warns
          </span>
          <span
            style={{
              fontSize: "0.88rem",
              fontWeight: 800,
              color: openReports.length > 0 || warningReports.length > 0 ? "#ef4444" : "#16a34a",
            }}
          >
            {openReports.length} Open · {warningReports.length} Warn
          </span>
        </div>
      </div>

      {/* ── Executive Summary Callout ── */}
      <div
        style={{
          padding: "12px 14px",
          borderRadius: "10px",
          background:
            complianceStatus === "GOOD"
              ? "rgba(34,197,94,0.06)"
              : complianceStatus === "MODERATE"
              ? "rgba(234,179,8,0.06)"
              : "rgba(239,68,68,0.06)",
          border: `1px solid ${
            complianceStatus === "GOOD"
              ? "rgba(34,197,94,0.2)"
              : complianceStatus === "MODERATE"
              ? "rgba(234,179,8,0.2)"
              : "rgba(239,68,68,0.2)"
          }`,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: "0.72rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: statusColor,
            marginBottom: 4,
          }}
        >
          Compliance Audit Note
        </div>
        <p
          style={{
            margin: 0,
            fontSize: "0.8rem",
            color: "var(--text-heading)",
            lineHeight: 1.5,
            fontWeight: 600,
          }}
        >
          {shortSummaryNote}
        </p>
      </div>

      {/* ── Diagnostic Breakdown: Where Good vs Where Not Good ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 12,
        }}
      >
        {/* Where Compliance is Good */}
        <div
          style={{
            background: "rgba(34,197,94,0.03)",
            border: "1px solid rgba(34,197,94,0.18)",
            borderRadius: "12px",
            padding: "14px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.76rem",
              fontWeight: 800,
              color: "#16a34a",
              marginBottom: 10,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            <MdCheckCircle size={16} />
            Where Compliance is Good
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {goodNotes.map((note, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  fontSize: "0.76rem",
                  color: "var(--text-body)",
                  lineHeight: 1.45,
                }}
              >
                <span
                  style={{
                    color: "#16a34a",
                    fontWeight: 900,
                    marginTop: 2,
                    fontSize: "0.7rem",
                  }}
                >
                  ✓
                </span>
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Where Compliance is NOT Good / Attention Needed */}
        <div
          style={{
            background:
              badNotes.length > 0
                ? "rgba(239,68,68,0.03)"
                : "rgba(107,114,128,0.03)",
            border: `1px solid ${
              badNotes.length > 0
                ? "rgba(239,68,68,0.18)"
                : "var(--border)"
            }`,
            borderRadius: "12px",
            padding: "14px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.76rem",
              fontWeight: 800,
              color: badNotes.length > 0 ? "#ef4444" : "var(--text-muted)",
              marginBottom: 10,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            {badNotes.length > 0 ? (
              <MdWarning size={16} />
            ) : (
              <MdCheckCircle size={16} color="#16a34a" />
            )}
            {badNotes.length > 0
              ? "Areas Requiring Attention"
              : "No Compliance Breaches"}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {badNotes.length > 0 ? (
              badNotes.map((note, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    fontSize: "0.76rem",
                    color: "var(--text-body)",
                    lineHeight: 1.45,
                  }}
                >
                  <span
                    style={{
                      color: "#ef4444",
                      fontWeight: 900,
                      marginTop: 2,
                      fontSize: "0.7rem",
                    }}
                  >
                    ⚠
                  </span>
                  <span>{note}</span>
                </div>
              ))
            ) : (
              <div
                style={{
                  fontSize: "0.76rem",
                  color: "var(--text-muted)",
                  lineHeight: 1.45,
                }}
              >
                No operational infractions, missed tasks, or unresolved
                maintenance tickets found for this outlet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Brand Actions ── */}
      {showActions && onNavigateTab && (
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 14,
            paddingTop: 12,
            borderTop: "1px solid var(--border)",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => onNavigateTab("inspection")}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--bg-hover)",
              color: "var(--text-heading)",
              fontSize: "0.72rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <MdVideocam size={14} color="var(--accent)" />
            Inspect via Camera
          </button>

          <button
            onClick={() => onNavigateTab("actions")}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid rgba(234,179,8,0.3)",
              background: "rgba(234,179,8,0.08)",
              color: "#ca8a04",
              fontSize: "0.72rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <MdGavel size={14} />
            Issue Compliance Notice
          </button>
        </div>
      )}
    </div>
  );
}
