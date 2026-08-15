const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const distDir = path.join(__dirname, 'dist');
if (\!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

execSync('npx tsc', { stdio: 'inherit' });
fs.copyFileSync(path.join(__dirname, 'index.html'), path.join(distDir, 'index.html'));
fs.copyFileSync(path.join(__dirname, 'style.css'), path.join(distDir, 'style.css'));
console.log('Build complete\!');
