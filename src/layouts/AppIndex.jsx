import { Outlet } from "react-router-dom";
import { useState } from "react";
import { Col, Row } from "reactstrap";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function AppIndex() {
  return (
    <Row className="m-0">
      {/* <Navbar/> */}
      <Col className="p-0" md={2}>
        <Sidebar />
      </Col>
      <Col className="p-0" md={10}>
        <Outlet />
      </Col>
    </Row>
  );
}
