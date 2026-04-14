import { useTheme } from "../contexts/ThemeContext";
import NotificationBell from "../components/Notifications/NotificationBell";

export default function Navbar() {
  const { theme, toggle } = useTheme();

  return (
    <nav style={{ display: "flex", alignItems: "center", gap: "15px" }}>
      <button onClick={toggle}>
        {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
      </button>
      <NotificationBell />
    </nav>
  );
}