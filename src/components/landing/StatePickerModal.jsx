import { MdCheckCircle, MdCircle } from "react-icons/md";
import Modal from "./Modal";
import { useAppState } from "../contexts/StateContext";

export default function StatePickerModal({ isOpen, onClose }) {
  const { states, selectedState, changeState } = useAppState();

  const handleSelect = (state) => {
    changeState(state);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Region"
      description="Choose a state to see localised pricing and cost calculations."
    >
      <div className="modal-body">
        <div className="state_picker_list">
          {states.length === 0 ? (
            <div
              style={{
                padding: "24px 0",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "0.85rem",
              }}
            >
              No regions available.
            </div>
          ) : (
            states.map((state) => {
              const isSelected = selectedState?.id === state.id;
              return (
                <div
                  key={state.id}
                  className={`state_picker_row ${isSelected ? "state_picker_row_active" : ""}`}
                  onClick={() => handleSelect(state)}
                >
                  <div className="state_picker_row_left">
                    <span className="state_picker_name">{state.name}</span>
                    {state.currency && (
                      <span className="state_picker_currency">
                        {state.currency}
                      </span>
                    )}
                  </div>
                  {isSelected ? (
                    <MdCheckCircle
                      size={16}
                      style={{ color: "var(--accent)", flexShrink: 0 }}
                    />
                  ) : (
                    <MdCircle
                      size={14}
                      style={{ color: "var(--border)", flexShrink: 0 }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
