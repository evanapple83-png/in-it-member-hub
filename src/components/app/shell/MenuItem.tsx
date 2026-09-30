"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";

// Row in a `.pop` / `.sheet` menu: icon tile, title, optional hint. Link or button.
export function MenuItem({
  icon,
  title,
  hint,
  href,
  onClick,
}: {
  icon: IconName;
  title: ReactNode;
  hint?: ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <span className="ic">
        <Icon name={icon} />
      </span>
      <span>
        <b>{title}</b>
        {hint ? <small>{hint}</small> : null}
      </span>
    </>
  );
  return href ? (
    <Link href={href} className="mi" onClick={onClick}>
      {inner}
    </Link>
  ) : (
    <button type="button" className="mi" onClick={onClick}>
      {inner}
    </button>
  );
}
