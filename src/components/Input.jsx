import { useId, useState } from "react";
import Button from "./Button";
import icons from "../assets/icons.jsx";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";

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
  className = '',
  labelClassName = '',
  ...props
}) {
  const [hide, setHide] = useState(true);
  const id = useId();
  const isPassword = type === "password";

  return (
    <>
      {label ? (
        <label className={`fs-12 text-dark-grey ${labelClassName}`} htmlFor={id}>
          {label}
        </label>
      ) : null}

      <div
        style={{ maxWidth: width, ...containerStyle }}
        className={`input-container d-flex align-center ${containerClassName} ${textarea ? "input-textarea" : ""
          }`}
      >
        {left}

        {select ? (
          <select
            className={className}
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
              className={`flex-1 app_input ${className}`}
            />
            <button
              type="button"
              className="login_eye_btn"
              onClick={() => setShowPassword((p) => !p)}
              tabIndex={-1}
            >
              {!hide ? (
                <IoMdEyeOff size={16} />
              ) : (
                <IoMdEye size={16} />
              )}
            </button>
            {/* <button
              style={{ width: 40, height: 40 }}
              type="button"
              className="eye-toggle"
              onClick={() => setHide(!hide)}
              tabIndex={-1}
              aria-label={hide ? "Show password" : "Hide password"}
            >
              {icons.eye}
            </button> */}
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
            className={`flex-1 app_input ${className}`}
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