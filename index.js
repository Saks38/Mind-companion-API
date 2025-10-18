import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

app.post("/chat", async (req, res) => {
  try {
    const userMessage =
      req.body?.queryResult?.queryText ||
      req.body?.text ||
      "Hello there, how are you feeling today?";

    console.log("💬 User:", userMessage);

    // Craft a richer context prompt
    const prompt = `
You are MindCompanion, an empathetic mental-health assistant.
Your goal is to give comforting, thoughtful, and supportive replies.
If the user asks for advice, gently provide perspective and coping ideas.

User: ${userMessage}
MindCompanion:`.trim();

    const hfResponse = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/phi-2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 180,
            temperature: 0.85,
            top_p: 0.95,
            do_sample: true
          }
        })
      }
    );

    let botReply = "I'm here for you. Tell me more about that.";

    try {
      const data = await hfResponse.json();

      if (Array.isArray(data) && data[0]?.generated_text) {
        const raw = data[0].generated_text;
        // Clean out everything before MindCompanion: and after next user line if any
        botReply = raw
          .split("MindCompanion:")[1]
          ?.split("User:")[0]
          ?.trim()
          ?.replace(/\s+/g, " ")
          || botReply;
      } else if (data.error) {
        console.error("💥 HF API Error:", data.error);
        botReply = "I'm having a bit of trouble connecting to my model right now.";
      }
    } catch (err) {
      console.error("❌ Parse error:", err);
    }

    console.log("🤖 Reply:", botReply);

    res.json({ fulfillmentText: botReply });
  } catch (err) {
    console.error("🔥 Server error:", err);
    res.json({
      fulfillmentText:
        "I'm here for you, but I'm having trouble responding right now."
    });
  }
});

app.get("/", (req, res) => {
  res.send("MindCompanion (Phi-2) is running smoothly ✨");
});

app.listen(3000, () => console.log("🚀 Server running on port 3000"));