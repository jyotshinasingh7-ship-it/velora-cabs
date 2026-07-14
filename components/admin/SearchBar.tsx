"use client";

import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
}: SearchBarProps) {
  return (
    <div className="relative mb-8">

      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400"
        size={20}
      />

      <input
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.035] py-4 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-amber-400/50"
      />

    </div>
  );
}
