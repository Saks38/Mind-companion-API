import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_URL = "https://api-inference.huggingface.co/models/microsoft/Phi-3-mini-4k-instruct";
const HF_TOKEN = process.env.API; // 🔒 your Hugging Face token stored in .env
const MEMORY_LENGTH = 5;

let conversation = [];

// 🧠 Helper to build contextual prompt
function buildPrompt(userInput) {
  let history = "";
  for (let [user, ai] of conversation.slice(-MEMORY_LENGTH)) {
    history += `User: ${user}\nAI: ${ai}\n`;
  }
  return `
You are Aura, a compassionate emotional-support AI. 
You listen with empathy and respond briefly, calmly, and kindly.
Avoid talking about yourself or using links.
Here’s the recent chat:
${history}
User: ${userInput}
AI:`;
}

// 💬 Function to call Hugging Face Phi-3-mini
async function askPhi(prompt) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    const data = await response.json();

    if (Array.isArray(data) && data[0]?.generated_text) {
      return data[0].generated_text.trim();
    } else {
      return "I'm here for you. Tell me more about what’s on your mind.";
    }
  } catch (error) {
    console.error("⚠️ API Error:", error);
    return "Sorry, I had trouble connecting right now.";
  }
}

// 🧩 Endpoint for chat
app.post("/chat", async (req, res) => {
  const userInput = req.body.text || "";
  const prompt = buildPrompt(userInput);
  const reply = await askPhi(prompt);

  // Save message pair to memory
  conversation.push([userInput, reply]);
  res.json({ response: reply });
});

// Root route for testing
app.get("/", (req, res) => {
  res.send("🌿 Mental Health AI (Aura) is running successfully!");
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
