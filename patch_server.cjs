const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Add express body parser if not exists (express.json({limit: '50mb'}))
if (!code.includes('limit: "50mb"')) {
    code = code.replace('app.use(express.json());', 'app.use(express.json({ limit: "50mb" }));');
}

// Add sharp import
if (!code.includes('import sharp from "sharp"')) {
    code = code.replace('import dotenv from "dotenv";', 'import dotenv from "dotenv";\nimport sharp from "sharp";\nimport fsPromises from "fs/promises";');
}

// Add endpoint
const endpoint = `
  // Logo Upload & Resize Endpoint
  app.post("/api/upload-logo", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) return res.status(400).json({ error: "Missing image" });
      
      const base64Data = imageBase64.replace(/^data:image\\/\\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      
      const publicDir = path.join(process.cwd(), "public");
      const iconDir = path.join(publicDir, "assets", "icons");
      
      // Ensure directories exist
      await fsPromises.mkdir(iconDir, { recursive: true });
      
      // Save primary logo
      await fsPromises.writeFile(path.join(iconDir, "logo.png"), buffer);
      
      // Generate PWA icons using sharp
      const img = sharp(buffer);
      await img.resize(64, 64).toFile(path.join(publicDir, "pwa-64x64.png"));
      await img.resize(192, 192).toFile(path.join(publicDir, "pwa-192x192.png"));
      await img.resize(512, 512).toFile(path.join(publicDir, "pwa-512x512.png"));
      await img.resize(512, 512).toFile(path.join(publicDir, "maskable-icon-512x512.png"));
      await img.resize(180, 180).toFile(path.join(publicDir, "apple-touch-icon-180x180.png"));
      await img.resize(64, 64).toFile(path.join(publicDir, "favicon.ico")); // Fallback favicon as png
      
      res.json({ success: true });
    } catch (err) {
      console.error("Logo upload failed:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  });
`;

if (!code.includes('/api/upload-logo')) {
    code = code.replace('async function startServer() {', 'async function startServer() {\n' + endpoint);
}

fs.writeFileSync('server.ts', code);
console.log("Server patched");
