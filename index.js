import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// 🧩 Hugging Face Phi-2 Model API Endpoint
const HF_API_URL = "https://api-inference.huggingface.co/models/microsoft/phi-2?wait_for_model=true";

// 💬 Function to query the Hugging Face API (Phi-2)
async function queryPhi(prompt) {
  const headers = {
    Authorization: `Bearer ${process.env.HF_TOKEN}`,
    "Content-Type": "application/json",
  };

  const body = JSON.stringify({
    inputs: prompt,
    parameters: {
      max_new_tokens: 180,
      temperature: 0.8,
      top_p: 0.95,
      return_full_text: false,
    },
  });

  try {
    let response = await fetch(HF_API_URL, { method: "POST", headers, body });
    let text = await response.text();

    // Handle model loading or 404 issues gracefully
    if (text.startsWith("Not Found") || text.includes("loading")) {
      console.log("⚠️ Model warming up... retrying in 5 seconds.");
      await new Promise((r) => setTimeout(r, 5000));
      response = await fetch(HF_API_URL, { method: "POST", headers, body });
      text = await response.text();
    }

    const data = JSON.parse(text);
    if (Array.isArray(data) && data[0]?.generated_text) {
      return data[0].generated_text.trim();
    } else {
      console.log("⚠️ Unexpected response:", data);
      return "I'm here for you. Tell me more about that.";
    }
  } catch (err) {
    console.error("❌ Error in queryPhi:", err);
    return "I'm here for you, but something went wrong. Can you repeat that?";
  }
}

// 🌐 Main webhook route for Dialogflow
app.post("/chat", async (req, res) => {
  try {
    const userMessage =
      req.body.queryResult?.queryText ||
      req.body.text ||
      "Hello, how are you feeling today?";

    // Extract knowledge base response if available
    const kbAnswer =
      req.body.queryResult?.fulfillmentMessages?.[0]?.text?.text?.[0] || "";

    // Construct a more emotional prompt for Phi
    const prompt =
      kbAnswer && kbAnswer.length > 0
        ? `The user said: "${userMessage}". The knowledge base suggests this: "${kbAnswer}". 
           Please rephrase it naturally in a warm, compassionate, and emotionally supportive tone, like a caring companion.`
        : `The user said: "${userMessage}". Respond kindly, empathetically, and helpfully, like a thoughtful mental health companion.`;

    console.log("💬 User:", userMessage);
    if (kbAnswer) console.log("📘 KB Answer:", kbAnswer);

    const botReply = await queryPhi(prompt);
    console.log("🤖 Phi-2 Reply:", botReply);

    res.json({
      fulfillmentText: botReply,
    });
  } catch (error) {
    console.error("⚠️ Webhook Error:", error);
    res.json({
      fulfillmentText:
        "I'm here for you, but I’m having trouble responding right now. Could you try again?",
    });
  }
});

// 🌱 Health check (for Render keep-alive)
app.get("/", (req, res) => {
  res.send("🌿 Mind Companion API is alive and well — powered by Phi-2 💫");
});

// 🛠 Start server on Render-assigned port
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running and listening on port ${PORT}`);
});
