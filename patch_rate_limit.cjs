const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const rateLimiter = `
const requestCounts = new Map();
setInterval(() => requestCounts.clear(), 60 * 1000); // Clear every minute

function checkRateLimit(ip) {
  const count = requestCounts.get(ip) || 0;
  if (count >= 15) return false; // Max 15 messages per minute per IP
  requestCounts.set(ip, count + 1);
  return true;
}
`;

if (!code.includes('checkRateLimit(ip)')) {
    code = code.replace('const PORT = 3000;', 'const PORT = 3000;\n\n' + rateLimiter);
}

const checkInStream = `      if (!message || !message.trim()) {
        return res.status(400).json({ error: "Message is required" });
      }`;
      
const replaceInStream = `      if (!message || !message.trim()) {
        return res.status(400).json({ error: "Message is required" });
      }
      
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      if (!checkRateLimit(clientIp)) {
        return res.status(429).json({ error: "Too many requests. Please wait a moment." });
      }`;

if (!code.includes('checkRateLimit(clientIp)')) {
    code = code.replace(checkInStream, replaceInStream);
    fs.writeFileSync('server.ts', code);
    console.log("Added rate limiter");
}
