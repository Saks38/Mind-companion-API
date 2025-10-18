import express from "express";
import fetch from "node-fetch";
import bodyParser from "body-parser";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(bodyParser.json());

const HF_API_KEY = process.env.HF_TOKEN;
const HF_API_URL = "https://api-inference.huggingface.co/models/microsoft/phi-3-mini-4k-instruct";

// 🧠 Main Fulfillment Endpoint for Dialogflow
app.post("/chat", async (req, res) => {
  try {
    // Step 1: Get user text (or Dialogflow's detected text)
    const userQuery = req.body.queryResult?.queryText || req.body.text || "Hello there!";

    // Step 2: Check if Dialogflow already has a response (from KB/intents)
    const dfReply = req.body.queryResult?.fulfillmentText;

    // Step 3: Merge both (so Phi can “refine” or “empathize”)
    const prompt = dfReply
      ? `User said: "${userQuery}". Dialogflow suggests: "${dfReply}". Rewrite it warmly, encouragingly, and naturally.`
      : `User said: "${userQuery}". Give a warm, supportive, and human response.`;

    // Step 4: Send to Phi model
    const hfResponse = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    const data = await hfResponse.json();
    const responseText =
      data?.[0]?.generated_text ||
      "I'm here for you. Feel free to share more about how you're feeling.";

    // Step 5: Send refined reply back to Dialogflow
    res.json({
      fulfillmentText: responseText,
    });
  } catch (error) {
    console.error("Error in /chat:", error);
    res.json({
      fulfillmentText: "Sorry, I had trouble processing that right now.",
    });
  }
});

app.listen(3000, () => console.log("✨ MindCompanion API running on port 3000"));

