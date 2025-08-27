import { useState, useEffect } from 'react';

const InputField = ({ label, value, onChange, suffix = "", tooltip = "", darkMode }) => {
  const [localValue, setLocalValue] = useState(value.toString());

  useEffect(() => setLocalValue(value.toString()), [value]);

  const handleBlur = () => {
    const parsed = parseFloat(localValue);
    onChange(isNaN(parsed) ? 0 : parsed);
  };

  return (
    <div className="mb-4 relative">
      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
        {label}
        {tooltip && <span className="ml-2 text-xs text-gray-500" title={tooltip}>[?]</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-400' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors text-sm`}
        />
        {suffix && (
          <span className={`absolute right-2 top-2 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};

export default InputField;