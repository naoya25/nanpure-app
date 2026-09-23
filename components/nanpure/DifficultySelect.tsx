import { DIFFICULTY_PERCENTS } from "@/lib/types/puzzle";
import type { DifficultyPercent } from "@/lib/types/puzzle";

type DifficultySelectProps = {
  value: DifficultyPercent;
  onChange: (percent: DifficultyPercent) => void;
  disabled?: boolean;
};

export function DifficultySelect({
  value,
  onChange,
  disabled,
}: DifficultySelectProps) {
  return (
    <label className="flex items-center gap-1.5 text-sm text-zinc-600">
      難易度
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value) as DifficultyPercent)}
        className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-800 hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-40"
      >
        {DIFFICULTY_PERCENTS.map((percent) => (
          <option key={percent} value={percent}>
            {percent}%
          </option>
        ))}
      </select>
    </label>
  );
}
