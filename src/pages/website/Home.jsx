import Contact from "../../components/landing/Contact";
import Hero from "../../components/landing/Hero";
import Love from "../../components/landing/Love";
import PublicConceptsSection from "../../components/landing/PublicConceptsSection";
import WhoWeAre from "../../components/landing/WhoWeAre";
import BrandBenefits from "../../components/landing/BrandBenefits";
import OwnerBenefits from "../../components/landing/OwnerBenefits";
import ProductEcosystem from "../../components/landing/ProductEcosystem";
import How from "../../components/landing/How";
import Why from "../../components/landing/Why";
import Vision from "../../components/landing/Vision";
import FinalCTA from "../../components/landing/FinalCTA";

import PlansSection from "../../components/landing/PlansSection";

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
        <BrandBenefits />
        <OwnerBenefits />
        <ProductEcosystem />
        <How />
        <Why />
        <Vision />
        <PlansSection />
        {/* <PublicConceptsSection /> */}
        {/* <Love /> */}
        {/* <FinalCTA /> */}
        <Contact />
      </section>
    </>
  );
}

export default Home;
