import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// 💬 Function to query Phi-2 on Hugging Face
async function queryPhi(prompt) {
  const url = "https://api-inference.huggingface.co/models/microsoft/phi-2?wait_for_model=true";
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

  // Try once, retry after 5 seconds if model is still loading
  let res = await fetch(url, { method: "POST", headers, body });
  let text = await res.text();

  if (text.startsWith("Not Found")) {
    console.warn("⚠️ Model warming up… retrying in 5 seconds.");
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

// 🌐 Main webhook route for Dialogflow