import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// 🧩 Core Phi-2 Query Function
async function queryPhi(prompt) {
  const url = "https://api-inference.huggingface.co/models/microsoft/phi-2?wait_for_model=true";
  const headers = {
    Authorization: `Bearer ${process.env.HF_TOKEN}`,
    "Content-Type": "application/json",
  };

  const body = JSON.stringify({
    inputs: `The user said: "${prompt}". Respond compassionately, like a mental health companion providing thoughtful advice.`,
    parameters: {
      max_new_tokens: 180,
      temperature: 0.85,
      top_p: 0.95,
      return_full_text: false,
    },
  });

  // Try fetching once, retry if model isn’t ready
  let res = await fetch(url, { method: "POST", headers, body });
  let text = await res.text();

  if (text.startsWith("Not Found")) {
    console.warn("⚠️ Model warming up... retrying once in 5s");
    await new Promise((r) => setTimeout(r, 5000));
    res = await fetch(url, { method: "POST", headers, body });
    text = await res.text();
  }

  try {
    const data = JSON.parse(text);
    return Array.isArray(data) && data[0]?.generated_text
      ? data[0].generated_text.trim()
      : "I'm here for you. Tell me more about that.";
  } catch (err) {
    console.error("❌ Parse error:", err, "\nResponse text:", text);
    return "I'm here for you. Tell me more about that.";
  }
}

// 🌐 Webhook endpoint for Dialogflow
app.post("/chat", async (req, res) => {
  try {
    const userMessage =
      req.body.queryResult?.queryText ||
      req.body.text ||
      "Hello, how are you feeling today?";

    console.log(`💬 User: ${userMessage}`);

    const botReply = await queryPhi(userMessage);

    console.log(`🤖 Bot: ${botReply}`);

    res.json({
      fulfillmentText: botReply,
    });
  } catch (error) {
    console.error("⚠️ Webhook Error:", error);
    res.json({
      fulfillmentText: "I'm here for you, but something went wrong. Could you repeat that?",
    });
  }
});

// 🛠️ Keepalive (for Render Free Tier)
app.get("/", (req, res) => {
  res.send("Mind Companion API is live 🌿");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});