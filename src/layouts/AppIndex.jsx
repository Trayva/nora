import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import "./AppIndex.css";

export default function AppIndex() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}