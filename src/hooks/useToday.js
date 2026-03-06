import { useState } from "react";
import { getStartAndEndOfToday } from "../utils/date";

const useToday = () => {
  const today = getStartAndEndOfToday();
  const [startDate, setStartDate] = useState(today.start);
  const [endDate, setEndDate] = useState(today.end);
  return { startDate, endDate, setStartDate, setEndDate };
};

export default useToday;
