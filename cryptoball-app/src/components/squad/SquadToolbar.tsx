import { type SquadFilter, type SquadSort, squadFilterOptions, squadSortOptions } from "./squadViewModel";

interface SquadToolbarProps {
  filter: SquadFilter;
  onFilterChange: (filter: SquadFilter) => void;
  onSortChange: (sort: SquadSort) => void;
  resultCount: number;
  sort: SquadSort;
  totalCount: number;
}

const SquadToolbar = ({ filter, onFilterChange, onSortChange, resultCount, sort, totalCount }: SquadToolbarProps) => (
  <section className="squad-toolbar" aria-label="Squad controls">
    <div className="squad-toolbar-count">
      <strong>{resultCount}</strong>
      <span>of {totalCount} shown</span>
    </div>

    <div className="squad-toolbar-controls">
      <label>
        <span>Filter</span>
        <select value={filter} onChange={(event) => onFilterChange(event.target.value as SquadFilter)}>
          {squadFilterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Sort</span>
        <select value={sort} onChange={(event) => onSortChange(event.target.value as SquadSort)}>
          {squadSortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  </section>
);

export default SquadToolbar;
