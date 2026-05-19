"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

export function TagInput({ label, value, onChange }: { label: string; value: string[]; onChange: (items: string[]) => void }) {
  const [draft, setDraft] = useState("");

  function addTag() {
    const next = draft.trim();
    if (!next || value.includes(next)) return;
    onChange([...value, next]);
    setDraft("");
  }

  return (
    <label className="block">
      <span className="text-sm font-bold text-charcoal">{label}</span>
      <div className="mt-2 flex gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              addTag();
            }
          }}
          placeholder="Type and press Enter"
        />
        <button type="button" onClick={addTag} className="rounded-2xl bg-deep-blue px-4 text-sm font-bold text-white">
          Add
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {value.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onChange(value.filter((tag) => tag !== item))}
            className="inline-flex items-center gap-2 rounded-full bg-dutch-blue/14 px-3 py-1 text-xs font-bold text-deep-blue"
          >
            {item}
            <X className="h-3 w-3" />
          </button>
        ))}
      </div>
    </label>
  );
}
