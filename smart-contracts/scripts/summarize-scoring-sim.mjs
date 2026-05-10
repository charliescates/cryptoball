import fs from "node:fs";
import path from "node:path";

const inputPath = path.resolve("analysis/scoring_formula_simulation.csv");
const outputPath = path.resolve("analysis/scoring_formula_aggregate.csv");

function parseCsv(content) {
  const lines = content.trim().split(/\r?\n/);
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row = {};
    for (let i = 0; i < headers.length; i++) {
      row[headers[i]] = values[i];
    }
    return row;
  });
}

function num(v) {
  return Number(v);
}

function avg(values) {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function toCsv(rows) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => row[h]).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function main() {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input not found: ${inputPath}`);
  }

  const raw = fs.readFileSync(inputPath, "utf8");
  const rows = parseCsv(raw);

  const byFormula = new Map();
  for (const row of rows) {
    const formula = row.formula;
    if (!byFormula.has(formula)) byFormula.set(formula, []);
    byFormula.get(formula).push(row);
  }

  const aggregateRows = [];

  for (const [formula, formulaRows] of byFormula.entries()) {
    const closeRows = formulaRows.filter(
      (r) => Math.abs(num(r.statGapAttack)) <= 60 && Math.abs(num(r.statGapDefense)) <= 60
    );

    const homeDominantRows = formulaRows.filter((r) => {
      const homeAtk = num(r.homeAttack);
      const homeDef = num(r.homeDefense);
      const awayAtk = num(r.awayAttack);
      const awayDef = num(r.awayDefense);
      return homeAtk >= awayAtk && homeDef >= awayDef && (homeAtk > awayAtk || homeDef > awayDef);
    });

    const awayDominantRows = formulaRows.filter((r) => {
      const homeAtk = num(r.homeAttack);
      const homeDef = num(r.homeDefense);
      const awayAtk = num(r.awayAttack);
      const awayDef = num(r.awayDefense);
      return awayAtk >= homeAtk && awayDef >= homeDef && (awayAtk > homeAtk || awayDef > homeDef);
    });

    const agg = {
      formula,
      scenarioCount: formulaRows.length,
      avgHomeGoals: avg(formulaRows.map((r) => num(r.avgHomeGoals))).toFixed(3),
      avgAwayGoals: avg(formulaRows.map((r) => num(r.avgAwayGoals))).toFixed(3),
      avgTotalGoals: avg(formulaRows.map((r) => num(r.avgTotalGoals))).toFixed(3),
      avgHomeWinRate: avg(formulaRows.map((r) => num(r.homeWinRate))).toFixed(4),
      avgDrawRate: avg(formulaRows.map((r) => num(r.drawRate))).toFixed(4),
      avgAwayWinRate: avg(formulaRows.map((r) => num(r.awayWinRate))).toFixed(4),
      avgBlowoutRate3Plus: avg(formulaRows.map((r) => num(r.blowoutRate3Plus))).toFixed(4),
      homeAdvantageBias: (
        avg(formulaRows.map((r) => num(r.homeWinRate))) - avg(formulaRows.map((r) => num(r.awayWinRate)))
      ).toFixed(4),
      closeGameScenarioCount: closeRows.length,
      closeGameAvgTotalGoals: avg(closeRows.map((r) => num(r.avgTotalGoals))).toFixed(3),
      closeGameDrawRate: avg(closeRows.map((r) => num(r.drawRate))).toFixed(4),
      closeGameBlowoutRate3Plus: avg(closeRows.map((r) => num(r.blowoutRate3Plus))).toFixed(4),
      homeDominantScenarioCount: homeDominantRows.length,
      homeDominantConversion: avg(homeDominantRows.map((r) => num(r.homeWinRate))).toFixed(4),
      awayDominantScenarioCount: awayDominantRows.length,
      awayDominantConversion: avg(awayDominantRows.map((r) => num(r.awayWinRate))).toFixed(4),
    };

    aggregateRows.push(agg);
  }

  aggregateRows.sort((a, b) => a.formula.localeCompare(b.formula));

  fs.writeFileSync(outputPath, toCsv(aggregateRows), "utf8");

  console.log(`Wrote ${aggregateRows.length} rows to ${outputPath}`);
}

main();
