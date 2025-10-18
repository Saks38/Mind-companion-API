import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const HF_TOKEN = process.env.HF_TOKEN;

const models = [
  "https://api-inference.huggingface.co/models/SamLowe/roberta-base-go_emotions",
  "https://api-inference.huggingface.co/models/microsoft/DialoGPT-small"
];

async function pingModel(modelUrl) {
  try {
    const res = await fetch(modelUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: "keep alive" })
    });
    console.log(`✅ Warmed: ${modelUrl}`);
  } catch (err) {
    console.log(`⚠️ Failed to ping ${modelUrl}:`, err.message);
  }
}

setInterval(() => {
  models.forEach(pingModel);
}, 180000); // every 3 minutes
