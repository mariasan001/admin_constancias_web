import s from "./Header.module.css";

type Props = {
  title: string;
  subtitle?: string;
  year: number;
  yearNow: number;
  onYearChange: (y: number) => void;
};

export default function Header({ title, subtitle, year, yearNow, onYearChange }: Props) {
  return (
    <header className={s.header}>
      <div>
        <h1 className={s.title}>{title}</h1>
        {subtitle && <p className={s.subtitle}>{subtitle}</p>}
      </div>

      <div className={s.yearPicker}>
        <label htmlFor="year">Año: </label>
        <input
          id="year"
          type="number"
          min={2000}
          max={yearNow + 1}
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value || yearNow))}
        />
      </div>
    </header>
  );
}
