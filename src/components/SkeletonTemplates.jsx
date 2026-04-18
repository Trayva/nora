import React from "react";
import Skeleton from "./Skeleton";

/**
 * TableSkeleton - Renders a shimmering table rows
 */
export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="table_skeleton_container" style={{ width: "100%", padding: "10px" }}>
      {/* Table Header */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        {Array(cols).fill(0).map((_, i) => (
          <Skeleton key={i} variant="rect" height={32} width={`${100 / cols}%`} />
        ))}
      </div>
      {/* Table Rows */}
      {Array(rows).fill(0).map((_, i) => (
        <div key={i} style={{ display: "flex", gap: "20px", marginBottom: "12px" }}>
          {Array(cols).fill(0).map((_, j) => (
            <Skeleton key={j} variant="text" height={20} width={`${100 / cols}%`} />
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * DashboardSkeleton - Renders shimmering stat cards
 */
export const DashboardSkeleton = ({ cards = 4 }) => {
  return (
    <div className="dashboard_skeleton_grid" style={{ 
      display: "grid", 
      gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", 
      gap: "20px",
      padding: "20px"
    }}>
      {Array(cards).fill(0).map((_, i) => (
        <div key={i} style={{ 
          background: "var(--bg-card)", 
          padding: "24px", 
          borderRadius: "16px",
          border: "1px solid var(--border)"
        }}>
          <Skeleton variant="circle" width={40} height={40} style={{ marginBottom: "16px" }} />
          <Skeleton variant="text" width="60%" height={24} style={{ marginBottom: "8px" }} />
          <Skeleton variant="text" width="40%" height={16} />
        </div>
      ))}
    </div>
  );
};

/**
 * CardSkeleton - Renders shimmering cards (for Kiosks, etc)
 */
export const CardSkeleton = ({ count = 3 }) => {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", padding: "20px" }}>
      {Array(count).fill(0).map((_, i) => (
        <div key={i} style={{ 
          width: "300px", 
          background: "var(--bg-card)", 
          borderRadius: "12px", 
          overflow: "hidden",
          border: "1px solid var(--border)"
        }}>
          <Skeleton variant="rect" height={160} />
          <div style={{ padding: "16px" }}>
            <Skeleton variant="text" width="80%" height={20} style={{ marginBottom: "10px" }} />
            <Skeleton variant="text" width="50%" height={14} />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * PageSkeleton - A generic full page loader
 */
export const PageSkeleton = () => {
  return (
    <div className="page_skeleton" style={{ padding: "20px", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "32px" }}>
        <div>
          <Skeleton variant="text" width={200} height={32} style={{ marginBottom: "8px" }} />
          <Skeleton variant="text" width={120} height={16} />
        </div>
        <Skeleton variant="rect" width={100} height={40} />
      </div>
      <DashboardSkeleton cards={4} />
      <div style={{ marginTop: "32px" }}>
        <TableSkeleton rows={8} />
      </div>
    </div>
  );
};
