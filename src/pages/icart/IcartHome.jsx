import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Col, Row } from "reactstrap";
import Modal from "../../components/Modal";
import ButtonLoader from "../../components/ButtonLoader";

const purchaseSchema = Yup.object().shape({
  noOfCarts: Yup.number()
    .typeError("Please enter a valid number")
    .min(1, "Minimum 1 iCart required")
    .integer("Must be a whole number")
    .required("Number of iCarts is required"),
});

function IcartHome() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSubmit = (values, { setSubmitting }) => {
    localStorage.setItem("icart_purchase_count", values.noOfCarts);
    setSubmitting(false);
    navigate("/app/purchase-icart");
  };

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
          onClick={() => setOpen(true)}
          className="app_btn app_btn_confirm"
          style={{ marginTop: 8, position: "relative", height: 42 }}
        >
          Purchase iCart
        </button>
      </div>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Purchase iCart"
        description="Select how many iCarts you would like to purchase"
      >
        <Formik
          initialValues={{ noOfCarts: "" }}
          validationSchema={purchaseSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, values, handleChange, handleBlur, isSubmitting }) => (
            <Form>
              <div className="modal-body">
                <div className="form-field">
                  <label className="modal-label">Number of iCarts</label>
                  <input
                    className={`modal-input ${touched.noOfCarts && errors.noOfCarts ? "modal-input-error" : ""}`}
                    type="number"
                    name="noOfCarts"
                    placeholder="e.g. 2"
                    min="1"
                    value={values.noOfCarts}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isSubmitting}
                  />
                  {touched.noOfCarts && errors.noOfCarts && (
                    <span className="login_field_error">{errors.noOfCarts}</span>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="app_btn app_btn_cancel"
                    onClick={() => setOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`app_btn app_btn_confirm ${isSubmitting ? "btn_loading" : ""}`}
                    disabled={isSubmitting}
                  >
                    <span className="btn_text text-white">Purchase</span>
                    {isSubmitting && <ButtonLoader />}
                  </button>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </Modal>
    </div>
  );
}

export default IcartHome;