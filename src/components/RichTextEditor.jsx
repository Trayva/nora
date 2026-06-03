import React, { useRef, useEffect, useState } from "react";
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdFormatStrikethrough,
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdFormatAlignJustify,
  MdFormatListNumbered,
  MdFormatListBulleted,
  MdFormatClear,
  MdTableChart,
  MdExpandMore,
} from "react-icons/md";

const VARIABLES = [
  { label: "Date", value: "{{date}}" },
  { label: "Day", value: "{{day}}" },
  { label: "Month", value: "{{month}}" },
  { label: "Year", value: "{{year}}" },
  { label: "Buyer Name", value: "{{buyer_name}}" },
  { label: "Buyer Address", value: "{{buyer_address}}" },
  { label: "Kiosk Specifications Table", value: "{{specification_table}}" },
  { label: "Purchase Price", value: "{{purchase_price}}" },
  { label: "Currency", value: "{{currency}}" },
  { label: "Number of Kiosks", value: "{{number_of_kiosks}}" },
  { label: "Kiosk Serial Number", value: "{{kiosk_serial}}" },
  { label: "Kiosk Location", value: "{{kiosk_location}}" },
  { label: "Brand/Concept Name", value: "{{concept_name}}" },
];

export default function RichTextEditor({ value, onChange, placeholder = "Write terms here..." }) {
  const editorRef = useRef(null);
  const [showVars, setShowVars] = useState(false);

  // Sync value from prop only if it is different from DOM to prevent cursor resets
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (value || "")) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command, arg = null) => {
    document.execCommand(command, false, arg);
    handleInput();
  };

  const insertVariable = (variableVal) => {
    editorRef.current.focus();
    
    // Save current selection / cursor position or append
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        range.deleteContents();
        const textNode = document.createTextNode(variableVal);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
        handleInput();
        setShowVars(false);
        return;
      }
    }
    
    // Fallback: append to end
    editorRef.current.innerHTML += variableVal;
    handleInput();
    setShowVars(false);
  };

  const insertTable = () => {
    const tableHTML = `
      <table style="width: 100%; border-collapse: collapse; margin: 12px 0; border: 1px solid var(--border);">
        <thead>
          <tr style="background: var(--bg-hover);">
            <th style="border: 1px solid var(--border); padding: 8px; text-align: left; font-size: 0.78rem;">Header 1</th>
            <th style="border: 1px solid var(--border); padding: 8px; text-align: left; font-size: 0.78rem;">Header 2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid var(--border); padding: 8px; font-size: 0.78rem;">Cell 1</td>
            <td style="border: 1px solid var(--border); padding: 8px; font-size: 0.78rem;">Cell 2</td>
          </tr>
        </tbody>
      </table>&nbsp;
    `;
    execCommand("insertHTML", tableHTML);
  };

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        background: "var(--bg-card)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 4,
          padding: 8,
          background: "var(--bg-hover)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <button
          type="button"
          onClick={() => execCommand("bold")}
          style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "none", cursor: "pointer", color: "var(--text-body)" }}
          title="Bold"
        >
          <MdFormatBold size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand("italic")}
          style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "none", cursor: "pointer", color: "var(--text-body)" }}
          title="Italic"
        >
          <MdFormatItalic size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand("underline")}
          style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "none", cursor: "pointer", color: "var(--text-body)" }}
          title="Underline"
        >
          <MdFormatUnderlined size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand("strikeThrough")}
          style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "none", cursor: "pointer", color: "var(--text-body)" }}
          title="Strikethrough"
        >
          <MdFormatStrikethrough size={16} />
        </button>

        <span style={{ width: 1, height: 16, background: "var(--border)", margin: "0 4px" }} />

        <select
          onChange={(e) => execCommand("formatBlock", e.target.value)}
          defaultValue="P"
          style={{
            height: 28,
            borderRadius: 6,
            border: "1px solid var(--border)",
            background: "var(--bg-card)",
            color: "var(--text-body)",
            fontSize: "0.75rem",
            padding: "0 4px",
            fontFamily: "inherit",
          }}
        >
          <option value="P">Normal Text</option>
          <option value="H1">Heading 1</option>
          <option value="H2">Heading 2</option>
          <option value="H3">Heading 3</option>
        </select>

        <span style={{ width: 1, height: 16, background: "var(--border)", margin: "0 4px" }} />

        <button
          type="button"
          onClick={() => execCommand("justifyLeft")}
          style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "none", cursor: "pointer", color: "var(--text-body)" }}
          title="Align Left"
        >
          <MdFormatAlignLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand("justifyCenter")}
          style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "none", cursor: "pointer", color: "var(--text-body)" }}
          title="Align Center"
        >
          <MdFormatAlignCenter size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand("justifyRight")}
          style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "none", cursor: "pointer", color: "var(--text-body)" }}
          title="Align Right"
        >
          <MdFormatAlignRight size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand("justifyFull")}
          style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "none", cursor: "pointer", color: "var(--text-body)" }}
          title="Justify"
        >
          <MdFormatAlignJustify size={16} />
        </button>

        <span style={{ width: 1, height: 16, background: "var(--border)", margin: "0 4px" }} />

        <button
          type="button"
          onClick={() => execCommand("insertOrderedList")}
          style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "none", cursor: "pointer", color: "var(--text-body)" }}
          title="Numbered List"
        >
          <MdFormatListNumbered size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand("insertUnorderedList")}
          style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "none", cursor: "pointer", color: "var(--text-body)" }}
          title="Bulleted List"
        >
          <MdFormatListBulleted size={16} />
        </button>

        <span style={{ width: 1, height: 16, background: "var(--border)", margin: "0 4px" }} />

        <button
          type="button"
          onClick={insertTable}
          style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "none", cursor: "pointer", color: "var(--text-body)" }}
          title="Insert Table"
        >
          <MdTableChart size={16} />
        </button>

        <button
          type="button"
          onClick={() => execCommand("removeFormat")}
          style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "none", cursor: "pointer", color: "var(--text-body)" }}
          title="Clear Formatting"
        >
          <MdFormatClear size={16} />
        </button>

        {/* Variable Injector */}
        <span style={{ width: 1, height: 16, background: "var(--border)", margin: "0 4px" }} />
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setShowVars(!showVars)}
            style={{
              height: 28,
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "var(--bg-card)",
              color: "var(--text-body)",
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "0 8px",
              display: "flex",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
            }}
          >
            Insert Variable <MdExpandMore size={12} />
          </button>
          {showVars && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                zIndex: 10,
                width: 200,
                maxHeight: 250,
                overflowY: "auto",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                marginTop: 4,
                padding: 4,
              }}
            >
              {VARIABLES.map((v) => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => insertVariable(v.value)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "6px 8px",
                    background: "none",
                    border: "none",
                    borderRadius: 4,
                    fontSize: "0.73rem",
                    cursor: "pointer",
                    color: "var(--text-body)",
                    fontFamily: "inherit",
                    display: "block",
                  }}
                  onMouseOver={(e) => (e.target.style.background = "var(--bg-hover)")}
                  onMouseOut={(e) => (e.target.style.background = "none")}
                >
                  {v.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        style={{
          padding: "12px 16px",
          minHeight: 180,
          maxHeight: 400,
          overflowY: "auto",
          outline: "none",
          fontSize: "0.82rem",
          lineHeight: 1.7,
          color: "var(--text-body)",
          background: "var(--bg-card)",
        }}
        placeholder={placeholder}
      />
    </div>
  );
}
