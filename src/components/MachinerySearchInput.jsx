import { useState, useEffect, useRef } from "react";
import { searchMachineries, createMachinery } from "../api/library";
import { MdOutlineSettings, MdAdd, MdClose } from "react-icons/md";

export default function MachinerySearchInput({
  onSelect,
  placeholder = "Search machineries...",
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", description: "" });
  const [newImage, setNewImage] = useState(null);
  const ref = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchMachineries({ search: query, limit: 8 });
      setResults(res.data.data?.data || []);

        setOpen(true);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    }, 350);
  }, [query]);

  const handlePick = (item) => {
    onSelect(item);
    setQuery(item.name);
    setOpen(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newForm.name.trim()) return;
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append("name", newForm.name.trim());
      if (newForm.description)
        fd.append("description", newForm.description.trim());
      if (newImage) fd.append("image", newImage);
      const res = await createMachinery(fd);
      const created = res.data.data;
      onSelect(created);
      setQuery(created.name);
      setOpen(false);
      setShowCreate(false);
      setNewForm({ name: "", description: "" });
      setNewImage(null);
    } catch (err) {
      console.error("Failed to create machinery", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="ing_search_wrap" ref={ref}>
      <input
        className="modal-input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        autoComplete="off"
      />

      {open && (
        <div className="ing_dropdown">
          {results.length > 0 && (
            <div className="ing_group">
              <div className="ing_group_label">
                <MdOutlineSettings size={11} /> Machineries
              </div>
              {results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="ing_option"
                  onClick={() => handlePick(item)}
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="ing_option_img"
                    />
                  ) : (
                    <div className="ing_option_img ing_option_img_placeholder">
                      <MdOutlineSettings size={12} />
                    </div>
                  )}
                  <span className="ing_option_name">{item.name}</span>
                  {item.manufacturer && (
                    <span className="ing_option_unit">{item.manufacturer}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {results.length === 0 && !loading && (
            <div className="ing_no_results">No results for "{query}"</div>
          )}

          <div className="ing_create_section">
            {!showCreate ? (
              <button
                type="button"
                className="ing_create_trigger"
                onClick={() => setShowCreate(true)}
              >
                <MdAdd size={13} />
                Create "{query || "new machinery"}"
              </button>
            ) : (
              <div className="ing_create_form">
                <div className="ing_create_header">
                  <span>New Machinery</span>
                  <button
                    type="button"
                    className="ing_create_close"
                    onClick={() => setShowCreate(false)}
                  >
                    <MdClose size={13} />
                  </button>
                </div>
                <input
                  className="modal-input"
                  placeholder="Name *"
                  value={newForm.name}
                  onChange={(e) =>
                    setNewForm((p) => ({ ...p, name: e.target.value }))
                  }
                  style={{ marginBottom: 6 }}
                />
                <input
                  className="modal-input"
                  placeholder="Description (optional)"
                  value={newForm.description}
                  onChange={(e) =>
                    setNewForm((p) => ({ ...p, description: e.target.value }))
                  }
                  style={{ marginBottom: 6 }}
                />
                <input
                  className="modal-input"
                  type="file"
                  accept="image/*"
                  style={{
                    fontSize: "0.75rem",
                    padding: "5px 8px",
                    marginBottom: 8,
                  }}
                  onChange={(e) => setNewImage(e.target.files[0])}
                />
                <button
                  type="button"
                  className={`app_btn app_btn_confirm ${creating ? "btn_loading" : ""}`}
                  onClick={handleCreate}
                  disabled={creating || !newForm.name}
                  style={{
                    width: "100%",
                    height: 34,
                    position: "relative",
                    fontSize: "0.8rem",
                  }}
                >
                  <span className="btn_text">Create & Select</span>
                  {creating && (
                    <span
                      className="btn_loader"
                      style={{ width: 13, height: 13 }}
                    />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
