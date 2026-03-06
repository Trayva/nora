import { useTheme } from "../contexts/ThemeContext";

export default function Navbar() {
  const { theme, toggle } = useTheme();

  return (
    <nav>
      <button onClick={toggle}>
        {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
      </button>
    </nav>
  );
}