// 計算ロジック（index.html・build.js・テストから共用）

/**
 * 年商から秒あたりの損失額を計算する
 * @param {number} revenuePerYear - 年商（円）
 * @returns {number} 秒あたりの損失額（円、四捨五入）
 */
function calcRevenuePerSecond(revenuePerYear) {
  return Math.round(revenuePerYear / (365 * 24 * 3600));
}

/**
 * 経過分数から損失額を計算する
 * @param {number} minutes - 経過分数
 * @param {number} revenuePerSecond - 秒あたりの損失額（円）
 * @returns {number} 損失額（円）
 */
function calcLoss(minutes, revenuePerSecond) {
  return minutes * 60 * revenuePerSecond;
}

/**
 * シナリオの全選択肢パスごとの累積損失・累積分数を計算する
 * @param {object} scenario - SCENARIO オブジェクト
 * @param {string[]} choiceIndices - 各シーンでの選択インデックス（0/1/2）の配列
 * @returns {{ minutes: number, loss: number }}
 */
function calcPathTotal(scenario, choiceIndices) {
  const rps = calcRevenuePerSecond(scenario.meta.revenuePerYear);
  let sceneId = scenario.start;
  let totalMinutes = 0;
  let totalLoss = 0;
  let step = 0;

  while (sceneId) {
    const scene = scenario.scenes[sceneId];
    if (!scene || scene.isRepair) break;

    const idx = choiceIndices[step] ?? 0;
    const choice = scene.choices[idx];
    if (!choice) break;

    totalMinutes += choice.minutes;
    totalLoss += calcLoss(choice.minutes, rps);
    sceneId = choice.next;
    step++;
  }

  return { minutes: totalMinutes, loss: totalLoss };
}

/**
 * 金額を日本語桁区切りでフォーマットする
 * @param {number} n - 金額（円）
 * @returns {string}
 */
function formatJPY(n) {
  if (n >= 100_000_000) {
    const oku = Math.floor(n / 100_000_000);
    const man = Math.floor((n % 100_000_000) / 10_000);
    return man > 0
      ? `約${oku}億${man}万円`
      : `約${oku}億円`;
  } else if (n >= 10_000) {
    const man = Math.floor(n / 10_000);
    return `約${man}万円`;
  }
  return `¥${n.toLocaleString("ja-JP")}`;
}

// Node / Bun 環境ではエクスポート、ブラウザでは無視
if (typeof module !== "undefined") {
  module.exports = { calcRevenuePerSecond, calcLoss, calcPathTotal, formatJPY };
}
