import { useState, useEffect } from 'react';

const HybridInput = ({ label, value, onChange, min, max, step = 0.01, suffix = "", tooltip = "", darkMode }) => {
  const [localValue, setLocalValue] = useState(value.toString());
  const [sliderValue, setSliderValue] = useState(value);

  useEffect(() => {
    setLocalValue(value.toString());
    setSliderValue(value);
  }, [value]);

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
      parsed = value; // Revert to current value if invalid
    }
    
    // Update both the value and slider
    onChange(parsed);
    setSliderValue(Math.max(min, Math.min(max, parsed))); // Constrain slider to min/max
  };

  const handleSliderChange = (val) => {
    const newValue = parseFloat(val);
    setSliderValue(newValue);
    setLocalValue(newValue.toString());
    onChange(newValue);
  };

  // Format display value based on suffix
  const formatDisplayValue = (val) => {
    if (suffix === "%") {
      return (val * 100).toFixed(1);
    }
    return val.toFixed(step >= 1 ? 0 : 2);
  };

  // Format slider bounds for display
  const formatBoundValue = (val) => {
    if (suffix === "%") {
      return (val * 100).toFixed(1);
    }
    return val;
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
          {label}
          {tooltip && <span className="ml-2 text-xs text-gray-500" title={tooltip}>[?]</span>}
        </label>
        <span className={`text-sm font-mono ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
          {formatDisplayValue(value)}{suffix}
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
        value={sliderValue}
        onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{formatBoundValue(min)}</span>
        <span>{formatBoundValue(max)}</span>
      </div>
    </div>
  );
};

export default HybridInput;