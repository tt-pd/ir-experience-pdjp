const { calcRevenuePerSecond, calcLoss, calcPathTotal, formatJPY } = require("./calc.js");

// scenario.js は module.exports がないので動的 import で読み込む
// Bun では eval() がブロックスコープに閉じるため globalThis に代入する方式を使う
const fs = require("fs");
const scenarioCode = fs.readFileSync("./scenario.js", "utf8")
  .replace(/^const SCENARIO/, "globalThis.SCENARIO");
eval(scenarioCode);

// ─────────────────────────────────────
// ユーティリティ
// ─────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(label, actual, expected) {
  if (actual === expected) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    console.error(`    expected: ${expected}`);
    console.error(`    actual:   ${actual}`);
    failed++;
  }
}

function assertRange(label, actual, min, max) {
  if (actual >= min && actual <= max) {
    console.log(`  ✓ ${label} (${actual})`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    console.error(`    expected: ${min} ~ ${max}`);
    console.error(`    actual:   ${actual}`);
    failed++;
  }
}

// ─────────────────────────────────────
// テスト
// ─────────────────────────────────────

console.log("\n[1] calcRevenuePerSecond");
{
  const rps = calcRevenuePerSecond(100_000_000_000); // 1000億円
  // 100,000,000,000 / 31,536,000 = 3,170.97...  → 3,171
  assert("1000億円 → 3,171円/秒", rps, 3_171);
}

console.log("\n[2] calcLoss");
{
  const rps = 3_171;
  assert("1分の損失 = 60 × 3171 = 190,260円", calcLoss(1, rps), 190_260);
  assert("32分の損失 = 32 × 190,260 = 6,088,320円", calcLoss(32, rps), 6_088_320);
}

console.log("\n[3] formatJPY");
{
  assert("0円", formatJPY(0), "¥0");
  assert("9,999円", formatJPY(9_999), "¥9,999");
  assert("1万円", formatJPY(10_000), "約1万円");
  assert("608万円", formatJPY(6_088_320), "約608万円");
  assert("1億円ちょうど", formatJPY(100_000_000), "約1億円");
  assert("1億500万円", formatJPY(105_000_000), "約1億500万円");
  assert("5652万円", formatJPY(56_520_900), "約5652万円");
}

console.log("\n[4] シナリオ: 全選択肢に minutes が存在する");
{
  for (const [sceneId, scene] of Object.entries(SCENARIO.scenes)) {
    if (scene.isRepair) continue;
    scene.choices.forEach((choice, i) => {
      assert(
        `${sceneId} choice[${i}] (${choice.quality}) に minutes がある`,
        typeof choice.minutes,
        "number"
      );
      assert(
        `${sceneId} choice[${i}].minutes > 0`,
        choice.minutes > 0,
        true
      );
    });
  }
}

console.log("\n[5] シナリオ: best <= okay <= bad の順に minutes が小さい");
{
  for (const [sceneId, scene] of Object.entries(SCENARIO.scenes)) {
    if (scene.isRepair) continue;
    const byQuality = { best: null, okay: null, bad: null };
    scene.choices.forEach(c => { byQuality[c.quality] = c.minutes; });
    if (byQuality.best && byQuality.okay) {
      assert(
        `${sceneId}: best(${byQuality.best}) <= okay(${byQuality.okay})`,
        byQuality.best <= byQuality.okay,
        true
      );
    }
    if (byQuality.okay && byQuality.bad) {
      assert(
        `${sceneId}: okay(${byQuality.okay}) <= bad(${byQuality.bad})`,
        byQuality.okay <= byQuality.bad,
        true
      );
    }
  }
}

console.log("\n[6] calcPathTotal: 全bestルート vs 全badルート");
{
  const rps = calcRevenuePerSecond(SCENARIO.meta.revenuePerYear);

  // Scene 1→2の分岐があるので best ルートは scene_01[0] → scene_02_best[0] → scene_03[0] → scene_04[0]
  // choiceIndices = [0, 0, 0, 0] で best を選び続ける
  const bestPath = calcPathTotal(SCENARIO, [0, 0, 0, 0]);
  const badPath  = calcPathTotal(SCENARIO, [2, 2, 2, 2]);

  console.log(`  全best: ${bestPath.minutes}分 / ${formatJPY(bestPath.loss)}`);
  console.log(`  全bad:  ${badPath.minutes}分 / ${formatJPY(badPath.loss)}`);

  assert("全badは全bestより時間がかかる", badPath.minutes > bestPath.minutes, true);
  assert("全badは全bestより損失が大きい", badPath.loss > bestPath.loss, true);

  // best: 25+28+75+90 = 218分
  assert("全best 累積分数 = 218分", bestPath.minutes, 218);
  // bad:  40+48+110+125 = 323分
  assert("全bad 累積分数 = 323分", badPath.minutes, 323);
}

// ─────────────────────────────────────
// 結果
// ─────────────────────────────────────
console.log(`\n${"─".repeat(40)}`);
console.log(`  ${passed + failed} tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
