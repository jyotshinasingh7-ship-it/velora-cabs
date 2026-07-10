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
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
        size={20}
      />

      <input
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-slate-900 py-4 pl-12 pr-4 text-white outline-none transition focus:border-cyan-500"
      />

    </div>
  );
}