import { useCallback } from 'react';

export default function YearSlider({ min, max, value, onChange, isPlaying, onPlayToggle, speed, onSpeedChange }) {
  const handleChange = useCallback((e) => {
    onChange(Number(e.target.value));
  }, [onChange]);

  return (
    <div className="flex items-center gap-3 py-3">
      <button
        onClick={onPlayToggle}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-800 text-white hover:bg-stone-700 transition-colors shrink-0"
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={handleChange}
        className="flex-1 h-2 accent-stone-700"
      />

      <span className="text-2xl font-bold tabular-nums w-16 text-right">{value}</span>

      {onSpeedChange && (
        <select
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="text-sm border border-stone-300 rounded px-2 py-1"
        >
          <option value={200}>2x</option>
          <option value={500}>1x</option>
          <option value={1000}>0.5x</option>
        </select>
      )}
    </div>
  );
}
