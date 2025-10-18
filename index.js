import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

// Base endpoint for Dialogflow webhook
app.post("/chat", async (req, res) => {
  try {
    const userMessage =
      req.body?.queryResult?.queryText ||
      req.body?.text ||
      "Hello, I’m feeling off today.";

    console.log("💬 User:", userMessage);

    const hfResponse = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/phi-2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `User: ${userMessage}\nAI:`,
          parameters: {
            max_new_tokens: 120,
            temperature: 0.7,
            top_p: 0.9,
            do_sample: true,
          },
        }),
      }
    );

    let botReply = "I'm here for you. Tell me more about that.";

    try {
      const data = await hfResponse.json();

      if (Array.isArray(data) && data[0]?.generated_text) {
        botReply = data[0].generated_text
          .split("AI:")[1]
          ?.trim()
          ?.replace(/(?:\r\n|\r|\n)/g, " ")
          || botReply;
      } else if (data.error) {
        console.error("💥 HF API Error:", data.error);
        botReply = "I'm having a bit of trouble connecting to my model.";
      }
    } catch (parseErr) {
      console.error("❌ JSON Parse Error:", parseErr);
    }

    console.log("🤖 Reply:", botReply);

    res.json({
      fulfillmentText: botReply,
    });
  } catch (err) {
    console.error("🔥 Server Error:", err);
    res.json({
      fulfillmentText:
        "I'm here for you, but I'm having trouble responding right now.",
    });
  }
});

// Keep Render instance alive
app.get("/", (req, res) => {
  res.send("Mind Companion AI (Phi-2) is live ✨");
});

app.listen(3000, () => console.log("🚀 Server running on port 3000"));