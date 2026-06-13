import React from "react";
import "./Tabs.css";

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  className = "",
  style = {},
}) {
  return (
    <div
      className={`nora-tabs ${className}`}
      style={style}
      role="tablist"
    >
      {tabs.map((tab) => {
        const id = tab.id || tab.key;
        const Icon = tab.icon;
        const isActive = activeTab === id;

        return (
          <button
            key={id}
            id={`tab-${id}`}
            role="tab"
            aria-selected={isActive}
            className={`nora-tab-btn ${isActive ? "active" : ""}`}
            onClick={() => onChange(id)}
          >
            {Icon && <Icon className="nora-tab-icon" />}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
