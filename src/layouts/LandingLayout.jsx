import { Outlet } from "react-router-dom";
import Header from "../components/landing/Header";
// import Header from "../pages/website/Header";

export default function LandingLayout() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
}
