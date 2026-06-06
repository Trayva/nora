import { Navigate } from "react-router-dom";

// Settings content has been merged into the Profile page
export default function Settings() {
  return <Navigate to="/app/profile" replace />;
}
