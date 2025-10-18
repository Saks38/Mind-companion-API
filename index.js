import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import dotenv from "dotenv";
import keepAlive from "./keepalive.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());

// Root check
app.get("/", (req, res) => {
  res.send("Mind Companion API is live 💫");
});

// Dialogflow webhook endpoint
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.queryResult?.queryText || req.body.text || "Hello";

    console.log("💬 User:", userMessage);

    // Send message to Hugging Face model
    const hfResponse = await fetch("https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: userMessage }),
    });

    const data = await hfResponse.json();
    let botReply = data[0]?.generated_text || "I'm here for you. Tell me more about that.";

    console.log("🤖 Bot:", botReply);

    // ✅ Dialogflow-compatible response format
    res.json({
      fulfillmentText: botReply,
      fulfillmentMessages: [
        {
          text: {
            text: [botReply],
          },
        },
      ],
      source: "mind-companion-api",
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.json({
      fulfillmentText: "Sorry, I had trouble responding just now. Please try again.",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  keepAlive();
});