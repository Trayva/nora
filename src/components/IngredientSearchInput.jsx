import { useState, useEffect, useRef } from "react";
import { searchIngredients, createIngredient } from "../api/library";
import {
  MdOutlineScience,
  MdOutlineBlender,
  MdAdd,
  MdClose,
} from "react-icons/md";
import UnitSelect from "./UnitSelect";

export default function IngredientSearchInput({
  onSelect,
  placeholder = "Search ingredients or preps...",
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ ingredients: [], preps: [] });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newImage, setNewImage] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", unit: "" });
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
      setResults({ ingredients: [], preps: [] });
      setOpen(false);
      return;
    }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchIngredients({ search: query, limit: 8 });
        const data = res.data.data;
        setResults({
          ingredients: data.ingredient || [],
          preps: data.preps || [],
        });
        setOpen(true);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    }, 350);
  }, [query]);

  const handlePick = (item, type) => {
    onSelect({ id: item.id, name: item.name, type, unit: item.unit });
    setQuery(item.name);
    setOpen(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newForm.name.trim() || !newForm.unit.trim()) return;
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append("name", newForm.name.trim());
      fd.append("unit", newForm.unit.trim());
      if (newImage) fd.append("image", newImage); // ← add this
      const res = await createIngredient(fd);
      const created = res.data.data;
      onSelect({
        id: created.id,
        name: created.name,
        type: "ingredient",
        unit: created.unit,
      });
      setQuery(created.name);
      setOpen(false);
      setShowCreate(false);
      setNewForm({ name: "", unit: "" });
      setNewImage(null); // ← reset
    } catch (err) {
      console.error("Failed to create ingredient", err);
    } finally {
      setCreating(false);
    }
  };

  const hasResults = results.ingredients.length > 0 || results.preps.length > 0;

  return (
    <div className="ing_search_wrap" ref={ref}>
      <input
        className={`modal-input ${loading ? "ing_search_loading" : ""}`}
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => (hasResults || query.trim()) && setOpen(true)}
        autoComplete="off"
      />
      {loading && <span className="ing_search_spinner" />}

      {open && (
        <div className="ing_dropdown">
          {results.ingredients.length > 0 && (
            <div className="ing_group">
              <div className="ing_group_label">
                <MdOutlineScience size={11} /> Ingredients
              </div>
              {results.ingredients.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="ing_option"
                  onClick={() => handlePick(item, "ingredient")}
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="ing_option_img"
                    />
                  ) : (
                    <div className="ing_option_img ing_option_img_placeholder">
                      <MdOutlineScience size={12} />
                    </div>
                  )}
                  <span className="ing_option_name">{item.name}</span>
                  <span className="ing_option_unit">{item.unit}</span>
                </button>
              ))}
            </div>
          )}

          {results.preps.length > 0 && (
            <div className="ing_group">
              <div className="ing_group_label">
                <MdOutlineBlender size={11} /> Prep Items
              </div>
              {results.preps.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="ing_option"
                  onClick={() => handlePick(item, "prep")}
                >
                  <div className="ing_option_img ing_option_img_placeholder ing_option_img_prep">
                    <MdOutlineBlender size={12} />
                  </div>
                  <span className="ing_option_name">{item.name}</span>
                  <span className="ing_option_unit">{item.unit}</span>
                </button>
              ))}
            </div>
          )}

          {!hasResults && !loading && (
            <div className="ing_no_results">No results for "{query}"</div>
          )}

          {/* Create new ingredient */}
          <div className="ing_create_section">
            {!showCreate ? (
              <button
                type="button"
                className="ing_create_trigger"
                onClick={() => setShowCreate(true)}
              >
                <MdAdd size={13} />
                Create "{query || "new ingredient"}"
              </button>
            ) : (
              <div className="ing_create_form">
                <div className="ing_create_header">
                  <span>New Ingredient</span>
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
                <UnitSelect
                  value={newForm.unit}
                  onChange={(e) =>
                    setNewForm((p) => ({ ...p, unit: e.target.value }))
                  }
                  style={{ marginBottom: 8 }}
                />
                <div style={{ marginBottom: 8 }}>
                  <label
                    className="modal-label"
                    style={{
                      fontSize: "0.72rem",
                      marginBottom: 4,
                      display: "block",
                    }}
                  >
                    Image (optional)
                  </label>
                  <input
                    className="modal-input"
                    type="file"
                    accept="image/*"
                    style={{ fontSize: "0.75rem", padding: "5px 8px" }}
                    onChange={(e) => setNewImage(e.target.files[0])}
                  />
                </div>
                <button
                  type="button"
                  className={`app_btn app_btn_confirm ${creating ? "btn_loading" : ""}`}
                  onClick={handleCreate}
                  disabled={creating || !newForm.name || !newForm.unit}
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
