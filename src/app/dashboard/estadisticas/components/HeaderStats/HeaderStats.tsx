import s from "./HeaderStats.module.css";
import YearPicker from "../YearPicker/YearPicker";

type Props = {
  title: string;
  subtitle?: string;
  year: number;
  yearMax?: number;
  onYearChange: (y: number) => void;
};

export default function HeaderStats({ title, subtitle, year, yearMax, onYearChange }: Props) {
  return (
    <header className={s.header}>
      <div>
        <h1 className={s.title}>{title}</h1>
        {subtitle && <p className={s.subtitle}>{subtitle}</p>}
      </div>

      <YearPicker value={year} max={yearMax} onChange={onYearChange} />
    </header>
  );
}
