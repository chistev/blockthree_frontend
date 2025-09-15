import { useState, useEffect } from 'react';

const InputField = ({ label, value, onChange, suffix = '', tooltip = '', darkMode, className = '', disabled = false, extraLabel = null }) => {
  // Initialize localValue with a string, handling undefined/null
  const [localValue, setLocalValue] = useState(value != null ? value.toString() : '');

  // Sync localValue with prop changes
  useEffect(() => {
    setLocalValue(value != null ? value.toString() : '');
  }, [value]);

  // Handle blur to parse and send numeric value to parent
  const handleBlur = () => {
    const parsed = parseFloat(localValue);
    onChange(isNaN(parsed) ? 0 : parsed); // Default to 0 if invalid
  };

  return (
    <div className="mb-4 relative">
      <label className={`block text-[14px] font-medium mb-1 ${darkMode ? 'text-[#D1D5DB]' : 'text-[#334155]'}`}>
        {label}
        {tooltip && <span className="ml-1 text-[#CDA349] cursor-help" title={tooltip}>ⓘ</span>}
        {extraLabel}
      </label>
      <div className="relative">
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          disabled={disabled}
          className={`w-full px-3 py-2 rounded-[12px] border text-[14px] ${darkMode ? 'bg-[#1F2937] border-[#374151] text-white' : 'bg-white border-[#E5E7EB] text-[#0A1F44]'} focus:outline-none focus:ring-2 focus:ring-[#CDA349] ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {suffix && (
          <span className={`absolute right-3 top-2 text-[14px] ${darkMode ? 'text-[#D1D5DB]' : 'text-[#334155]'}`}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};

export default InputField;