import { useNavigate } from "react-router-dom";
import { Col, Row } from "reactstrap";

function IcartHome() {
  const navigate = useNavigate();

  return (
    <div className="page_wrapper">
      <h2 className="page_title_big m-0">iCart</h2>
      <p className="welcome_message">Purchase and manage all your iCarts</p>

      <Row className="icart_card_wrapper">
        <Col className="icart_card">iCart</Col>
        <Col className="icart_card">iCart</Col>
        <Col className="icart_card">iCart</Col>
        <Col className="icart_card">iCart</Col>
      </Row>

      <div className="purchase-btn-wrapper">
        <button
          onClick={() => navigate("/app/purchase-icart")}
          className="app_btn app_btn_confirm"
          style={{ marginTop: 8, position: "relative", height: 42 }}
        >
          Purchase iCart
        </button>
      </div>


    </div>
  );
}

export default IcartHome;