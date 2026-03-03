const { execSync } = require('child_process');
const fs = require('fs');

try {
  const result = execSync('npx prisma db push --accept-data-loss', { encoding: 'utf-8', stdio: 'pipe' });
  fs.writeFileSync('push_success.txt', result);
} catch (e) {
  const errOutput = e.stderr ? e.stderr.toString() : e.message;
  const outOutput = e.stdout ? e.stdout.toString() : '';
  fs.writeFileSync('push_error.txt', `STDERR:\n${errOutput}\n\nSTDOUT:\n${outOutput}`);
}
