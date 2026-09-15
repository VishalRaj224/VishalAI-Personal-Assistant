const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

const target = `      match /activityLogs/{logId} {
        allow read, write: if isValidId(userId) && isValidId(logId) && isOwner(userId);
      }`;
      
const replace = target + `
      match /conversations/{conversationId} {
        allow read, write: if isValidId(userId) && isValidId(conversationId) && isOwner(userId);
      }
      match /conversations/{conversationId}/messages/{messageId} {
        allow read, write: if isValidId(userId) && isValidId(conversationId) && isValidId(messageId) && isOwner(userId);
      }`;

code = code.replace(target, replace);
fs.writeFileSync('firestore.rules', code);
console.log("Updated firestore.rules");
