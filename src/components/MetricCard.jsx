import { Info } from 'lucide-react';

const MetricCard = ({ title, value, description, tooltip, icon: Icon, format = "number", darkMode, highlight }) => (
  <div
    className={`p-4 rounded-[12px] border ${
      darkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E5E7EB]'
    } shadow-[0_1px_4px_rgba(0,0,0,0.08)] transition-all hover:shadow-md relative group ${
      highlight === 'red' ? (darkMode ? 'border-red-800' : 'border-red-400') : ''
    }`}
  >
    <div className="flex items-center justify-between mb-2">
      <Icon className={`w-4 h-4 ${darkMode ? 'text-[#CDA349]' : 'text-[#0A1F44]'}`} />
      {tooltip && (
        <span className="ml-2 text-xs text-[#334155] cursor-help" title={tooltip}>
          <Info className="w-4 h-4" />
        </span>
      )}
    </div>
    <h3 className={`text-[14px] font-medium mb-1 ${darkMode ? 'text-[#D1D5DB]' : 'text-[#334155]'}`}>
      {title}
    </h3>
    <p
      className={`text-[20px] font-semibold ${
        darkMode ? 'text-white' : 'text-[#0A1F44]'
      } ${highlight === 'red' ? (darkMode ? 'text-red-400' : 'text-red-600') : ''}`}
    >
      {format === "currency"
        ? `$${(value / 1000000).toFixed(1)}M`
        : format === "percentage"
        ? `${(value * 100).toFixed(1)}%`
        : value.toFixed(1)}
    </p>
    {description && (
      <p className={`text-[12px] mt-2 ${darkMode ? 'text-[#9CA3AF]' : 'text-[#6B7280]'}`}>
        {description}
      </p>
    )}
  </div>
);

export default MetricCard;