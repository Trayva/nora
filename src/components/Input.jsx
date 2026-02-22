import { useId, useState } from "react";
import Button from "./Button";
import icons from "../assets/icons.jsx";

function Input({
  label,
  left,
  containerClassName = "",
  containerStyle = {},
  width = "100%",
  onChange,
  errorMessage,
  select,
  options,
  disabled,
  textarea,
  type,
  ...props
}) {
  const [hide, setHide] = useState(true);
  const id = useId();
  const isPassword = type === "password";

  return (
    <>
      {label ? (
        <label className="fs-12 text-dark-grey" htmlFor={id}>
          {label}
        </label>
      ) : null}

      <div
        style={{ maxWidth: width, ...containerStyle }}
        className={`input-container d-flex align-center ${containerClassName} ${
          textarea ? "input-textarea" : ""
        }`}
      >
        {left}

        {select ? (
          <select
            disabled={disabled}
            value={props.value}
            onChange={(e) => {
              if (typeof onChange === "function") onChange(e.target.value);
            }}
          >
            <option value="">--select--</option>
            {options.map((_) => (
              <option disabled={_.disabled} value={_.value} key={_.value}>
                {_.label}
              </option>
            ))}
          </select>
        ) : textarea ? (
          <textarea
            {...props}
            disabled={disabled}
            onChange={(e) => {
              if (typeof onChange === "function") onChange(e.target.value);
            }}
            id={id}
            className="flex-1"
          />
        ) : isPassword ? (
          <div className="password-field-wrapper flex-1">
            <input
              {...props}
              autoComplete="off"
              type={hide ? "password" : "text"}
              disabled={disabled}
              onChange={(e) => {
                if (typeof onChange === "function") onChange(e.target.value);
              }}
              id={id}
              className="password-input"
            />
            <button
              type="button"
              className="eye-toggle"
              onClick={() => setHide(!hide)}
              tabIndex={-1}
              aria-label={hide ? "Show password" : "Hide password"}
            >
              {icons.eye}
            </button>
          </div>
        ) : (
          <input
            {...props}
            autoComplete="off"
            type={type}
            disabled={disabled}
            onChange={(e) => {
              if (typeof onChange === "function") onChange(e.target.value);
            }}
            id={id}
            className="flex-1 app_input"
          />
        )}
      </div>

      {errorMessage && (
        <p className="fs-12" style={{ color: "#ff6b6b", marginTop: 4 }}>
          {errorMessage}
        </p>
      )}
    </>
  );
}

export default Input;