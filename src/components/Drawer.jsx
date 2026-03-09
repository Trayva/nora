import { useEffect } from "react";
import { LuX } from "react-icons/lu";

export default function Drawer({ isOpen, onClose, title, description, children, width = 520 }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="drawer_backdrop" onClick={onClose} />

      {/* Panel */}
      <div className="drawer_panel" style={{ width }}>
        <div className="drawer_header">
          <div className="drawer_header_text">
            <h3 className="drawer_title">{title}</h3>
            {description && <p className="drawer_desc">{description}</p>}
          </div>
          <button className="drawer_close" onClick={onClose}>
            <LuX size={18} />
          </button>
        </div>
        <div className="drawer_body">{children}</div>
      </div>
    </>
  );
}