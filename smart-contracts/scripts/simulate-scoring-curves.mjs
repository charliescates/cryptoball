import fs from "node:fs";
import path from "node:path";

// Reproducible RNG (LCG)
function createRng(seed = 123456789) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const ATTEMPTS_PER_TEAM = 20;
const EXTRA_TIME_ATTEMPTS = 5;
const MATCHES_PER_SCENARIO = 2000;
const STAT_VALUES = [180, 240, 300, 360, 420];

const formulas = {
  // Matches legacy contract behavior exactly (integer rounding semantics)
  legacy_base60: ({ attack, defense, randomInt }) => {
    const total = attack + defense;
    if (total === 0) return 0;
    const chanceOfScoringThreshold = 60 + Math.floor((defense * 40) / total);
    return randomInt > chanceOfScoringThreshold ? 1 : 0;
  },

  // Direct linear ratio (no base)
  linear_ratio: ({ attack, defense, randomFloat }) => {
    const total = attack + defense;
    if (total === 0) return 0;
    const p = attack / total;
    return randomFloat < p ? 1 : 0;
  },

  // Pure quadratic ratio
  quadratic_ratio: ({ attack, defense, randomFloat }) => {
    const attackSq = attack * attack;
    const defenseSq = defense * defense;
    const totalSq = attackSq + defenseSq;
    if (totalSq === 0) return 0;
    const p = attackSq / totalSq;
    return randomFloat < p ? 1 : 0;
  },

  // Current blended formula in Game.sol
  blended_22_78: ({ attack, defense, randomInt }) => {
    const total = attack + defense;
    if (total === 0) return 0;

    const linearChance = Math.floor((attack * 100) / total);
    const attackSq = attack * attack;
    const defenseSq = defense * defense;
    const quadraticChance = Math.floor((attackSq * 100) / (attackSq + defenseSq));
    const blendedChance = Math.floor((linearChance * 75 + quadraticChance * 25) / 100);
    const chanceOfScoring = 22 + Math.floor((blendedChance * 56) / 100);

    return randomInt < chanceOfScoring ? 1 : 0;
  },

  // Alternate softer clamp option for comparison
  blended_25_75: ({ attack, defense, randomInt }) => {
    const total = attack + defense;
    if (total === 0) return 0;

    const linearChance = Math.floor((attack * 100) / total);
    const attackSq = attack * attack;
    const defenseSq = defense * defense;
    const quadraticChance = Math.floor((attackSq * 100) / (attackSq + defenseSq));
    const blendedChance = Math.floor((linearChance * 75 + quadraticChance * 25) / 100);
    const chanceOfScoring = 25 + Math.floor((blendedChance * 50) / 100);

    return randomInt < chanceOfScoring ? 1 : 0;
  },

  // Low-scoring blended option: keeps blended shape but reduces absolute goal rates.
  blended_04_34: ({ attack, defense, randomInt }) => {
    const total = attack + defense;
    if (total === 0) return 0;

    const linearChance = Math.floor((attack * 100) / total);
    const attackSq = attack * attack;
    const defenseSq = defense * defense;
    const quadraticChance = Math.floor((attackSq * 100) / (attackSq + defenseSq));
    const blendedChance = Math.floor((linearChance * 75 + quadraticChance * 25) / 100);
    const chanceOfScoring = 4 + Math.floor((blendedChance * 30) / 100);

    return randomInt < chanceOfScoring ? 1 : 0;
  },

  // Candidate tuned for lower close-game draws and higher dominant conversion
  // while preserving low average scoring.
  blended_02_36_w70_30: ({ attack, defense, randomInt }) => {
    const total = attack + defense;
    if (total === 0) return 0;

    const linearChance = Math.floor((attack * 100) / total);
    const attackSq = attack * attack;
    const defenseSq = defense * defense;
    const quadraticChance = Math.floor((attackSq * 100) / (attackSq + defenseSq));
    const blendedChance = Math.floor((linearChance * 70 + quadraticChance * 30) / 100);
    const chanceOfScoring = 2 + Math.floor((blendedChance * 34) / 100);

    return randomInt < chanceOfScoring ? 1 : 0;
  },

  // Current contract candidate: stronger nonlinear weighting with wider clamp.
  blended_10_62_w40_60: ({ attack, defense, randomInt }) => {
    const total = attack + defense;
    if (total === 0) return 0;

    const linearChance = Math.floor((attack * 100) / total);
    const attackSq = attack * attack;
    const defenseSq = defense * defense;
    const quadraticChance = Math.floor((attackSq * 100) / (attackSq + defenseSq));
    const blendedChance = Math.floor((linearChance * 40 + quadraticChance * 60) / 100);
    const chanceOfScoring = 10 + Math.floor((blendedChance * 52) / 100);

    return randomInt < chanceOfScoring ? 1 : 0;
  },
};

function simulateMatch({ homeAttack, homeDefense, awayAttack, awayDefense, scoreFn, rng }) {
  let homeGoals = 0;
  let awayGoals = 0;

  for (let i = 0; i < ATTEMPTS_PER_TEAM; i++) {
    const randomIntHome = Math.floor(rng() * 100);
    const randomIntAway = Math.floor(rng() * 100);

    homeGoals += scoreFn({
      attack: homeAttack,
      defense: awayDefense,
      randomInt: randomIntHome,
      randomFloat: randomIntHome / 100,
    });

    awayGoals += scoreFn({
      attack: awayAttack,
      defense: homeDefense,
      randomInt: randomIntAway,
      randomFloat: randomIntAway / 100,
    });
  }

  if (homeGoals === awayGoals) {
    for (let i = 0; i < EXTRA_TIME_ATTEMPTS; i++) {
      const randomIntHome = Math.floor(rng() * 100);
      const randomIntAway = Math.floor(rng() * 100);

      homeGoals += scoreFn({
        attack: homeAttack,
        defense: awayDefense,
        randomInt: randomIntHome,
        randomFloat: randomIntHome / 100,
      });

      awayGoals += scoreFn({
        attack: awayAttack,
        defense: homeDefense,
        randomInt: randomIntAway,
        randomFloat: randomIntAway / 100,
      });
    }

    if (homeGoals === awayGoals) {
      const homeStrength = homeAttack + homeDefense;
      const awayStrength = awayAttack + awayDefense;
      const totalStrength = homeStrength + awayStrength;
      const homeWinChance = totalStrength === 0 ? 0.5 : homeStrength / totalStrength;
      if (rng() < homeWinChance) {
        homeGoals += 1;
      } else {
        awayGoals += 1;
      }
    }
  }

  return { homeGoals, awayGoals };
}

function runScenario({ homeAttack, homeDefense, awayAttack, awayDefense, formulaName, scoreFn, rng }) {
  let homeGoalsTotal = 0;
  let awayGoalsTotal = 0;
  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  let blowouts3Plus = 0;

  for (let i = 0; i < MATCHES_PER_SCENARIO; i++) {
    const { homeGoals, awayGoals } = simulateMatch({
      homeAttack,
      homeDefense,
      awayAttack,
      awayDefense,
      scoreFn,
      rng,
    });

    homeGoalsTotal += homeGoals;
    awayGoalsTotal += awayGoals;

    if (homeGoals > awayGoals) homeWins++;
    else if (homeGoals === awayGoals) draws++;
    else awayWins++;

    if (Math.abs(homeGoals - awayGoals) >= 3) blowouts3Plus++;
  }

  const matches = MATCHES_PER_SCENARIO;
  const avgHomeGoals = homeGoalsTotal / matches;
  const avgAwayGoals = awayGoalsTotal / matches;

  return {
    formula: formulaName,
    homeAttack,
    homeDefense,
    awayAttack,
    awayDefense,
    statGapAttack: homeAttack - awayAttack,
    statGapDefense: homeDefense - awayDefense,
    avgHomeGoals: avgHomeGoals.toFixed(3),
    avgAwayGoals: avgAwayGoals.toFixed(3),
    avgTotalGoals: (avgHomeGoals + avgAwayGoals).toFixed(3),
    homeWinRate: (homeWins / matches).toFixed(4),
    drawRate: (draws / matches).toFixed(4),
    awayWinRate: (awayWins / matches).toFixed(4),
    blowoutRate3Plus: (blowouts3Plus / matches).toFixed(4),
  };
}

function csvEscape(value) {
  const s = String(value);
  if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(rows) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];

  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  }

  return `${lines.join("\n")}\n`;
}

function main() {
  const rng = createRng(42);
  const rows = [];

  for (const [formulaName, scoreFn] of Object.entries(formulas)) {
    for (const homeAttack of STAT_VALUES) {
      for (const homeDefense of STAT_VALUES) {
        for (const awayAttack of STAT_VALUES) {
          for (const awayDefense of STAT_VALUES) {
            rows.push(
              runScenario({
                homeAttack,
                homeDefense,
                awayAttack,
                awayDefense,
                formulaName,
                scoreFn,
                rng,
              })
            );
          }
        }
      }
    }
  }

  const outDir = path.resolve("analysis");
  fs.mkdirSync(outDir, { recursive: true });

  const csvPath = path.join(outDir, "scoring_formula_simulation.csv");
  fs.writeFileSync(csvPath, toCsv(rows), "utf8");

  const summaryPath = path.join(outDir, "scoring_formula_summary.txt");
  const summary = [
    `Generated rows: ${rows.length}`,
    `Matches per scenario: ${MATCHES_PER_SCENARIO}`,
    `Attempts per team per match: ${ATTEMPTS_PER_TEAM}`,
    `Stat values: ${STAT_VALUES.join(", ")}`,
    `Formulas: ${Object.keys(formulas).join(", ")}`,
    `CSV: ${csvPath}`,
  ].join("\n");
  fs.writeFileSync(summaryPath, `${summary}\n`, "utf8");

  console.log(summary);
}

main();
