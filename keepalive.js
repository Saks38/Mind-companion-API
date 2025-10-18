import fetch from "node-fetch";

export default function keepAlive() {
  setInterval(async () => {
    try {
      await fetch("https://mind-companion-api.onrender.com");
      console.log("💓 Pinged server to stay awake");
    } catch (err) {
      console.error("Ping failed:", err.message);
    }
  }, 10 * 60 * 1000); // every 10 minutes
}
