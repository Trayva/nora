import {
  MdAccessTime,
  MdCalendarToday,
  MdCheckCircle,
  MdErrorOutline,
  MdVideocam,
  MdOpenInNew,
  MdSpeed,
} from "react-icons/md";

/**
 * Format a date string into readable Date & Time (e.g. "30 Oct 2026, 02:30 PM")
 */
export function formatTaskDateTime(dateVal) {
  if (!dateVal) return "—";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "—";
  }
}

/**
 * Short date-time format for badges/compact views (e.g. "30 Oct, 14:30")
 */
export function formatTaskDateShort(dateVal) {
  if (!dateVal) return "—";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "—";
  }
}

/**
 * Calculate the timing score and performance label:
 * - "In Time" (On schedule)
 * - "Before Time" (Early)
 * - "Over Time" (Late or overdue)
 */
export function calculateTaskTiming(task) {
  if (!task) return null;

  // Use backend timingScore if already provided
  if (task.timingScore && task.timingScore.status) {
    return task.timingScore;
  }

  const dueDateVal = task.dueDate || task.dueAt;
  const scheduledForVal = task.scheduledFor;
  const completedAtVal = task.completedAt;

  const dueTime = dueDateVal ? new Date(dueDateVal).getTime() : null;
  const scheduledTime = scheduledForVal ? new Date(scheduledForVal).getTime() : dueTime;

  if (completedAtVal) {
    const completedTime = new Date(completedAtVal).getTime();
    if (dueTime) {
      const diffMs = completedTime - dueTime;
      const diffMinutes = Math.round(Math.abs(diffMs) / 60000);

      if (completedTime > dueTime) {
        // Over time
        const score = Math.max(30, 100 - Math.floor(diffMinutes / 5));
        const delayStr =
          diffMinutes < 60
            ? `${diffMinutes}m late`
            : `${(diffMinutes / 60).toFixed(1)}h late`;
        return {
          status: "OVER_TIME",
          label: "Over Time",
          score,
          isLate: true,
          message: `Submitted ${delayStr}`,
          diffMinutes,
        };
      } else if (scheduledTime && completedTime < scheduledTime) {
        // Before time
        const earlyMs = scheduledTime - completedTime;
        const earlyMinutes = Math.round(earlyMs / 60000);
        const earlyStr =
          earlyMinutes < 60
            ? `${earlyMinutes}m early`
            : `${(earlyMinutes / 60).toFixed(1)}h early`;
        return {
          status: "BEFORE_TIME",
          label: "Before Time",
          score: 100,
          isEarly: true,
          message: `Submitted ${earlyStr}`,
          diffMinutes: earlyMinutes,
        };
      } else {
        // In time
        return {
          status: "IN_TIME",
          label: "In Time",
          score: 100,
          isOnTime: true,
          message: "Submitted in time",
          diffMinutes: 0,
        };
      }
    }
    return {
      status: "IN_TIME",
      label: "In Time",
      score: 100,
      message: "Completed",
      diffMinutes: 0,
    };
  }

  // Pending evaluation
  if (dueTime) {
    const now = Date.now();
    if (now > dueTime || task.status === "MISSED") {
      const overdueMinutes = Math.round((now - dueTime) / 60000);
      const overdueStr =
        overdueMinutes < 60
          ? `${overdueMinutes}m overdue`
          : `${(overdueMinutes / 60).toFixed(1)}h overdue`;
      return {
        status: "OVERDUE",
        label: "Over Time",
        score: 0,
        isOverdue: true,
        message: `Overdue by ${overdueStr}`,
        diffMinutes: overdueMinutes,
      };
    }
  }

  return {
    status: "PENDING",
    label: "Pending",
    score: null,
    message: "Pending submission",
    diffMinutes: 0,
  };
}

/**
 * Score Pill Badge Component
 */
export function TaskTimingScoreBadge({ task, timing }) {
  const t = timing || calculateTaskTiming(task);
  if (!t) return null;

  let bg = "rgba(100,116,139,0.1)";
  let color = "#64748b";
  let border = "rgba(100,116,139,0.25)";
  let Icon = MdAccessTime;

  if (t.status === "IN_TIME") {
    bg = "rgba(34,197,94,0.12)";
    color = "#16a34a";
    border = "rgba(34,197,94,0.3)";
    Icon = MdCheckCircle;
  } else if (t.status === "BEFORE_TIME") {
    bg = "rgba(59,130,246,0.12)";
    color = "#2563eb";
    border = "rgba(59,130,246,0.3)";
    Icon = MdSpeed;
  } else if (t.status === "OVER_TIME" || t.status === "OVERDUE") {
    bg = "rgba(239,68,68,0.12)";
    color = "#ef4444";
    border = "rgba(239,68,68,0.3)";
    Icon = MdErrorOutline;
  }

  return (
    <span
      className="kiosk_status_badge task_timing_badge"
      style={{
        background: bg,
        color,
        border: `1px solid ${border}`,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontWeight: 700,
        fontSize: "0.68rem",
        padding: "3px 8px",
        borderRadius: 20,
      }}
      title={t.message || t.label}
    >
      <Icon size={12} />
      {t.score !== null && t.score !== undefined ? `${t.score}% · ` : ""}
      {t.label}
    </span>
  );
}

/**
 * Detailed Schedule & Timing Section Component
 */
export function TaskTimingScheduleSection({ task }) {
  const timing = calculateTaskTiming(task);

  return (
    <div className="task_schedule_grid">
      <div className="task_schedule_cell">
        <div className="task_schedule_label">
          <MdCalendarToday size={11} /> Sched
        </div>
        <div className="task_schedule_val">
          {formatTaskDateShort(task.scheduledFor)}
        </div>
      </div>

      <div className="task_schedule_cell">
        <div className="task_schedule_label">
          <MdAccessTime size={11} /> Due Date
        </div>
        <div className="task_schedule_val">
          {formatTaskDateShort(task.dueDate || task.dueAt)}
        </div>
      </div>

      <div className="task_schedule_cell">
        <div className="task_schedule_label">
          <MdCheckCircle size={11} /> Completed
        </div>
        <div className="task_schedule_val">
          {task.completedAt ? formatTaskDateShort(task.completedAt) : "Pending"}
        </div>
      </div>

      <div className="task_schedule_cell task_schedule_cell_full">
        <div className="task_schedule_label">
          Timing Score
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
          <TaskTimingScoreBadge task={task} timing={timing} />
          {timing?.message && (
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
              {timing.message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Task Video Proof Display Component
 */
export function TaskVideoProofCard({ videoUrl }) {
  if (!videoUrl) return null;

  return (
    <div className="task_video_proof_card">
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: "rgba(203,108,220,0.15)",
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <MdVideocam size={16} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-body)" }}>
            Video Proof Attached
          </div>
          <div
            style={{
              fontSize: "0.66rem",
              color: "var(--text-muted)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Verified on Vimeo
          </div>
        </div>
      </div>

      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="app_btn app_btn_confirm"
        style={{
          height: 30,
          padding: "0 12px",
          fontSize: "0.72rem",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          textDecoration: "none",
          flexShrink: 0,
        }}
      >
        <span>Watch Video</span>
        <MdOpenInNew size={12} />
      </a>
    </div>
  );
}
