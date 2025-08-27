import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Callback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const token = new URLSearchParams(hash.replace("#", "?")).get("access_token");
      if (token) {
        localStorage.setItem("spotify_token", token);
        navigate("/dashboard");
      }
    }
  }, [navigate]);

  return <p className="text-center mt-10">Logging in...</p>;
};
export default Callback;
