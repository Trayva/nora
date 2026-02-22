import icons from "../../assets/icons";
import PageTitle from "../../components/PageTitle";
import StatCard from "../../components/StatCard";
import useModal from "../../hooks/useModal";
import { Revenue } from "../../components/charts/Revenue";
import { getUsers } from "../../api/account";
import useAPI from "../../hooks/useAPI";
import Station from "../../components/models/Station";
import { useEffect } from "react";

function Dashboard(props) {
  const { openModal, closeModal, isOpened } = useModal();

  const {
    request: getPartners,
    loading: loading1,
    data: partners,
  } = useAPI(getUsers);
  const {
    request: getOperators,
    loading: loading2,
    data: operators,
  } = useAPI(getUsers);

  useEffect(() => {
    getPartners({ userType: "PARTNER" });
    getOperators({ userType: "OPERATOR" });

    // eslint-disable-next-line
  }, []);

  return (
    <div>
      <Station
        partners={partners?.data?.users}
        operators={operators?.data?.users}
        isOpened={isOpened}
        closeModal={closeModal}
      />
      <PageTitle
        btn={{
          title: "+ Add Station",
          width: 110,
          loading1: loading1 || loading2,
          onClick: openModal,
        }}
        title="Admin Dashboard"
        description="Monitor your parking facilities and revenue"
      />
      <div className="stat-cards d-flex gap-10 align-center">
        <StatCard
          icon={icons.money}
          title="Monthly Revenue"
          note="+0% from last month"
          number={0}
          before="AED "
        />
        <StatCard
          icon={icons.car2}
          title="Total Stations"
          note="+0 from last month"
          number={0}
        />

        <StatCard
          icon={icons.bookings}
          title="Active Reservations"
          note="+0% from last month"
          number={0}
        />

        <StatCard
          icon={icons.car2}
          title="Total Drivers"
          note="+0% from last month"
          number={0}
        />
      </div>
      <br />
      <div className="d-flex gap-10">
        <Revenue />
        {/* <Activities /> */}
      </div>
    </div>
  );
}

export default Dashboard;
