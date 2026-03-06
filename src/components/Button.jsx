import Loader from "./Loader";

function Button({
  children,
  // width = "100%",
  height = 40,
  title,
  className = "",
  icon,
  loading,
  borderWidth,
  style = {},
  ...props
}) {
  return (
    <button
      style={{ height, borderWidth, position: "relative", ...style }}
      className={`btn  ${className} ${loading ? "d-flex justify-center align-center" : ""
        }`}
      title={title}
      {...props}
    >
      {icon}
      {loading ? <span
        className="btn_loader"
        style={{ width: 18, height: 18 }}
      /> : title}
      {children}
    </button>
  );
}

export default Button;
