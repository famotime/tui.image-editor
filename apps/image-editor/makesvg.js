/* eslint-disable */
const fs = require('fs');
const path = require('path');
const svgstore = require('svgstore');

const svgDir = path.resolve(__dirname, 'src/svg');
const outDir = path.resolve(__dirname, 'dist/svg');

fs.mkdirSync(outDir, { recursive: true });

function processDir(dirName) {
  const targetDir = path.join(svgDir, dirName);
  if (!fs.statSync(targetDir).isDirectory()) {
    return;
  }
  const sprites = svgstore();
  const files = fs.readdirSync(targetDir);
  files.forEach((file) => {
    if (file.match(/^\./) || !file.endsWith('.svg')) {
      return;
    }
    const id = `${dirName}-${file.replace(/\.svg$/, '')}`;
    const svg = fs.readFileSync(path.join(targetDir, file));
    sprites.add(id, svg);
  });
  fs.writeFileSync(path.join(outDir, `${dirName}.svg`), sprites.toString());
}

if (fs.existsSync(svgDir)) {
  const dirs = fs.readdirSync(svgDir);
  dirs.forEach((dirName) => {
    processDir(dirName);
  });
}
