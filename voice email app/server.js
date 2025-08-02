require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const OpenAI = require("openai");

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// Initialize OpenAI with new syntax
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Route to handle formatting email
app.post("/api/openai", async (req, res) => {
  const { prompt } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that turns raw spoken messages into professional, polite, well-formatted emails. Add closing lines and contact info.",
        },
        {
          role: "user",
          content: `Format this into a professional email:\n${prompt}\n\nName: Jayden\nEmail: jayden@email.com\nPhone: +27 123 456 7890`,
        },
      ],
    });

    const formattedText = completion.choices[0].message.content;
    res.json({ formattedText });
  } catch (error) {
    console.error("❌ AI formatting failed:", error.message);
    res.status(500).json({ error: "AI formatting failed" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
