const assert = require('node:assert/strict');
const test = require('node:test');
const { parseCourseDetail } = require('./import-hku-cds-details');

test('HKU course detail parser extracts credits, rules and description', () => {
  const html = `
    <td>No. of credit(s):</td><td width="15%">6</td>
    <td>Pre-requisite(s):</td><td colspan="4">COMP1117</td>
    <td>Co-requisite(s):</td><td colspan="4">&nbsp;</td>
    <td>Mutually exclusive with:</td><td colspan="4">ENGG1330</td>
    <u>Calendar Entry:</u><br>Learn useful things about computing.</p>
  `;
  assert.deepEqual(parseCourseDetail(html), {
    credits: 6,
    prerequisites: 'COMP1117',
    corequisites: 'None',
    exclusions: 'ENGG1330',
    description: 'Learn useful things about computing.'
  });
});
