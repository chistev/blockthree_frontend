import {
  Home,
  Sliders,
  Sun,
  Moon,
  Info,
  FileText,
} from 'lucide-react';
import DocumentationModal from './DocumentationModal';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { LineChart, Line } from 'recharts';

const DecisionView = ({
  darkMode,
  setDarkMode,
  setCurrentPage,
  results,
  assumptions,
  setIsDocModalOpen,
  isDocModalOpen,
}) => {
  // Calculate runway (consistent with RunModelsPage.jsx)
  const annualBurnRate = 12000000; // $1M/month
  const runwayMonths = assumptions.new_equity_raised / (annualBurnRate / 12);

  // Mock data for three options (replace with actual backend data)
  const options = [
    {
      name: 'BTC-Backed Loan',
      dilution: results?.dilution.base_dilution || 0.08,
      runway: runwayMonths,
      ltvBreachRisk: results?.ltv.exceed_prob || 0.25,
      roe: results?.roe.avg_roe || 0.15,
      navPath: results?.nav.nav_paths.slice(0, 10).map((v, i) => ({ time: i / 10, value: v })), // Simplified for sparkline
    },
    {
      name: 'Convertible Note',
      dilution: (results?.dilution.base_dilution || 0.08) * 1.2, // 20% higher dilution
      runway: runwayMonths * 1.1, // Slightly longer runway
      ltvBreachRisk: (results?.ltv.exceed_prob || 0.25) * 0.8, // Lower LTV risk
      roe: (results?.roe.avg_roe || 0.15) * 0.9, // Slightly lower ROE
      navPath: results?.nav.nav_paths.slice(0, 10).map((v, i) => ({ time: i / 10, value: v * 1.1 })), // Adjusted
    },
    {
      name: 'Hybrid Structure',
      dilution: (results?.dilution.base_dilution || 0.08) * 0.9, // Lower dilution
      runway: runwayMonths * 0.95, // Slightly shorter runway
      ltvBreachRisk: (results?.ltv.exceed_prob || 0.25) * 1.1, // Higher LTV risk
      roe: (results?.roe.avg_roe || 0.15) * 1.05, // Slightly higher ROE
      navPath: results?.nav.nav_paths.slice(0, 10).map((v, i) => ({ time: i / 10, value: v * 0.95 })), // Adjusted
    },
  ];

  // Data for scatter chart
  const scatterData = options.map(option => ({
    name: option.name,
    dilution: option.dilution * 100, // Convert to %
    runway: option.runway,
    ltvBreachRisk: option.ltvBreachRisk * 100, // Convert to % for bubble size
  }));

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#111827]' : 'bg-[#F9FAFB]'} font-inter`}>
      {/* Header */}
      <nav className={`px-4 sm:px-8 py-3 border-b ${darkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E5E7EB]'}`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center space-x-4 mb-3 sm:mb-0">
            <button
              onClick={() => setCurrentPage('landing')}
              className={`p-2 rounded-lg text-sm ${darkMode ? 'bg-[#374151] text-white' : 'bg-[#E5E7EB] text-[#0A1F44]'}`}
              title="Back to Home"
            >
              <Home className="w-4 h-4 inline-block mr-1" />
              Home
            </button>
            <button
              onClick={() => setCurrentPage('assumptions')}
              className={`p-2 rounded-lg text-sm ${darkMode ? 'bg-[#374151] text-white' : 'bg-[#E5E7EB] text-[#0A1F44]'}`}
              title="Back to Assumptions"
            >
              <Sliders className="w-4 h-4 inline-block mr-1" />
              Assumptions
            </button>
            <h1 className={`text-[28px] font-semibold ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
              Decision View
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsDocModalOpen(true)}
              className={`px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-[#374151] text-white' : 'bg-[#E5E7EB] text-[#0A1F44]'}`}
            >
              <Info className="w-4 h-4 inline-block mr-1" />
              Learn More
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${darkMode ? 'bg-[#374151] text-white' : 'bg-[#E5E7EB] text-[#0A1F44]'}`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Option Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          {options.map((option) => (
            <div
              key={option.name}
              className={`p-4 rounded-[12px] border ${darkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E5E7EB]'} shadow-[0_1px_4px_rgba(0,0,0,0.08)]`}
            >
              <h3 className={`text-[20px] font-semibold mb-4 ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
                {option.name}
              </h3>
              <div className="space-y-3">
                <div>
                  <p className={`text-[20px] font-bold ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
                    {(option.dilution * 100).toFixed(1)}%
                  </p>
                  <p className={`text-[14px] ${darkMode ? 'text-[#9CA3AF]' : 'text-[#334155]'}`}>
                    Dilution
                  </p>
                </div>
                <div>
                  <p className={`text-[20px] font-bold ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
                    {option.runway.toFixed(1)} mo
                  </p>
                  <p className={`text-[14px] ${darkMode ? 'text-[#9CA3AF]' : 'text-[#334155]'}`}>
                    Runway
                  </p>
                </div>
                <div>
                  <p className={`text-[20px] font-bold ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
                    {(option.ltvBreachRisk * 100).toFixed(1)}%
                  </p>
                  <p className={`text-[14px] ${darkMode ? 'text-[#9CA3AF]' : 'text-[#334155]'}`}>
                    LTV Breach Risk
                  </p>
                </div>
                <div>
                  <p className={`text-[20px] font-bold ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
                    {(option.roe * 100).toFixed(1)}%
                  </p>
                  <p className={`text-[14px] ${darkMode ? 'text-[#9CA3AF]' : 'text-[#334155]'}`}>
                    Expected ROE
                  </p>
                </div>
              </div>
              {/* Sparkline */}
              <div className="h-16 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={option.navPath} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#CDA349"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {/* CTA Button */}
              <button
                className="w-full mt-4 px-4 py-2 bg-[#0A1F44] text-white rounded-[12px] text-[16px] font-medium hover:bg-[#1e3a8a]"
              >
                <FileText className="w-4 h-4 inline-block mr-1" />
                View Term Sheet
              </button>
            </div>
          ))}
        </div>

        {/* Comparative Frontier Chart */}
        <div className={`p-4 rounded-[12px] border ${darkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E5E7EB]'} shadow-[0_1px_4px_rgba(0,0,0,0.08)]`}>
          <h3 className={`text-[20px] font-semibold mb-4 ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
            Comparative Frontier
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                <XAxis
                  type="number"
                  dataKey="dilution"
                  name="Dilution"
                  unit="%"
                  domain={['auto', 'auto']}
                  stroke={darkMode ? '#D1D5DB' : '#334155'}
                  tickFormatter={(value) => value.toFixed(1)}
                />
                <YAxis
                  type="number"
                  dataKey="runway"
                  name="Runway"
                  unit="mo"
                  domain={['auto', 'auto']}
                  stroke={darkMode ? '#D1D5DB' : '#334155'}
                  tickFormatter={(value) => value.toFixed(0)}
                />
                <ZAxis
                  type="number"
                  dataKey="ltvBreachRisk"
                  range={[50, 300]} // Adjust bubble size range
                  name="LTV Breach Risk"
                  unit="%"
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value, name) => [
                    name === 'ltvBreachRisk' ? `${value.toFixed(1)}%` : name === 'dilution' ? `${value.toFixed(1)}%` : value.toFixed(1),
                    name,
                  ]}
                  contentStyle={darkMode ? { backgroundColor: '#1F2937', border: '1px solid #374151' } : { backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
                />
                <Legend />
                <Scatter name="Options" data={scatterData} fill="#CDA349">
                  {scatterData.map((entry, index) => (
                    <text
                      key={`label-${index}`}
                      x={entry.dilution}
                      y={entry.runway}
                      dy={-10}
                      fontSize={12}
                      fill={darkMode ? '#D1D5DB' : '#334155'}
                      textAnchor="middle"
                    >
                      {entry.name}
                    </text>
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Documentation Modal */}
      <DocumentationModal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} darkMode={darkMode} />
    </div>
  );
};

export default DecisionView;