import "../index.css";

import ChemistryHero from "./chemistry/ChemistryHero";
import ChemistrySections from "./chemistry/ChemistrySections";

export default function Chemistry() {
  return (
    <div className="chemistry-page">
      <ChemistryHero />
      <ChemistrySections />
    </div>
  );
}
