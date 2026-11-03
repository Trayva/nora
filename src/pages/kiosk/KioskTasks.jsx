import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  MdAdd,
  MdCheckBox,
  MdCheckBoxOutlineBlank,
  MdExpandMore,
  MdExpandLess,
  MdTask,
  MdListAlt,
  MdHistory,
  MdCheck,
  MdClose,
  MdEdit,
  MdVideocam,
  MdCloudUpload,
  MdDelete,
  MdFlashOn,
  MdRefresh,
  MdNotes,
} from "react-icons/md";
import api from "../../api/axios";
import SopComplianceAudit from "./SopComplianceAudit";
import TaskVideoRecorder from "../../components/TaskVideoRecorder";
import {
  TaskTimingScoreBadge,
  TaskTimingScheduleSection,
  TaskVideoProofCard,
  formatTaskDateShort,
} from "../../utils/taskTiming";

/* ── helpers ───────────────────────────────────────────────── */
const taskStatusColors = {
  PENDING: {
    bg: "rgba(234,179,8,0.1)",
    color: "#ca8a04",
    border: "rgba(234,179,8,0.25)",
  },
  IN_PROGRESS: {
    bg: "rgba(59,130,246,0.1)",
    color: "#3b82f6",
    border: "rgba(59,130,246,0.25)",
  },
  COMPLETED: {
    bg: "rgba(34,197,94,0.1)",
    color: "#16a34a",
    border: "rgba(34,197,94,0.25)",
  },
  MISSED: {
    bg: "rgba(239,68,68,0.1)",
    color: "#ef4444",
    border: "rgba(239,68,68,0.25)",
  },
  SUBMITTED: {
    bg: "rgba(168,85,247,0.1)",
    color: "#a855f7",
    border: "rgba(168,85,247,0.25)",
  },
};

function StatusPill({ status }) {
  const s = taskStatusColors[status] || taskStatusColors.PENDING;
  return (
    <span
      className="kiosk_status_badge"
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {status}
    </span>
  );
}

/* ── Instant Todo Task Creator ─────────────────────────────── */
function TodoTaskBuilder({
  kioskId,
  templates = [],
  recentTasks = [],
  operators = [],
  onCreated,
  onCancel,
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("CHECKLIST");
  const [operatorId, setOperatorId] = useState("");
  const [time, setTime] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [dueMinutes, setDueMinutes] = useState("");
  const [fields, setFields] = useState([{ type: "checkbox", label: "" }]);
  const [saving, setSaving] = useState(false);

  // Pre-fill form when an existing template is chosen
  const handleSelectTemplate = (id) => {
    setSelectedTemplateId(id);
    if (!id) {
      setName("");
      setDescription("");
      setType("CHECKLIST");
      setFields([{ type: "checkbox", label: "" }]);
      setOperatorId("");
      setTime("");
      setDueTime("");
      setDueMinutes("");
      return;
    }

    const tpl =
      templates.find((t) => t.id === id) ||
      recentTasks.find((t) => (t.templateId || t.template?.id) === id)?.template;

    if (tpl) {
      setName(tpl.name || "");
      setDescription(tpl.description || "");
      setType(tpl.type || "CHECKLIST");
      if (tpl.schema?.fields?.length > 0) {
        setFields(tpl.schema.fields.map((f) => ({ ...f })));
      } else {
        setFields([{ type: "checkbox", label: "" }]);
      }
      setDueMinutes(tpl.dueMinutes ?? "");
      setDueTime(tpl.dueTime || "");
      setOperatorId(tpl.operatorId || "");
      setTime(tpl.time || "");
    }
  };

  const addField = () =>
    setFields([...fields, { type: "checkbox", label: "" }]);
  const removeField = (i) => setFields(fields.filter((_, idx) => idx !== i));
  const updateField = (i, key, val) => {
    const updated = [...fields];
    updated[i] = { ...updated[i], [key]: val };
    setFields(updated);
  };

  const handleDispatch = async () => {
    if (!name.trim()) return toast.error("Task name is required");
    const validFields = fields.filter((f) => f.label.trim());
    if (!validFields.length) return toast.error("Add at least one instruction / field");

    setSaving(true);
    try {
      const payload = {
        kioskId,
        templateId: selectedTemplateId || undefined,
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        schema: { fields: validFields },
        operatorId: operatorId || undefined,
        time: time || undefined,
        dueTime: dueTime || undefined,
        dueMinutes: dueMinutes !== "" ? Number(dueMinutes) : undefined,
      };

      await api.post("/kiosk/tasks/todo", payload);
      toast.success("Task dispatched to operators");
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to dispatch task");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="kiosk_template_builder">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <div>
          <span
            style={{
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "var(--text-heading)",
            }}
          >
            Create Task (Todo)
          </span>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
            Select an existing template to prefill, or fill out the form per usual.
          </p>
        </div>
        {onCancel && (
          <button className="kiosk_icon_action_btn" onClick={onCancel} title="Cancel">
            <MdClose size={14} />
          </button>
        )}
      </div>

      {/* Select Template (optional) */}
      <div className="form-field">
        <label className="modal-label">SOP (Optional - Select to prefill)</label>
        <select
          className="modal-input"
          value={selectedTemplateId}
          onChange={(e) => handleSelectTemplate(e.target.value)}
        >
          <option value="">-- None --</option>
          {templates.length > 0 && (
            <optgroup label="Available SOPs">
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name} ({tpl.type}{tpl.recurrence ? ` · ${tpl.recurrence}` : ""})
                </option>
              ))}
            </optgroup>
          )}
          {recentTasks.length > 0 && (
            <optgroup label="Recent Tasks">
              {recentTasks
                .filter((t) => t.template?.id && !templates.some((tpl) => tpl.id === t.template.id))
                .map((t) => (
                  <option key={t.id} value={t.templateId || t.template.id}>
                    {t.template?.name || "Task"}
                  </option>
                ))}
            </optgroup>
          )}
        </select>
      </div>

      {/* Task Name */}
      <div className="form-field">
        <label className="modal-label">Task Name *</label>
        <input
          className="modal-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Deep clean refrigerator, Check syrups"
        />
      </div>

      {/* Description */}
      <div className="form-field">
        <label className="modal-label">Description</label>
        <input
          className="modal-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional instructions for operator"
        />
      </div>

      {/* Type */}
      <div className="form-field">
        <label className="modal-label">Type</label>
        <select
          className="modal-input"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="CHECKLIST">Checklist</option>
          <option value="LOG">Log</option>
          <option value="PROCESS">Process</option>
        </select>
      </div>

      {/* Time + Operator row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="form-field">
          <label className="modal-label">Scheduled Time (optional)</label>
          <input
            className="modal-input"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="modal-label">Assign Operator (optional)</label>
          <select
            className="modal-input"
            value={operatorId}
            onChange={(e) => setOperatorId(e.target.value)}
          >
            <option value="">Any operator</option>
            {operators.map((op) => (
              <option key={op.id} value={op.id}>
                {op.user?.fullName || op.user?.email || op.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Due Window / Minutes Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="form-field">
          <label className="modal-label">Duration (Minutes)</label>
          <input
            className="modal-input"
            type="number"
            min="1"
            placeholder="e.g. 30, 45, 60 mins"
            value={dueMinutes}
            onChange={(e) => setDueMinutes(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="modal-label">Or Due Time (optional)</label>
          <input
            className="modal-input"
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
          />
        </div>
      </div>

      {/* Instructions / Fields */}
      <div
        className="drawer_section_title"
        style={{ display: "flex", alignItems: "center" }}
      >
        <span>Instructions</span>
        <button
          className="kiosk_icon_action_btn"
          style={{ marginLeft: "auto" }}
          onClick={addField}
        >
          <MdAdd size={15} />
        </button>
      </div>

      <div className="kiosk_fields_list">
        {fields.map((field, i) => (
          <div key={i} className="kiosk_field_row">
            <select
              className="modal-input"
              style={{ width: 110, flexShrink: 0 }}
              value={field.type}
              onChange={(e) => updateField(i, "type", e.target.value)}
            >
              <option value="checkbox">Checkbox</option>
              <option value="number">Number</option>
              <option value="text">Text</option>
            </select>
            <input
              className="modal-input"
              style={{ flex: 1 }}
              placeholder="Field label / step"
              value={field.label}
              onChange={(e) => updateField(i, "label", e.target.value)}
            />
            <button
              className="kiosk_icon_action_btn kiosk_icon_danger"
              onClick={() => removeField(i)}
              disabled={fields.length === 1}
            >
              <MdClose size={14} />
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        {onCancel && (
          <button
            className="app_btn app_btn_cancel"
            style={{ width: 90, height: 40 }}
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
        )}
        <button
          className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
          style={{ flex: 1, height: 40, position: "relative" }}
          onClick={handleDispatch}
          disabled={saving}
        >
          <span className="btn_text">Dispatch Task</span>
          {saving && (
            <span className="btn_loader" style={{ width: 14, height: 14 }} />
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Template Builder ──────────────────────────────────────── */
function TemplateBuilder({
  kioskId,
  operators = [],
  onCreated,
  editTemplate = null,
  onCancelEdit,
}) {
  const isEdit = !!editTemplate;

  const [name, setName] = useState(editTemplate?.name || "");
  const [description, setDescription] = useState(
    editTemplate?.description || "",
  );
  const [type, setType] = useState(editTemplate?.type || "CHECKLIST");
  const [recurrence, setRecurrence] = useState(
    editTemplate?.recurrence || "DAILY",
  );
  const [isGlobal, setIsGlobal] = useState(editTemplate?.isGlobal || false);
  const [time, setTime] = useState(editTemplate?.time || "");
  const [dueTime, setDueTime] = useState(editTemplate?.dueTime || "");
  const [dueMinutes, setDueMinutes] = useState(
    editTemplate?.dueMinutes ?? "",
  );
  const [operatorId, setOperatorId] = useState(editTemplate?.operatorId || "");
  const [fields, setFields] = useState(
    editTemplate?.schema?.fields || [{ type: "checkbox", label: "" }],
  );
  const [saving, setSaving] = useState(false);

  const addField = () =>
    setFields([...fields, { type: "checkbox", label: "" }]);
  const removeField = (i) => setFields(fields.filter((_, idx) => idx !== i));
  const updateField = (i, key, val) => {
    const updated = [...fields];
    updated[i] = { ...updated[i], [key]: val };
    setFields(updated);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error("Template name is required");
    const validFields = fields.filter((f) => f.label.trim());
    if (!validFields.length) return toast.error("Add at least one field");

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      type,
      recurrence,
      schema: { fields: validFields },
      isGlobal,
      kioskId: isGlobal ? undefined : kioskId,
      operatorId: operatorId || undefined,
      time: time || undefined,
      dueTime: dueTime || undefined,
      dueMinutes: dueMinutes !== "" ? Number(dueMinutes) : undefined,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await api.patch(`/kiosk/tasks/templates/${editTemplate.id}`, payload);
        toast.success("Template updated");
      } else {
        await api.post("/kiosk/tasks/templates", payload);
        toast.success("Template created");
      }
      onCreated();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        `Failed to ${isEdit ? "update" : "create"} template`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="kiosk_template_builder">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontSize: "0.85rem",
            fontWeight: 700,
            color: "var(--text-heading)",
          }}
        >
          {isEdit ? "Edit SOP" : "New SOP"}
        </span>
        {isEdit && onCancelEdit && (
          <button className="kiosk_icon_action_btn" onClick={onCancelEdit}>
            <MdClose size={14} />
          </button>
        )}
      </div>

      <div className="form-field">
        <label className="modal-label">SOP Name *</label>
        <input
          className="modal-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Daily Opening Checklist"
        />
      </div>

      <div className="form-field">
        <label className="modal-label">Description</label>
        <input
          className="modal-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="form-field">
          <label className="modal-label">Type</label>
          <select
            className="modal-input"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="CHECKLIST">Checklist</option>
            <option value="LOG">Log</option>
            <option value="PROCESS">Process</option>
          </select>
        </div>
        <div className="form-field">
          <label className="modal-label">Recurrence</label>
          <select
            className="modal-input"
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value)}
          >
            <option value="DAILY">Daily</option>
            <option value="PER_SHIFT">Per Shift</option>
            <option value="WEEKLY">Weekly</option>
            <option value="AS_NEEDED">As Needed</option>
          </select>
        </div>
      </div>

      {/* Time + Operator row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="form-field">
          <label className="modal-label">Scheduled Time (optional)</label>
          <input
            className="modal-input"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="modal-label">Assign Operator (optional)</label>
          <select
            className="modal-input"
            value={operatorId}
            onChange={(e) => setOperatorId(e.target.value)}
          >
            <option value="">Any operator</option>
            {operators.map((op) => (
              <option key={op.id} value={op.id}>
                {op.user?.fullName || op.user?.email || op.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Due Window / Minutes Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="form-field">
          <label className="modal-label">
            Duration (Minutes)
          </label>
          <input
            className="modal-input"
            type="number"
            min="1"
            placeholder="e.g. 30, 45, 60 mins"
            value={dueMinutes}
            onChange={(e) => setDueMinutes(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="modal-label">
            Or Due Time (optional)
          </label>
          <input
            className="modal-input"
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
          />
        </div>
      </div>

      {/* Global toggle for ADMIN ONLY */}
      {/* <div className="kiosk_toggle_row" style={{ marginBottom: 14 }}>
        <span className="kiosk_toggle_label">Apply Globally (all carts)</span>
        <button
          className={`kiosk_toggle_switch ${isGlobal ? "kiosk_toggle_on" : ""}`}
          onClick={() => setIsGlobal((v) => !v)}
        >
          <span className="kiosk_toggle_knob" />
        </button>
      </div> */}

      {/* Fields */}
      <div
        className="drawer_section_title"
        style={{ display: "flex", alignItems: "center" }}
      >
        <span>Instructions</span>
        <button
          className="kiosk_icon_action_btn"
          style={{ marginLeft: "auto" }}
          onClick={addField}
        >
          <MdAdd size={15} />
        </button>
      </div>

      <div className="kiosk_fields_list">
        {fields.map((field, i) => (
          <div key={i} className="kiosk_field_row">
            <select
              className="modal-input"
              style={{ width: 110, flexShrink: 0 }}
              value={field.type}
              onChange={(e) => updateField(i, "type", e.target.value)}
            >
              <option value="checkbox">Checkbox</option>
              <option value="number">Number</option>
              <option value="text">Text</option>
            </select>
            <input
              className="modal-input"
              style={{ flex: 1 }}
              placeholder="Field label"
              value={field.label}
              onChange={(e) => updateField(i, "label", e.target.value)}
            />
            <button
              className="kiosk_icon_action_btn kiosk_icon_danger"
              onClick={() => removeField(i)}
              disabled={fields.length === 1}
            >
              <MdClose size={14} />
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        {onCancelEdit && (
          <button
            className="app_btn app_btn_cancel"
            style={{ width: 90, height: 40 }}
            onClick={onCancelEdit}
            disabled={saving}
          >
            Cancel
          </button>
        )}
        <button
          className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
          style={{ flex: 1, height: 40, position: "relative" }}
          onClick={handleSubmit}
          disabled={saving}
        >
          <span className="btn_text">
            {isEdit ? "Save Changes" : "Create Template"}
          </span>
          {saving && (
            <span className="btn_loader" style={{ width: 14, height: 14 }} />
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Task Submit Form ──────────────────────────────────────── */
function TaskSubmitForm({ task, onSubmitted }) {
  const schema = task.template?.schema?.fields || [];
  const [formData, setFormData] = useState(
    Object.fromEntries(
      schema.map((f) => [f.label, f.type === "checkbox" ? false : ""]),
    ),
  );
  const [remark, setRemark] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [showRecorder, setShowRecorder] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("video/")) {
        return toast.error("Please upload a valid video file (MP4, MOV, WebM, etc.)");
      }
      setVideoFile(file);
    }
  };

  const removeVideo = () => {
    setVideoFile(null);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = new FormData();
      const dataToSubmit = { ...formData };
      if (remark.trim()) {
        dataToSubmit.remark = remark.trim();
        payload.append("remark", remark.trim());
      }
      payload.append("data", JSON.stringify(dataToSubmit));
      if (videoFile) {
        payload.append("video", videoFile);
      }
      await api.patch(`/kiosk/tasks/${task.id}/submit`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Task submitted successfully");
      onSubmitted();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit task");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="kiosk_task_submit_form">
      {schema.map((field, i) => (
        <div key={i} className="form-field">
          <label className="modal-label">{field.label}</label>
          {field.type === "checkbox" ? (
            <button
              className={`kiosk_checkbox_btn ${formData[field.label] ? "kiosk_checkbox_checked" : ""}`}
              onClick={() =>
                setFormData((p) => ({ ...p, [field.label]: !p[field.label] }))
              }
            >
              {formData[field.label] ? (
                <MdCheckBox size={18} />
              ) : (
                <MdCheckBoxOutlineBlank size={18} />
              )}
              <span>{formData[field.label] ? "Done" : "Mark as done"}</span>
            </button>
          ) : field.type === "number" ? (
            <input
              className="modal-input"
              type="number"
              value={formData[field.label]}
              onChange={(e) =>
                setFormData((p) => ({ ...p, [field.label]: e.target.value }))
              }
            />
          ) : (
            <input
              className="modal-input"
              value={formData[field.label]}
              onChange={(e) =>
                setFormData((p) => ({ ...p, [field.label]: e.target.value }))
              }
            />
          )}
        </div>
      ))}

      {/* Video Proof Section */}
      <div className="form-field" style={{ marginTop: 10 }}>
        <label className="modal-label" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <MdVideocam size={15} style={{ color: "var(--accent)" }} />
            <span>Task Video Proof</span>
          </div>
          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
            MP4, MOV, WebM
          </span>
        </label>

        {videoFile ? (
          <div
            style={{
              padding: "10px 12px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: "rgba(22, 163, 74, 0.12)",
                    color: "#16a34a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <MdCheck size={16} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "0.76rem",
                      fontWeight: 600,
                      color: "var(--text-body)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {videoFile.name}
                  </div>
                  <div style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}>
                    {(videoFile.size / (1024 * 1024)).toFixed(1)} MB · Video proof attached
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setShowRecorder(true)}
                  className="app_btn app_btn_cancel"
                  style={{ height: 26, padding: "0 8px", fontSize: "0.7rem" }}
                  title="Record again"
                >
                  <MdRefresh size={13} /> Re-record
                </button>
                <button
                  type="button"
                  onClick={removeVideo}
                  className="app_btn app_btn_cancel"
                  style={{ height: 26, padding: "0 8px", fontSize: "0.7rem", color: "#ef4444" }}
                >
                  <MdDelete size={13} /> Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {/* Record with Livelens camera */}
            <button
              type="button"
              onClick={() => setShowRecorder(true)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "14px 10px",
                border: "1px solid var(--accent)",
                borderRadius: 10,
                background: "rgba(203, 108, 220, 0.06)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                gap: 4,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(203, 108, 220, 0.4)",
                }}
              >
                <MdVideocam size={18} />
              </div>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-heading)", marginTop: 2 }}>
                Record Video
              </span>
              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                Livelens in-app camera
              </span>
            </button>

            {/* Upload file fallback */}
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "14px 10px",
                border: "1px dashed var(--border)",
                borderRadius: 10,
                cursor: "pointer",
                background: "var(--bg-card)",
                transition: "all 0.2s ease",
                gap: 4,
              }}
            >
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm,video/x-msvideo"
                onChange={handleVideoChange}
                style={{ display: "none" }}
              />
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--bg-hover)",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MdCloudUpload size={18} />
              </div>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-body)", marginTop: 2 }}>
                Upload Video File
              </span>
              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                From phone or desktop
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Operator Remark (Optional) */}
      <div className="form-field" style={{ marginTop: 12 }}>
        <label
          className="modal-label"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <MdNotes size={15} style={{ color: "var(--accent)" }} />
            <span>Remark (Optional)</span>
          </div>
          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
            Notes or observations
          </span>
        </label>
        <textarea
          className="modal-input"
          style={{
            minHeight: 64,
            height: 64,
            resize: "vertical",
            padding: "8px 10px",
            fontSize: "0.82rem",
            lineHeight: 1.4,
            fontFamily: "inherit",
          }}
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="Add any notes, observations, or remarks before submitting..."
        />
      </div>

      {/* Livelens Video Recorder Modal */}
      <TaskVideoRecorder
        isOpen={showRecorder}
        onClose={() => setShowRecorder(false)}
        onVideoRecorded={(file) => setVideoFile(file)}
        taskTitle={task.template?.name || "Task Proof"}
      />

      <button
        className={`app_btn app_btn_confirm ${submitting ? "btn_loading" : ""}`}
        style={{ width: "100%", height: 40, marginTop: 10 }}
        onClick={handleSubmit}
        disabled={submitting}
      >
        <span className="btn_text">
          {submitting ? "Uploading Video & Submitting..." : "Submit Task"}
        </span>
        {submitting && (
          <span className="btn_loader" style={{ width: 14, height: 14 }} />
        )}
      </button>
    </div>
  );
}

/* ── Review Form ───────────────────────────────────────────── */
function ReviewForm({ task, onReviewed }) {
  const [comment, setComment] = useState(task.managerComments || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!comment.trim()) return toast.error("Enter a comment");
    setSaving(true);
    try {
      await api.patch(`/kiosk/tasks/${task.id}/review`, {
        managerComments: comment.trim(),
      });
      toast.success("Review saved");
      onReviewed();
    } catch {
      toast.error("Failed to save review");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ marginTop: 10 }}>
      <div className="form-field">
        <label className="modal-label">Manager Comment</label>
        <textarea
          className="modal-input"
          style={{ height: 72, resize: "vertical" }}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add your review..."
        />
      </div>
      <button
        className={`app_btn app_btn_confirm ${saving ? "btn_loading" : ""}`}
        style={{ width: "100%", height: 38 }}
        onClick={handleSave}
        disabled={saving}
      >
        <span className="btn_text">Save Review</span>
        {saving && (
          <span className="btn_loader" style={{ width: 14, height: 14 }} />
        )}
      </button>
    </div>
  );
}

/* ── Task Card ─────────────────────────────────────────────── */
function TaskCard({ task, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const isPending =
    task.status === "PENDING" ||
    task.status === "IN_PROGRESS" ||
    task.status === "MISSED";
  const isSubmitted =
    task.status === "SUBMITTED" || task.status === "COMPLETED";

  return (
    <div className="kiosk_task_card">
      <div
        className="kiosk_task_card_top"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="kiosk_task_card_left">
          <div className="kiosk_task_icon">
            <MdTask size={14} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="kiosk_task_name">
              {task.template?.name || task.name || "Task"}
            </div>
            <div className="kiosk_task_meta">
              {task.template?.recurrence && (
                <span>{task.template.recurrence}</span>
              )}
              {task.completedAt ? (
                <>
                  <span className="contract_row_dot">·</span>
                  <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                    Done {formatTaskDateShort(task.completedAt)}
                  </span>
                </>
              ) : (task.dueDate || task.dueAt) ? (
                <>
                  <span className="contract_row_dot">·</span>
                  <span>Due {formatTaskDateShort(task.dueDate || task.dueAt)}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>
        <div className="kiosk_task_badges">
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <TaskTimingScoreBadge task={task} />
            <StatusPill status={task.status} />
          </div>
          {expanded ? (
            <MdExpandLess size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          ) : (
            <MdExpandMore size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          )}
        </div>
      </div>

      {expanded && (
        <div className="kiosk_task_expanded">
          {/* Detailed Schedule, Due Date, Completed At and Timing Score */}
          <TaskTimingScheduleSection task={task} />

          {/* Show Video Proof if attached */}
          {task.videoUrl && <TaskVideoProofCard videoUrl={task.videoUrl} />}

          {/* Show submitted data */}
          {task.data &&
            Object.keys(task.data).filter(
              (k) => !["remark", "_remark", "operatorRemark"].includes(k),
            ).length > 0 && (
              <div className="kiosk_task_data" style={{ marginTop: 8 }}>
                {Object.entries(task.data)
                  .filter(([k]) => !["remark", "_remark", "operatorRemark"].includes(k))
                  .map(([k, v]) => (
                    <div key={k} className="kiosk_task_data_row">
                      <span className="kiosk_meta_key">{k}</span>
                      <span className="kiosk_meta_val">
                        {typeof v === "boolean" ? (
                          v ? (
                            <MdCheck size={14} style={{ color: "#22c55e" }} />
                          ) : (
                            <MdClose size={14} style={{ color: "#ef4444" }} />
                          )
                        ) : (
                          String(v)
                        )}
                      </span>
                    </div>
                  ))}
              </div>
            )}

          {/* Operator Remark */}
          {(task.data?.remark || task.data?._remark || task.operatorRemark) && (
            <div
              className="kiosk_operator_comment"
              style={{
                marginTop: 8,
                padding: "10px 12px",
                borderRadius: 8,
                background: "rgba(59, 130, 246, 0.08)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                <MdNotes size={14} style={{ color: "#3b82f6" }} />
                <span className="kiosk_meta_key" style={{ color: "#3b82f6", fontWeight: 700, fontSize: "0.72rem" }}>
                  Operator Remark
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-body)", whiteSpace: "pre-wrap" }}>
                {task.data?.remark || task.data?._remark || task.operatorRemark}
              </p>
            </div>
          )}

          {task.managerComments && (
            <div className="kiosk_manager_comment">
              <span className="kiosk_meta_key">Manager Note</span>
              <p>{task.managerComments}</p>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            {isPending && (
              <button
                className="app_btn app_btn_confirm"
                style={{ fontSize: "0.75rem", height: 34, padding: "0 14px" }}
                onClick={() => setShowSubmit((v) => !v)}
              >
                {showSubmit ? "Cancel" : "Submit Task"}
              </button>
            )}
            {isSubmitted && (
              <button
                className="app_btn app_btn_cancel"
                style={{ fontSize: "0.75rem", height: 34, padding: "0 14px" }}
                onClick={() => setShowReview((v) => !v)}
              >
                <MdEdit size={13} /> {showReview ? "Cancel" : "Add Review"}
              </button>
            )}
          </div>

          {showSubmit && (
            <TaskSubmitForm
              task={task}
              onSubmitted={() => {
                setShowSubmit(false);
                onRefresh();
              }}
            />
          )}
          {showReview && (
            <ReviewForm
              task={task}
              onReviewed={() => {
                setShowReview(false);
                onRefresh();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main KioskTasks ───────────────────────────────────────── */
export default function KioskTasks({ cart, showAudit = false }) {
  const [view, setView] = useState("pending"); // pending | ledger | templates | newTemplate
  const [showCompliance, setShowCompliance] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null); // template being edited

  // Filtering & Endless Scroll state for pending/missed tasks
  const [taskFilter, setTaskFilter] = useState("PENDING"); // PENDING | MISSED | ALL
  const [taskPage, setTaskPage] = useState(1);
  const [hasMoreTasks, setHasMoreTasks] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingMoreTasks, setLoadingMoreTasks] = useState(false);
  const [totalTasks, setTotalTasks] = useState(null);
  const taskSentinelRef = useRef(null);

  // Filtering & Endless Scroll state for ledger tasks
  const [ledgerStartDate, setLedgerStartDate] = useState("");
  const [ledgerEndDate, setLedgerEndDate] = useState("");
  const [ledgerPage, setLedgerPage] = useState(1);
  const [hasMoreLedger, setHasMoreLedger] = useState(false);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [loadingMoreLedger, setLoadingMoreLedger] = useState(false);
  const [totalLedger, setTotalLedger] = useState(null);
  const ledgerSentinelRef = useRef(null);

  const handleDispatchTemplate = async (tpl) => {
    try {
      await api.post("/kiosk/tasks/todo", {
        kioskId: cart.id,
        templateId: tpl.id,
      });
      toast.success(`Task "${tpl.name}" dispatched to operators`);
      setView("pending");
      fetchPending(taskFilter);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to dispatch task");
    }
  };

  const fetchPending = async (filterToUse = taskFilter) => {
    if (!cart?.id) return;
    setLoadingTasks(true);
    setTaskPage(1);
    try {
      const filterQuery = filterToUse !== "ALL" ? `&status=${filterToUse}` : "";
      const res = await api.get(`/kiosk/tasks?kioskId=${cart.id}&page=1&limit=15${filterQuery}`);
      const items = res.data.data?.items || res.data.data || [];
      const totalPages = res.data.data?.pages ?? 1;
      const totalCount = res.data.data?.total ?? items.length;

      setTasks(items);
      setTotalTasks(totalCount);
      setHasMoreTasks(1 < totalPages && items.length > 0);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoadingTasks(false);
    }
  };

  const loadMorePending = async () => {
    if (loadingTasks || loadingMoreTasks || !hasMoreTasks || !cart?.id) return;
    setLoadingMoreTasks(true);
    const nextPage = taskPage + 1;
    try {
      const filterQuery = taskFilter !== "ALL" ? `&status=${taskFilter}` : "";
      const res = await api.get(`/kiosk/tasks?kioskId=${cart.id}&page=${nextPage}&limit=15${filterQuery}`);
      const newItems = res.data.data?.items || res.data.data || [];
      const totalPages = res.data.data?.pages ?? 1;

      setTasks((prev) => {
        const existingIds = new Set(prev.map((t) => t.id));
        const filtered = newItems.filter((t) => !existingIds.has(t.id));
        return [...prev, ...filtered];
      });
      setTaskPage(nextPage);
      setHasMoreTasks(nextPage < totalPages && newItems.length > 0);
    } catch (err) {
      console.error("Failed to load more tasks:", err);
    } finally {
      setLoadingMoreTasks(false);
    }
  };

  const handleFilterChange = (newFilter) => {
    if (newFilter === taskFilter) return;
    setTaskFilter(newFilter);
    fetchPending(newFilter);
  };

  useEffect(() => {
    if (view !== "pending") return;
    if (!taskSentinelRef.current) return;
    if (!hasMoreTasks || loadingTasks || loadingMoreTasks) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMorePending();
        }
      },
      { threshold: 0.1, rootMargin: "150px" }
    );

    observer.observe(taskSentinelRef.current);
    return () => observer.disconnect();
  }, [view, hasMoreTasks, loadingTasks, loadingMoreTasks, taskPage, taskFilter, cart?.id]);

  const fetchLedger = async (start = ledgerStartDate, end = ledgerEndDate) => {
    if (!cart?.id) return;
    setLoadingLedger(true);
    setLedgerPage(1);
    try {
      let query = `/kiosk/tasks/ledger?kioskId=${cart.id}&page=1&limit=15`;
      if (start) query += `&startDate=${encodeURIComponent(start.includes("T") ? start : start + "T00:00:00.000Z")}`;
      if (end) query += `&endDate=${encodeURIComponent(end.includes("T") ? end : end + "T23:59:59.999Z")}`;
      const res = await api.get(query);
      const items = res.data.data?.items || res.data.data || [];
      const totalPages = res.data.data?.pages ?? 1;
      const totalCount = res.data.data?.total ?? items.length;

      setLedger(items);
      setTotalLedger(totalCount);
      setHasMoreLedger(1 < totalPages && items.length > 0);
    } catch {
      toast.error("Failed to load ledger");
    } finally {
      setLoadingLedger(false);
    }
  };

  const loadMoreLedger = async () => {
    if (loadingLedger || loadingMoreLedger || !hasMoreLedger || !cart?.id) return;
    setLoadingMoreLedger(true);
    const nextPage = ledgerPage + 1;
    try {
      let query = `/kiosk/tasks/ledger?kioskId=${cart.id}&page=${nextPage}&limit=15`;
      if (ledgerStartDate) query += `&startDate=${encodeURIComponent(ledgerStartDate.includes("T") ? ledgerStartDate : ledgerStartDate + "T00:00:00.000Z")}`;
      if (ledgerEndDate) query += `&endDate=${encodeURIComponent(ledgerEndDate.includes("T") ? ledgerEndDate : ledgerEndDate + "T23:59:59.999Z")}`;
      const res = await api.get(query);
      const newItems = res.data.data?.items || res.data.data || [];
      const totalPages = res.data.data?.pages ?? 1;

      setLedger((prev) => {
        const existingIds = new Set(prev.map((t) => t.id));
        const filtered = newItems.filter((t) => !existingIds.has(t.id));
        return [...prev, ...filtered];
      });
      setLedgerPage(nextPage);
      setHasMoreLedger(nextPage < totalPages && newItems.length > 0);
    } catch (err) {
      console.error("Failed to load more ledger tasks:", err);
    } finally {
      setLoadingMoreLedger(false);
    }
  };

  useEffect(() => {
    if (view !== "ledger") return;
    if (!ledgerSentinelRef.current) return;
    if (!hasMoreLedger || loadingLedger || loadingMoreLedger) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreLedger();
        }
      },
      { threshold: 0.1, rootMargin: "150px" }
    );

    observer.observe(ledgerSentinelRef.current);
    return () => observer.disconnect();
  }, [view, hasMoreLedger, loadingLedger, loadingMoreLedger, ledgerPage, ledgerStartDate, ledgerEndDate, cart?.id]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/kiosk/tasks/templates?kioskId=${cart.id}`);
      setTemplates(res.data.data?.items || res.data.data || []);
    } catch {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === "pending") fetchPending(taskFilter);
    else if (view === "ledger") fetchLedger(ledgerStartDate, ledgerEndDate);
    else if (view === "templates") fetchTemplates();
    else if (view === "newTodo") {
      fetchTemplates();
      if (tasks.length === 0) fetchPending(taskFilter);
    }
  }, [view, cart?.id]);

  const subViews = [
    { key: "pending", label: "Pending", icon: <MdTask size={13} /> },
    { key: "ledger", label: "Ledger", icon: <MdHistory size={13} /> },
    { key: "templates", label: "SPOs/Task", icon: <MdListAlt size={13} /> },
  ];

  return (
    <div className="kiosk_tab_content">
      {/* Optional SOP Compliance Audit Overview */}
      {showAudit && showCompliance && (
        <div style={{ marginBottom: 16 }}>
          <SopComplianceAudit cart={cart} showActions={false} />
        </div>
      )}

      {/* Sub-nav */}
      <div className="kiosk_sub_nav">
        {subViews.map((sv) => (
          <button
            key={sv.key}
            className={`kiosk_sub_nav_btn ${view === sv.key ? "kiosk_sub_nav_active" : ""}`}
            onClick={() => {
              setEditingTemplate(null);
              setView(sv.key);
            }}
          >
            {sv.icon} {sv.label}
          </button>
        ))}
        {showAudit && (
          <button
            className={`kiosk_sub_nav_btn ${showCompliance ? "kiosk_sub_nav_active" : ""}`}
            onClick={() => setShowCompliance((prev) => !prev)}
            title="Toggle Compliance Audit"
          >
            {showCompliance ? <MdExpandLess size={13} /> : <MdExpandMore size={13} />}{" "}
            {showCompliance ? "Hide Compliance" : "Show Compliance"}
          </button>
        )}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            className={`kiosk_sub_nav_btn ${view === "newTodo" ? "kiosk_sub_nav_active" : ""}`}
            onClick={() => {
              setEditingTemplate(null);
              setView("newTodo");
            }}
          >
            <MdAdd size={13} /> New Task
          </button>
          <button
            className={`kiosk_sub_nav_btn ${view === "newTemplate" ? "kiosk_sub_nav_active" : ""}`}
            onClick={() => {
              setEditingTemplate(null);
              setView("newTemplate");
            }}
          >
            <MdAdd size={13} /> New SOP
          </button>
        </div>
      </div>

      {view === "pending" ? (
        <div>
          {/* Status Filter Pills */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
              margin: "12px 0 14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <button
                type="button"
                className={`kiosk_sub_nav_btn ${taskFilter === "PENDING" ? "kiosk_sub_nav_active" : ""}`}
                style={{
                  borderRadius: 20,
                  padding: "4px 14px",
                  fontSize: "0.75rem",
                  height: 28,
                }}
                onClick={() => handleFilterChange("PENDING")}
              >
                Pending
              </button>
              <button
                type="button"
                className={`kiosk_sub_nav_btn ${taskFilter === "MISSED" ? "kiosk_sub_nav_active" : ""}`}
                style={{
                  borderRadius: 20,
                  padding: "4px 14px",
                  fontSize: "0.75rem",
                  height: 28,
                  color: taskFilter === "MISSED" ? "#ef4444" : undefined,
                }}
                onClick={() => handleFilterChange("MISSED")}
              >
                Missed
              </button>
              <button
                type="button"
                className={`kiosk_sub_nav_btn ${taskFilter === "ALL" ? "kiosk_sub_nav_active" : ""}`}
                style={{
                  borderRadius: 20,
                  padding: "4px 14px",
                  fontSize: "0.75rem",
                  height: 28,
                }}
                onClick={() => handleFilterChange("ALL")}
              >
                All
              </button>
            </div>
            {totalTasks !== null && (
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                {totalTasks} {taskFilter === "MISSED" ? "missed" : taskFilter === "PENDING" ? "pending" : "total"} task{totalTasks === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {loadingTasks ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton_shimmer skeleton_rect" style={{ height: 60, borderRadius: 12 }} />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="kiosk_empty_inline" style={{ padding: "32px 0" }}>
              <MdTask size={24} style={{ opacity: 0.3 }} />
              <span>{taskFilter === "MISSED" ? "No missed tasks" : taskFilter === "ALL" ? "No tasks found" : "No pending tasks"}</span>
              {taskFilter === "PENDING" && (
                <button
                  className="app_btn app_btn_confirm"
                  style={{ marginTop: 12, height: 32, fontSize: "0.78rem", padding: "0 14px" }}
                  onClick={() => setView("newTodo")}
                >
                  <MdAdd size={14} /> Create Task
                </button>
              )}
            </div>
          ) : (
            <div className="kiosk_tasks_list">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} onRefresh={() => fetchPending(taskFilter)} />
              ))}
              <div ref={taskSentinelRef} style={{ minHeight: 20, margin: "8px 0" }}>
                {loadingMoreTasks && (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "12px", gap: 8 }}>
                    <span className="btn_loader" style={{ width: 14, height: 14 }} />
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Loading more tasks...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton_shimmer skeleton_rect" style={{ height: 60, borderRadius: 12 }} />
          ))}
        </div>
      ) : view === "newTodo" ? (
        <TodoTaskBuilder
          kioskId={cart.id}
          templates={templates}
          recentTasks={[...tasks, ...ledger]}
          operators={cart.operators || []}
          onCreated={() => {
            setView("pending");
            fetchPending(taskFilter);
          }}
          onCancel={() => setView("pending")}
          onGoToTemplates={() => setView("newTemplate")}
        />
      ) : view === "newTemplate" ? (
        <TemplateBuilder
          kioskId={cart.id}
          operators={cart.operators || []}
          onCreated={() => {
            setView("templates");
            fetchTemplates();
          }}
          onCancelEdit={() => setView("templates")}
        />
      ) : view === "ledger" ? (
        <div>
          {/* Date Picker & Range Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
              margin: "12px 0 14px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "10px 14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  From
                </span>
                <input
                  type="date"
                  className="modal-input"
                  style={{ height: 32, padding: "0 8px", fontSize: "0.78rem", marginBottom: 0, width: 130 }}
                  value={ledgerStartDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLedgerStartDate(val);
                    fetchLedger(val, ledgerEndDate);
                  }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  To
                </span>
                <input
                  type="date"
                  className="modal-input"
                  style={{ height: 32, padding: "0 8px", fontSize: "0.78rem", marginBottom: 0, width: 130 }}
                  value={ledgerEndDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLedgerEndDate(val);
                    fetchLedger(ledgerStartDate, val);
                  }}
                />
              </div>
              <button
                type="button"
                className="kiosk_sub_nav_btn"
                style={{
                  borderRadius: 16,
                  padding: "3px 10px",
                  fontSize: "0.72rem",
                  height: 28,
                }}
                onClick={() => {
                  const todayStr = new Date().toISOString().split("T")[0];
                  setLedgerStartDate(todayStr);
                  setLedgerEndDate(todayStr);
                  fetchLedger(todayStr, todayStr);
                }}
              >
                Today
              </button>
              <button
                type="button"
                className="kiosk_sub_nav_btn"
                style={{
                  borderRadius: 16,
                  padding: "3px 10px",
                  fontSize: "0.72rem",
                  height: 28,
                }}
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 7);
                  const startStr = d.toISOString().split("T")[0];
                  const endStr = new Date().toISOString().split("T")[0];
                  setLedgerStartDate(startStr);
                  setLedgerEndDate(endStr);
                  fetchLedger(startStr, endStr);
                }}
              >
                Past 7 Days
              </button>
              {(ledgerStartDate || ledgerEndDate) && (
                <button
                  type="button"
                  className="kiosk_sub_nav_btn"
                  style={{
                    borderRadius: 16,
                    padding: "3px 10px",
                    fontSize: "0.72rem",
                    height: 28,
                    color: "#ef4444",
                  }}
                  onClick={() => {
                    setLedgerStartDate("");
                    setLedgerEndDate("");
                    fetchLedger("", "");
                  }}
                >
                  Clear Filter
                </button>
              )}
            </div>
            {totalLedger !== null && (
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                {totalLedger} record{totalLedger === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {loadingLedger ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton_shimmer skeleton_rect" style={{ height: 60, borderRadius: 12 }} />
              ))}
            </div>
          ) : ledger.length === 0 ? (
            <div className="kiosk_empty_inline" style={{ padding: "32px 0" }}>
              <MdHistory size={24} style={{ opacity: 0.3 }} />
              <span>{(ledgerStartDate || ledgerEndDate) ? "No task history for the selected date range" : "No task history yet"}</span>
            </div>
          ) : (
            <div className="kiosk_tasks_list">
              {ledger.map((task) => (
                <TaskCard key={task.id} task={task} onRefresh={() => fetchLedger(ledgerStartDate, ledgerEndDate)} />
              ))}
              <div ref={ledgerSentinelRef} style={{ minHeight: 20, margin: "8px 0" }}>
                {loadingMoreLedger && (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "12px", gap: 8 }}>
                    <span className="btn_loader" style={{ width: 14, height: 14 }} />
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Loading more history...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : view === "templates" ? (
        <>
          {/* Inline edit form */}
          {editingTemplate && (
            <div style={{ marginBottom: 16 }}>
              <TemplateBuilder
                kioskId={cart.id}
                operators={cart.operators || []}
                editTemplate={editingTemplate}
                onCreated={() => {
                  setEditingTemplate(null);
                  fetchTemplates();
                }}
                onCancelEdit={() => setEditingTemplate(null)}
              />
            </div>
          )}

          {templates.length === 0 ? (
            <div className="kiosk_empty_inline" style={{ padding: "32px 0" }}>
              <MdListAlt size={24} style={{ opacity: 0.3 }} />
              <span>No templates yet</span>
            </div>
          ) : (
            <div className="kiosk_tasks_list">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="kiosk_template_row"
                  style={{ opacity: editingTemplate?.id === tpl.id ? 0.4 : 1 }}
                >
                  <div className="kiosk_task_icon">
                    <MdListAlt size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="kiosk_task_name">{tpl.name}</div>
                    <div className="kiosk_task_meta">
                      <span>{tpl.type}</span>
                      <span className="contract_row_dot">·</span>
                      <span>{tpl.recurrence}</span>
                      {tpl.time && (
                        <>
                          <span className="contract_row_dot">·</span>
                          <span>Start {tpl.time}</span>
                        </>
                      )}
                      {tpl.dueMinutes && (
                        <>
                          <span className="contract_row_dot">·</span>
                          <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                            {tpl.dueMinutes}m window
                          </span>
                        </>
                      )}
                      {tpl.dueTime && (
                        <>
                          <span className="contract_row_dot">·</span>
                          <span>Due {tpl.dueTime}</span>
                        </>
                      )}
                      {tpl.operator?.user?.fullName && (
                        <>
                          <span className="contract_row_dot">·</span>
                          <span style={{ color: "var(--accent)" }}>
                            {tpl.operator.user.fullName}
                          </span>
                        </>
                      )}
                      {tpl.isGlobal && (
                        <>
                          <span className="contract_row_dot">·</span>
                          <span style={{ color: "var(--accent)" }}>Global</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexShrink: 0,
                    }}
                  >
                    <span className="kiosk_section_count">
                      {tpl.schema?.fields?.length || 0} fields
                    </span>
                    <button
                      className="kiosk_icon_action_btn"
                      onClick={() => handleDispatchTemplate(tpl)}
                      title="Dispatch task from this template now"
                    >
                      <MdFlashOn size={13} />
                    </button>
                    <button
                      className="kiosk_icon_action_btn"
                      onClick={() => {
                        setEditingTemplate(
                          editingTemplate?.id === tpl.id ? null : tpl,
                        );
                      }}
                      title="Edit template"
                    >
                      <MdEdit size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
