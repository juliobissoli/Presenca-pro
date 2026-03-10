const { spawn } = require('child_process');
const path = require('path');

const nextBin = path.join(__dirname, 'node_modules', '.bin', 'next');
console.log(`Starting Next.js on port 3000...`);

const child = spawn(nextBin, ['dev', '-p', '3000', '--hostname', '0.0.0.0'], { 
  stdio: 'inherit', 
  shell: true,
  env: { ...process.env, NODE_ENV: 'development' }
});

child.on('error', (err) => {
  console.error('Failed to start child process.', err);
});
