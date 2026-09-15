const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const streamingEndpoint = `
  // ---------------------------------------------------------
  // 2.5 Multi-Turn Gemini Chatbot (Streaming)
  // ---------------------------------------------------------
  app.post("/api/gemini-chat-stream", async (req, res) => {
    try {
      const { message, history = [], model = "gemini-3.5-flash", systemInstruction } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ error: "Message is required" });
      }

      const allowedModels = ["gemini-3.1-pro-preview", "gemini-3.5-flash", "gemini-3.1-flash-lite"];
      const targetModel = allowedModels.includes(model) ? model : "gemini-3.5-flash";

      const defaultInstruction = "You are Vishal AI, a powerful and helpful AI assistant. You provide clean, markdown-formatted responses with syntax highlighting for code blocks.";
      const finalInstruction = systemInstruction || defaultInstruction;

      const ai = getAi();
      if (!ai) {
        return res.status(503).json({ error: "AI Client not initialized" });
      }

      const contents = [];
      for (const item of history.slice(-20)) {
        contents.push({
          role: item.role === "assistant" || item.role === "model" ? "model" : "user",
          parts: [{ text: item.text }],
        });
      }
      contents.push({
        role: "user",
        parts: [{ text: message }],
      });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      try {
        const responseStream = await ai.models.generateContentStream({
          model: targetModel,
          contents,
          config: {
            systemInstruction: finalInstruction,
            temperature: 0.7,
          },
        });

        for await (const chunk of responseStream) {
          if (chunk.text) {
            res.write(\`data: \${JSON.stringify({ text: chunk.text })}\\n\\n\`);
          }
        }
        res.write("data: [DONE]\\n\\n");
        res.end();
      } catch (err) {
        console.error("Stream generation error:", err);
        res.write(\`data: \${JSON.stringify({ error: err.message })}\\n\\n\`);
        res.end();
      }
    } catch (err) {
      console.error(err);
      if (!res.headersSent) res.status(500).json({ error: err.message });
      else res.end();
    }
  });
`;

if (!code.includes('/api/gemini-chat-stream')) {
    code = code.replace('  // ---------------------------------------------------------', streamingEndpoint + '\n  // ---------------------------------------------------------');
    fs.writeFileSync('server.ts', code);
    console.log("Streaming endpoint added");
}
