import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// -------------------- CONFIG --------------------
const HF_API_URL =
  "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2?wait_for_model=true";
const HF_TOKEN = process.env.HF_API_KEY || process.env.HF_TOKEN;
const PORT = process.env.PORT || 10000;

// -------------------- SIMPLE MEMORY --------------------
const sessions = new Map();
const MEMORY_LEN = 6;

// -------------------- HELPERS --------------------
function ensureSession(id) {
  if (!sessions.has(id)) sessions.set(id, { memory: [], name: null });
  return sessions.get(id);
}

function pushMemory(id, role, text) {
  const s = ensureSession(id);
  s.memory.push({ role, text });
  if (s.memory.length > MEMORY_LEN) s.memory.shift();
}

function extractSessionId(raw) {
  if (!raw) return "anonymous";
  const parts = raw.split("/");
  return parts[parts.length - 1] || "anonymous";
}

function detectName(id, text) {
  const match = text.match(/\b(?:call me|my name is)\s+([A-Za-z0-9 _'-]{1,30})/i);
  if (match) {
    ensureSession(id).name = match[1].trim();
    console.log(`💡 Remembering user name for ${id}: ${match[1].trim()}`);
  }
}

function buildPrompt(id, userMessage) {
  const s = ensureSession(id);
  const namePart = s.name
    ? `The user's name is ${s.name}. Address them respectfully as ${s.name}. `
    : "";
  const history = s.memory.map(
    (m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`
  ).join("\n");

  return `
You are Sahaj, a warm and empathetic mental health companion.
Always speak in first person (say "I", not "Sahaj").
Respond with compassion, calmness, and care. Never give medical advice.
${namePart}
Conversation so far:
${history}

User: ${userMessage}
Assistant:
`.trim();
}

async function callMistral(prompt) {
  const headers = {
    Authorization: `Bearer ${HF_TOKEN}`,
    "Content-Type": "application/json",
  };

  const body = JSON.stringify({
    inputs: prompt,
    parameters: {
      max_new_tokens: 180,
      temperature: 0.7,
      top_p: 0.95,
      return_full_text: false,
    },
  });

  const res = await fetch(HF_API_URL, { method: "POST", headers, body });
  const txt = await res.text();

  if (txt.includes("loading")) {
    console.log("⚠️ Model warming up... retrying in 3s");
    await new Promise((r) => setTimeout(r, 3000));
    return callMistral(prompt);
  }

  try {
    const data = JSON.parse(txt);
    if (Array.isArray(data) && data[0]?.generated_text)
      return data[0].generated_text.trim();
    if (data.generated_text) return data.generated_text.trim();
    if (data.text) return data.text.trim();
  } catch (err) {
    console.warn("⚠️ Could not parse HF response:", txt.slice(0, 200));
  }

  return "I'm here for you. Let's take a deep breath together.";
}

// -------------------- ROUTES --------------------
app.post("/chat", async (req, res) => {
  try {
    const body = req.body || {};
    const rawSession = body.session || "";
    const sessionId = extractSessionId(rawSession);
    const userMessage =
      body.queryResult?.queryText ||
      body.text ||
      "Hello, how are you feeling today?";

    detectName(sessionId, userMessage);
    pushMemory(sessionId, "user", userMessage);

    const prompt = buildPrompt(sessionId, userMessage);
    const replyRaw = await callMistral(prompt);

    // small fix for first-person voice
    const reply = replyRaw
      .replace(/\b[Ss]ahaj is\b/g, "I am")
      .replace(/\b[Ss]ahaj\b/g, "I");

    pushMemory(sessionId, "assistant", reply);

    console.log("🤖 Reply:", reply);
    return res.json({ fulfillmentText: reply });
  } catch (err) {
    console.error("⚠️ Error:", err);
    return res.json({
      fulfillmentText:
        "I'm here for you, but I’m having trouble responding right now. Could you try again in a moment?",
    });
  }
});

app.get("/", (req, res) => {
  res.send("🌿 Sahaj API is alive — powered by Mistral 💫");
});

app.listen(PORT, () => {
  console.log(`✅ Sahaj server live on port ${PORT}`);
});
