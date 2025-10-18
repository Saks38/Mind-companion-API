// index.js
import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import keepAlive from "./keepalive.js";

dotenv.config();

const app = express();
app.use(bodyParser.json());

// ✅ Root route (to check if server is live)
app.get("/", (req, res) => {
  res.send("🧠 Mind Companion API is live and connected to Dialogflow!");
});

// ✅ Main webhook endpoint for Dialogflow
app.post("/chat", async (req, res) => {
  try {
    const userQuery = req.body.queryResult?.queryText || "User message missing.";
    const kbResponse = req.body.queryResult?.fulfillmentText || ""; // Pull KB text if it exists

    // Combine user query + KB response for Phi to refine
    const combinedText = kbResponse
      ? `The user asked: "${userQuery}". Dialogflow suggested: "${kbResponse}". Please rephrase this response naturally and empathetically, like a human counselor would.`
      : `The user said: "${userQuery}". Please respond naturally and empathetically.`;

    console.log("🧠 User Query:", userQuery);
    console.log("📘 Knowledge Base Response:", kbResponse || "(none)");

    // Send combined text to Phi model on Hugging Face
    const phiResponse = await axios.post(
      "https://api-inference.huggingface.co/models/microsoft/phi-3-mini-4k-instruct",
      { inputs: combinedText },
      { headers: { Authorization: `Bearer ${process.env.HF_TOKEN}` } }
    );

    const refinedText =
      phiResponse.data?.[0]?.generated_text?.trim() ||
      "I'm here for you. Please tell me more about what’s been going on.";

    console.log("💬 Refined Response:", refinedText);

    // Send refined response back to Dialogflow
    res.json({
      fulfillmentText: refinedText,
    });
  } catch (error) {
    console.error("❌ Error processing request:", error);
    res.json({
      fulfillmentText:
        "I’m here for you, but I’m having trouble responding right now. Can you say that again?",
    });
  }
});

// ✅ Keepalive ping (prevents Render from sleeping too early)
keepAlive();

// ✅ Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});