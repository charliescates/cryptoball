import FormationPicker from "./FormationPicker";
import FormationPitch from "./FormationPitch";
import LivePanel from "./LivePanel";
import { useChemistryBuilder } from "./useChemistryBuilder";

const ChemistryBuilder = () => {
  const { nearMisses, selectedFormationName, setSelectedFormationName, slots, teamStats, updateSlot } =
    useChemistryBuilder();

  return (
    <section className="chemistry-builder" aria-labelledby="chemistry-builder-title">
      <div className="chemistry-builder-header">
        <div>
          <p className="chemistry-kicker">Chemistry Builder</p>
          <h2 id="chemistry-builder-title">Try a Team Shape</h2>
          <p>Pick a formation, set each role, and see which bonuses activate before you build your real squad.</p>
        </div>
        <div className="chemistry-scoreboard" aria-label="Preview team stats">
          <div>
            <span>Attack</span>
            <strong>{teamStats.finalAttack}</strong>
          </div>
          <div>
            <span>Defense</span>
            <strong>{teamStats.finalDefense}</strong>
          </div>
        </div>
      </div>

      <FormationPicker onSelect={setSelectedFormationName} selectedFormationName={selectedFormationName} />

      <div className="chemistry-builder-grid">
        <FormationPitch onSlotChange={updateSlot} slots={slots} />
        <LivePanel nearMisses={nearMisses} teamStats={teamStats} />
      </div>
    </section>
  );
};

export default ChemistryBuilder;
