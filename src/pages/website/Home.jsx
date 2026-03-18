// import Contact from "../../components/landing/Contact";
import Contact from "../../components/landing/Contact";
import Hero from "../../components/landing/Hero";
import Love from "../../components/landing/Love";
import PublicConceptsSection from "../../components/landing/PublicConceptsSection";
import Trayva from "../../components/landing/Trayva";
import WhoWeAre from "../../components/landing/WhoWeAre";

function Home(props) {
  return (
    <>
      <section
        id="home"
        style={{
          position: "relative",
          minHeight: "80vh",
        }}
      >
        <Hero />
        <WhoWeAre />
        <Trayva />
        <PublicConceptsSection />
        <Love />
        <Contact />
      </section>
    </>
  );
}

export default Home;
