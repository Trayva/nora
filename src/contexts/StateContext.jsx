import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const StateContext = createContext(null);

export default function StateProvider({ children }) {
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState(null);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await api.get("/config/state");
        const list = res.data.data || [];
        setStates(list);
        // Restore saved state from localStorage
        const saved = localStorage.getItem("nora-state");
        if (saved) {
          const found = list.find((s) => s.id === saved);
          if (found) setSelectedState(found);
        } else if (list.length > 0) {
          setSelectedState(list[0]); // default to first
          localStorage.setItem("nora-state", list[0].id);
        }
      } catch {
        console.error("Failed to fetch states");
      }
    };
    fetchStates();
  }, []);

  const changeState = (state) => {
    setSelectedState(state);
    localStorage.setItem("nora-state", state.id);
  };

  return (
    <StateContext.Provider value={{ states, selectedState, changeState }}>
      {children}
    </StateContext.Provider>
  );
}

export const useAppState = () => {
  const ctx = useContext(StateContext);
  if (!ctx) throw new Error("useAppState must be used within StateProvider");
  return ctx;
};