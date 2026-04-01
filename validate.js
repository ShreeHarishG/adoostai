/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process');
try {
  const result = execSync('npx prisma validate', { encoding: 'utf8' });
  console.log('STDOUT\n', result);
} catch (e) {
  console.log('STDERR\n', e.stderr);
  console.log('STDOUT\n', e.stdout);
}
