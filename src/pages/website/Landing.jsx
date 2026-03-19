  import { Route, Routes } from "react-router-dom";
  import Footer from "../../components/landing/Footer";
  import Header from "../../components/landing/Header";
  import Home from "./Home";
  import NotFound from "../NotFound";
  // import Concept from "../../routers/app/Concept";
  // import Samples from "../dev/Samples";

  function Landing(props) {
    return (
      <div className="roboto">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </div>
    );
  }

  export default Landing;
