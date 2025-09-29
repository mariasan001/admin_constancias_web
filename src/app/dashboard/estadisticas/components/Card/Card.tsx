import s from "./Card.module.css";
import React from "react";

type Props = {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
};

export default function Card({ title, subtitle, right, children }: Props) {
  return (
    <article className={s.card}>
      {(title || subtitle || right) && (
        <div className={s.head}>
          <div className={s.titles}>
            {title && <h3 className={s.title}>{title}</h3>}
            {subtitle && <small className={s.subtitle}>{subtitle}</small>}
          </div>
          {right && <div className={s.right}>{right}</div>}
        </div>
      )}
      <div className={s.body}>{children}</div>
    </article>
  );
}
