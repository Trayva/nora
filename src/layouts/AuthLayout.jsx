import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 380, padding: "0 1rem" }}>
          <Outlet />
        </div>
      </div>

      <footer
        style={{
          textAlign: "center",
          padding: "1rem",
          fontSize: "0.75rem",
          color: "var(--text-muted)",
        }}
      >
        <span>Copyright © {new Date().getFullYear()} Nora. All rights reserved</span>
      </footer>
    </div>
  );
}