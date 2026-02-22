import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function useAPI(
  apiFunc,
  {
    autoRefresh = false,
    timeOut = 0,
    showAlert = false,
    showError = true,
  } = {},
  cb
) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(autoRefresh);

  const request = async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFunc(...args);
      if (!response.ok) {
        setError(response.error);
        if (showError)
          toast.error(response.error || "An unexpected error occurred.");
      }
      setData(response.data);
      if (showAlert) toast.info(response.data.message);
      return response.data;
    } catch (err) {
      console.log(err.response?.data?.message);
    } finally {
      setLoading(false);
      if (typeof cb === "function") cb();
    }
  };

  useEffect(() => {
    setTimeout(() => {
      if (autoRefresh) request();
    }, timeOut);
    // eslint-disable-next-line
  }, []);

  return {
    data,
    error,
    loading,
    setData,
    request,
    refresh: request,
    setLoading,
  };
}
