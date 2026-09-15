const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// The endpoint starts from '// Logo Upload & Resize Endpoint' and ends before 'const app = express();'
const endpointStart = code.indexOf('// Logo Upload & Resize Endpoint');
const appDecl = code.indexOf('const app = express();');

if (endpointStart !== -1 && appDecl !== -1 && endpointStart < appDecl) {
    const endpointStr = code.slice(endpointStart, appDecl);
    code = code.slice(0, endpointStart) + code.slice(appDecl);
    
    // Now find app.use(express.json
    const jsonIndex = code.indexOf('app.use(express.json(');
    const endJsonIndex = code.indexOf(';', jsonIndex) + 1;
    
    code = code.slice(0, endJsonIndex) + '\n\n' + endpointStr + code.slice(endJsonIndex);
    fs.writeFileSync('server.ts', code);
    console.log("Fixed server.ts");
}
