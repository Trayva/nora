function Loader({ loading }) {
  if (!loading) return null;
  return <div className="loader" />;
}

export default Loader;
