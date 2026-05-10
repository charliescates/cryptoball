import fs from "node:fs";
import path from "node:path";

function createRng(seed = 123456789) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const ATTEMPTS_PER_TEAM = 20;
const MATCHES_PER_SCENARIO = 200;
const STAT_VALUES = [180, 240, 300, 360, 420];

function simulateMatch({ homeAttack, homeDefense, awayAttack, awayDefense, scoreFn, rng }) {
  let homeGoals = 0;
  let awayGoals = 0;

  for (let i = 0; i < ATTEMPTS_PER_TEAM; i++) {
    const randomIntHome = Math.floor(rng() * 100);
    const randomIntAway = Math.floor(rng() * 100);

    homeGoals += scoreFn({ attack: homeAttack, defense: awayDefense, randomInt: randomIntHome });
    awayGoals += scoreFn({ attack: awayAttack, defense: homeDefense, randomInt: randomIntAway });
  }

  return { homeGoals, awayGoals };
}

function runAggregate({ scoreFn, rng }) {
  let scenarioCount = 0;
  let avgTotalGoalsSum = 0;
  let closeDrawRateSum = 0;
  let closeScenarioCount = 0;
  let homeDominantConvSum = 0;
  let homeDominantCount = 0;

  for (const homeAttack of STAT_VALUES) {
    for (const homeDefense of STAT_VALUES) {
      for (const awayAttack of STAT_VALUES) {
        for (const awayDefense of STAT_VALUES) {
          scenarioCount++;

          let homeGoalsTotal = 0;
          let awayGoalsTotal = 0;
          let homeWins = 0;
          let draws = 0;

          for (let m = 0; m < MATCHES_PER_SCENARIO; m++) {
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
          }

          const avgTotalGoals = (homeGoalsTotal + awayGoalsTotal) / MATCHES_PER_SCENARIO;
          const drawRate = draws / MATCHES_PER_SCENARIO;
          const homeWinRate = homeWins / MATCHES_PER_SCENARIO;
          avgTotalGoalsSum += avgTotalGoals;

          const isCloseScenario =
            Math.abs(homeAttack - awayAttack) <= 60 &&
            Math.abs(homeDefense - awayDefense) <= 60;
          if (isCloseScenario) {
            closeDrawRateSum += drawRate;
            closeScenarioCount++;
          }

          const isHomeDominant =
            homeAttack >= awayAttack &&
            homeDefense >= awayDefense &&
            (homeAttack > awayAttack || homeDefense > awayDefense);
          if (isHomeDominant) {
            homeDominantConvSum += homeWinRate;
            homeDominantCount++;
          }
        }
      }
    }
  }

  return {
    scenarioCount,
    avgTotalGoals: avgTotalGoalsSum / scenarioCount,
    closeGameDrawRate: closeDrawRateSum / closeScenarioCount,
    homeDominantConversion: homeDominantConvSum / homeDominantCount,
    closeScenarioCount,
    homeDominantCount,
  };
}

function makeFormula({ linearWeight, quadraticWeight, minChance, scale }) {
  return ({ attack, defense, randomInt }) => {
    const total = attack + defense;
    if (total === 0) return 0;

    const linearChance = Math.floor((attack * 100) / total);
    const attackSq = attack * attack;
    const defenseSq = defense * defense;
    const quadraticChance = Math.floor((attackSq * 100) / (attackSq + defenseSq));

    const blendedChance = Math.floor(
      (linearChance * linearWeight + quadraticChance * quadraticWeight) /
      (linearWeight + quadraticWeight)
    );

    const chanceOfScoring = minChance + Math.floor((blendedChance * scale) / 100);
    return randomInt < chanceOfScoring ? 1 : 0;
  };
}

function main() {
  const targetGoals = 7.35;
  const targetCloseDraw = 0.10;
  const targetDominantConv = 0.70;
  const rows = [];

  const weightPairs = [
    [75, 25],
    [70, 30],
    [65, 35],
    [60, 40],
    [55, 45],
    [50, 50],
    [45, 55],
    [40, 60],
    [35, 65],
    [30, 70],
  ];
  const minChances = [0, 1, 2, 3, 4, 5, 6, 8, 10];
  const scales = [24, 28, 32, 36, 40, 44, 48, 52];

  for (const [linearWeight, quadraticWeight] of weightPairs) {
    for (const minChance of minChances) {
      for (const scale of scales) {
        const midpoint = minChance + scale / 2;
        if (midpoint < 14 || midpoint > 38) continue;

        const rng = createRng(42);
        const scoreFn = makeFormula({ linearWeight, quadraticWeight, minChance, scale });
        const agg = runAggregate({ scoreFn, rng });

        const goalDelta = Math.abs(agg.avgTotalGoals - targetGoals);
        const closeDrawDelta = Math.abs(agg.closeGameDrawRate - targetCloseDraw);
        const dominantDelta = Math.abs(agg.homeDominantConversion - targetDominantConv);
        const targetScore = closeDrawDelta * 0.60 + dominantDelta * 0.35 + goalDelta * 0.05;

        rows.push({
          linearWeight,
          quadraticWeight,
          minChance,
          maxChance: minChance + scale,
          scale,
          midpoint: midpoint.toFixed(2),
          avgTotalGoals: agg.avgTotalGoals.toFixed(3),
          closeGameDrawRate: agg.closeGameDrawRate.toFixed(4),
          homeDominantConversion: agg.homeDominantConversion.toFixed(4),
          goalDelta: goalDelta.toFixed(3),
          closeDrawDelta: closeDrawDelta.toFixed(4),
          dominantDelta: dominantDelta.toFixed(4),
          targetScore: targetScore.toFixed(4),
        });
      }
    }
  }

  rows.sort((a, b) => {
    if (a.targetScore !== b.targetScore) return Number(a.targetScore) - Number(b.targetScore);
    if (a.closeDrawDelta !== b.closeDrawDelta) return Number(a.closeDrawDelta) - Number(b.closeDrawDelta);
    return Number(a.dominantDelta) - Number(b.dominantDelta);
  });

  const outDir = path.resolve("analysis");
  fs.mkdirSync(outDir, { recursive: true });

  const allPath = path.join(outDir, "blended_param_search.csv");
  const topPath = path.join(outDir, "blended_param_search_top10.csv");

  const headers = Object.keys(rows[0]);
  const toCsv = (dataset) => {
    const lines = [headers.join(",")];
    for (const row of dataset) {
      lines.push(headers.map((h) => row[h]).join(","));
    }
    return `${lines.join("\n")}\n`;
  };

  fs.writeFileSync(allPath, toCsv(rows), "utf8");

  const filtered = rows
    .filter((r) => Number(r.avgTotalGoals) >= 6.0 && Number(r.avgTotalGoals) <= 20.0)
    .sort((a, b) => {
      if (a.targetScore !== b.targetScore) return Number(a.targetScore) - Number(b.targetScore);
      if (a.closeDrawDelta !== b.closeDrawDelta) return Number(a.closeDrawDelta) - Number(b.closeDrawDelta);
      return Number(a.dominantDelta) - Number(b.dominantDelta);
    })
    .slice(0, 10);

  fs.writeFileSync(topPath, toCsv(filtered), "utf8");

  console.log(`Wrote ${rows.length} rows to ${allPath}`);
  console.log(`Wrote ${filtered.length} rows to ${topPath}`);
}

main();
