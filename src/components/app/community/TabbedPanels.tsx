"use client";

import { useState, type ReactNode } from "react";
import { Pills } from "@/components/app/Pills";

export type TabPanel = { key: string; label: string; count?: number; content: ReactNode };

// Pills that switch between server-rendered panels (profile tabs, group Gesprek/Leden).
export function TabbedPanels({
  tabs,
  label,
  aside,
  initial,
}: {
  tabs: TabPanel[];
  label: string;
  aside?: ReactNode;
  initial?: string;
}) {
  const [active, setActive] = useState(initial ?? tabs[0]?.key);
  const current = tabs.find((tab) => tab.key === active) ?? tabs[0];
  return (
    <>
      <div className="toolbar">
        <Pills
          items={tabs.map(({ key, label, count }) => ({ key, label, count }))}
          active={current.key}
          onChange={setActive}
          label={label}
          className="seg-pills"
        />
        {aside}
      </div>
      <div key={current.key} className="stack" style={{ animation: "rise .3s var(--ease)" }}>
        {current.content}
      </div>
    </>
  );
}
