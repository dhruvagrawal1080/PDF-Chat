import axios from "axios";

export const pingServer = async () => {
  try {
    const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/ping`);
    console.log("Server is up:", res.data);
  } catch (err) {
    console.error("Server ping failed:", err.message);
  }
};
