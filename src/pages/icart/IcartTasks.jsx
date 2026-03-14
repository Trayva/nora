import { useState, useEffect } from "react";
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
} from "react-icons/md";
import api from "../../api/axios";

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
      className="icart_status_badge"
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

/* ── Template Builder ──────────────────────────────────────── */
function TemplateBuilder({
  cartId,
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
      cartId: isGlobal ? undefined : cartId,
      operatorId: operatorId || undefined,
      time: time || undefined,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await api.patch(`/icart/tasks/templates/${editTemplate.id}`, payload);
        toast.success("Template updated");
      } else {
        await api.post("/icart/tasks/templates", payload);
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
    <div className="icart_template_builder">
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
          {isEdit ? "Edit Template" : "New Template"}
        </span>
        {isEdit && onCancelEdit && (
          <button className="icart_icon_action_btn" onClick={onCancelEdit}>
            <MdClose size={14} />
          </button>
        )}
      </div>

      <div className="form-field">
        <label className="modal-label">Template Name *</label>
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

      {/* Global toggle for ADMIN ONLY */}
      {/* <div className="icart_toggle_row" style={{ marginBottom: 14 }}>
        <span className="icart_toggle_label">Apply Globally (all carts)</span>
        <button
          className={`icart_toggle_switch ${isGlobal ? "icart_toggle_on" : ""}`}
          onClick={() => setIsGlobal((v) => !v)}
        >
          <span className="icart_toggle_knob" />
        </button>
      </div> */}

      {/* Fields */}
      <div
        className="drawer_section_title"
        style={{ display: "flex", alignItems: "center" }}
      >
        <span>Form Fields</span>
        <button
          className="icart_icon_action_btn"
          style={{ marginLeft: "auto" }}
          onClick={addField}
        >
          <MdAdd size={15} />
        </button>
      </div>

      <div className="icart_fields_list">
        {fields.map((field, i) => (
          <div key={i} className="icart_field_row">
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
              className="icart_icon_action_btn icart_icon_danger"
              onClick={() => removeField(i)}
              disabled={fields.length === 1}
            >
              <MdClose size={14} />
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
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
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.patch(`/icart/tasks/${task.id}/submit`, { data: formData });
      toast.success("Task submitted");
      onSubmitted();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit task");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="icart_task_submit_form">
      {schema.map((field, i) => (
        <div key={i} className="form-field">
          <label className="modal-label">{field.label}</label>
          {field.type === "checkbox" ? (
            <button
              className={`icart_checkbox_btn ${formData[field.label] ? "icart_checkbox_checked" : ""}`}
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
      <button
        className={`app_btn app_btn_confirm ${submitting ? "btn_loading" : ""}`}
        style={{ width: "100%", height: 40, marginTop: 6 }}
        onClick={handleSubmit}
        disabled={submitting}
      >
        <span className="btn_text">Submit Task</span>
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
      await api.patch(`/icart/tasks/${task.id}/review`, {
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

  const isPending = task.status === "PENDING" || task.status === "IN_PROGRESS";
  const isSubmitted =
    task.status === "SUBMITTED" || task.status === "COMPLETED";

  return (
    <div className="icart_task_card">
      <div
        className="icart_task_card_top"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="icart_task_card_left">
          <div className="icart_task_icon">
            <MdTask size={14} />
          </div>
          <div>
            <div className="icart_task_name">
              {task.template?.name || task.name || "Task"}
            </div>
            <div className="icart_task_meta">
              {task.template?.recurrence && (
                <span>{task.template.recurrence}</span>
              )}
              {task.dueAt && (
                <>
                  <span className="contract_row_dot">·</span>
                  <span>
                    Due{" "}
                    {new Date(task.dueAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <StatusPill status={task.status} />
          {expanded ? (
            <MdExpandLess size={16} style={{ color: "var(--text-muted)" }} />
          ) : (
            <MdExpandMore size={16} style={{ color: "var(--text-muted)" }} />
          )}
        </div>
      </div>

      {expanded && (
        <div className="icart_task_expanded">
          {/* Show submitted data */}
          {task.data && Object.keys(task.data).length > 0 && (
            <div className="icart_task_data">
              {Object.entries(task.data).map(([k, v]) => (
                <div key={k} className="icart_task_data_row">
                  <span className="icart_meta_key">{k}</span>
                  <span className="icart_meta_val">
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

          {task.managerComments && (
            <div className="icart_manager_comment">
              <span className="icart_meta_key">Manager Note</span>
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

/* ── Main IcartTasks ───────────────────────────────────────── */
export default function IcartTasks({ cart }) {
  const [view, setView] = useState("pending"); // pending | ledger | templates | newTemplate
  const [tasks, setTasks] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null); // template being edited

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/icart/tasks?cartId=${cart.id}`);
      setTasks(res.data.data?.items || res.data.data || []);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/icart/tasks/ledger?cartId=${cart.id}`);
      setLedger(res.data.data?.items || res.data.data || []);
    } catch {
      toast.error("Failed to load ledger");
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/icart/tasks/templates?cartId=${cart.id}`);
      setTemplates(res.data.data?.items || res.data.data || []);
    } catch {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === "pending") fetchPending();
    else if (view === "ledger") fetchLedger();
    else if (view === "templates") fetchTemplates();
  }, [view]);

  const subViews = [
    { key: "pending", label: "Pending", icon: <MdTask size={13} /> },
    { key: "ledger", label: "Ledger", icon: <MdHistory size={13} /> },
    { key: "templates", label: "Templates", icon: <MdListAlt size={13} /> },
  ];

  return (
    <div className="icart_tab_content">
      {/* Sub-nav */}
      <div className="icart_sub_nav">
        {subViews.map((sv) => (
          <button
            key={sv.key}
            className={`icart_sub_nav_btn ${view === sv.key ? "icart_sub_nav_active" : ""}`}
            onClick={() => setView(sv.key)}
          >
            {sv.icon} {sv.label}
          </button>
        ))}
        <button
          className={`icart_sub_nav_btn ${view === "newTemplate" ? "icart_sub_nav_active" : ""}`}
          onClick={() => setView("newTemplate")}
          style={{ marginLeft: "auto" }}
        >
          <MdAdd size={13} /> New Template
        </button>
      </div>

      {loading ? (
        <div className="drawer_loading">
          <div className="page_loader_spinner" />
        </div>
      ) : view === "newTemplate" ? (
        <TemplateBuilder
          cartId={cart.id}
          operators={cart.operators || []}
          onCreated={() => {
            setView("templates");
            fetchTemplates();
          }}
        />
      ) : view === "pending" ? (
        tasks.length === 0 ? (
          <div className="icart_empty_inline" style={{ padding: "32px 0" }}>
            <MdTask size={24} style={{ opacity: 0.3 }} />
            <span>No pending tasks</span>
          </div>
        ) : (
          <div className="icart_tasks_list">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onRefresh={fetchPending} />
            ))}
          </div>
        )
      ) : view === "ledger" ? (
        ledger.length === 0 ? (
          <div className="icart_empty_inline" style={{ padding: "32px 0" }}>
            <MdHistory size={24} style={{ opacity: 0.3 }} />
            <span>No task history yet</span>
          </div>
        ) : (
          <div className="icart_tasks_list">
            {ledger.map((task) => (
              <TaskCard key={task.id} task={task} onRefresh={fetchLedger} />
            ))}
          </div>
        )
      ) : view === "templates" ? (
        <>
          {/* Inline edit form */}
          {editingTemplate && (
            <div style={{ marginBottom: 16 }}>
              <TemplateBuilder
                cartId={cart.id}
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
            <div className="icart_empty_inline" style={{ padding: "32px 0" }}>
              <MdListAlt size={24} style={{ opacity: 0.3 }} />
              <span>No templates yet</span>
            </div>
          ) : (
            <div className="icart_tasks_list">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="icart_template_row"
                  style={{ opacity: editingTemplate?.id === tpl.id ? 0.4 : 1 }}
                >
                  <div className="icart_task_icon">
                    <MdListAlt size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="icart_task_name">{tpl.name}</div>
                    <div className="icart_task_meta">
                      <span>{tpl.type}</span>
                      <span className="contract_row_dot">·</span>
                      <span>{tpl.recurrence}</span>
                      {tpl.time && (
                        <>
                          <span className="contract_row_dot">·</span>
                          <span>{tpl.time}</span>
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
                    <span className="icart_section_count">
                      {tpl.schema?.fields?.length || 0} fields
                    </span>
                    <button
                      className="icart_icon_action_btn"
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
