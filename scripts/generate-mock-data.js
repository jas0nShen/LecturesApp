const fs = require('node:fs');
const path = require('node:path');
const seed = require('../data/seed.json');

const target = path.join(__dirname, '..', 'miniprogram', 'utils', 'mockData.js');
const contents = `// Generated from data/seed.json by npm run sync:data. Do not edit manually.\n`
  + `const data = ${JSON.stringify(seed, null, 2)};\n\n`
  + 'module.exports = data;\n';

fs.writeFileSync(target, contents);
console.log(`Synced ${seed.courses.length} courses to miniprogram fallback data`);
