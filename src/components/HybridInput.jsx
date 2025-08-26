import { useState, useEffect } from 'react';

const HybridInput = ({ label, value, onChange, min, max, step = 0.01, suffix = "", tooltip = "", darkMode }) => {
  const [localValue, setLocalValue] = useState(value.toString());

  useEffect(() => setLocalValue(value.toString()), [value]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    // Allow empty input or valid number/decimal input
    if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
      setLocalValue(val);
    }
  };

  const handleInputBlur = () => {
    let parsed = parseFloat(localValue);
    if (isNaN(parsed)) {
      parsed = min;
    } else if (suffix === "%") {
      parsed = parsed / 100;
    }
    // Allow 0 for percentage-based inputs if min is 0
    const clamped = Math.max(min, Math.min(max, parsed));
    setLocalValue(clamped.toString());
    onChange(clamped);
  };

  const handleSliderChange = (val) => {
    setLocalValue(val.toString());
    onChange(val);
  };

  const displayValue = parseFloat(localValue);
  const formattedValue = isNaN(displayValue)
    ? (suffix === "%" ? (min * 100).toFixed(1) : min.toFixed(step >= 1 ? 0 : 2))
    : (suffix === "%" ? (displayValue * 100).toFixed(1) : displayValue.toFixed(step >= 1 ? 0 : 2));

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
          {label}
          {tooltip && <span className="ml-2 text-xs text-gray-500" title={tooltip}>[?]</span>}
        </label>
        <span className={`text-sm font-mono ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
          {formattedValue}{suffix}
        </span>
      </div>
      <div className="relative mb-2">
        <input
          type="text"
          value={localValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          className={`w-full px-3 py-2 rounded-lg border ${
            darkMode ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-400' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
          } focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors text-sm`}
        />
        {suffix && (
          <span className={`absolute right-2 top-2 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            {suffix}
          </span>
        )}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={isNaN(parseFloat(localValue)) ? min : parseFloat(localValue)}
        onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{suffix === "%" ? (min * 100).toFixed(1) : min}</span>
        <span>{suffix === "%" ? (max * 100).toFixed(1) : max}</span>
      </div>
    </div>
  );
};

export default HybridInput;