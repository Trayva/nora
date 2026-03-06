import { useAuth } from "../../contexts/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="page_wrapper">
      <h2 className="page_title_big m-0">Dashboard</h2>
      <p className="welcome_message">Welcome back, {user?.fullName || user?.email}!</p>

      {/* <div className="mt-20">
        <h3>User Info</h3>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </div> */}
    </div>
  );
}