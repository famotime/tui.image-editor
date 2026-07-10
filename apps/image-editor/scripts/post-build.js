const fs = require('fs');
const path = require('path');

// 需追加的 ESM 默认导出语句，用以使 Rollup 正确分析依赖
const appendStr = '\nexport default module.exports;';

const files = [
  path.resolve(__dirname, '../dist/tui-image-editor.js'),
  path.resolve(__dirname, '../dist/tui-image-editor.min.js')
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    // 如果已经追加过，则不重复追加
    if (!content.includes('export default module.exports;')) {
      content += appendStr;
      fs.writeFileSync(file, content, 'utf8');
      console.log(`[post-build] 自动追加 ESM 默认导出至 ${path.basename(file)}`);
    }
  } else {
    console.warn(`[post-build] 未找到目标打包产物文件: ${file}`);
  }
});
