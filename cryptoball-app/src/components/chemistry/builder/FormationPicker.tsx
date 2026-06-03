import { builderFormations } from "../data";
import { formatFormationLabel } from "../../formation-grid-parts/formationRows";

interface FormationPickerProps {
  onSelect: (formationName: string) => void;
  selectedFormationName: string;
}

const FormationPicker = ({ onSelect, selectedFormationName }: FormationPickerProps) => (
  <div className="chemistry-formation-picker" aria-label="Choose a formation">
    {builderFormations.map((formation) => (
      <button
        key={formation.name}
        className={`chemistry-formation-option ${formation.name === selectedFormationName ? "selected" : ""}`}
        type="button"
        onClick={() => onSelect(formation.name)}
      >
        <strong>{formatFormationLabel(formation)}</strong>
        <span>{formation.summary}</span>
        <small>{formation.intent}</small>
      </button>
    ))}
  </div>
);

export default FormationPicker;
