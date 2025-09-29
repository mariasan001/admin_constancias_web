import s from "./YearPicker.module.css";

type Props = {
  value: number;
  max?: number;
  onChange: (y: number) => void;
};

export default function YearPicker({ value, max, onChange }: Props) {
  return (
    <div className={s.picker}>
      <label htmlFor="year">Año: </label>
      <input
        id="year"
        type="number"
        min={2000}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value || value))}
      />
    </div>
  );
}
