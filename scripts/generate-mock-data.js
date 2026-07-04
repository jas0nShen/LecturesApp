const fs = require('node:fs');
const path = require('node:path');
const seed = require('../data/seed.json');
const hkuCdsOfferings = require('../data/hku-cds-offerings-2025.json');

const target = path.join(__dirname, '..', 'miniprogram', 'utils', 'mockData.js');
const contents = `// Generated from data/seed.json by npm run sync:data. Do not edit manually.\n`
  + `const data = ${JSON.stringify(seed, null, 2)};\n\n`
  + 'module.exports = data;\n';
const offeringsTarget = path.join(__dirname, '..', 'miniprogram', 'utils', 'hkuOfferings.js');
const offeringsContents = `// Generated from data/hku-cds-offerings-2025.json by npm run sync:data. Do not edit manually.\n`
  + `const data = ${JSON.stringify(hkuCdsOfferings, null, 2)};\n\n`
  + 'module.exports = data;\n';

fs.writeFileSync(target, contents);
fs.writeFileSync(offeringsTarget, offeringsContents);
console.log(`Synced ${seed.courses.length} curriculum courses and ${hkuCdsOfferings.courses.length} offerings`);
