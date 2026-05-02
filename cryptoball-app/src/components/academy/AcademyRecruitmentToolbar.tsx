export type AcademyRecruitmentFocus = "all" | "attack" | "defense" | "potential" | "shortlist";

interface AcademyRecruitmentToolbarProps {
  focus: AcademyRecruitmentFocus;
  resultCount: number;
  shortlistCount: number;
  totalCount: number;
  onFocusChange: (focus: AcademyRecruitmentFocus) => void;
}

const focusOptions: Array<{ label: string; value: AcademyRecruitmentFocus }> = [
  { label: "All prospects", value: "all" },
  { label: "Attack focus", value: "attack" },
  { label: "Defense focus", value: "defense" },
  { label: "High potential", value: "potential" },
  { label: "Shortlist", value: "shortlist" },
];

const AcademyRecruitmentToolbar = ({
  focus,
  resultCount,
  shortlistCount,
  totalCount,
  onFocusChange,
}: AcademyRecruitmentToolbarProps) => (
  <section className="academy-recruitment-toolbar" aria-label="Academy recruitment focus">
    <div>
      <p className="academy-section-kicker">Recruit focus</p>
      <strong>
        {resultCount} of {totalCount} shown
      </strong>
      <span>{shortlistCount} shortlisted</span>
    </div>
    <label>
      <span>Focus</span>
      <select value={focus} onChange={(event) => onFocusChange(event.target.value as AcademyRecruitmentFocus)}>
        {focusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  </section>
);

export default AcademyRecruitmentToolbar;
