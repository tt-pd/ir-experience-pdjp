#!/usr/bin/env node
// scenario.js を index.html にインライン化して dist/index.html を生成する

const fs = require("fs");
const path = require("path");

const srcHtml = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const srcScenario = fs.readFileSync(path.join(__dirname, "scenario.js"), "utf8");

// <script src="scenario.js"></script> をインライン化
const result = srcHtml.replace(
  '<script src="scenario.js"></script>',
  `<script>\n${srcScenario}\n</script>`
);

const distDir = path.join(__dirname, "dist");
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

fs.writeFileSync(path.join(distDir, "index.html"), result, "utf8");
console.log("✓ dist/index.html を生成しました");
