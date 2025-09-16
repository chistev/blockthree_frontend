import {
  Home,
  Sliders,
  Sun,
  Moon,
  Info,
  DollarSign,
  AlertTriangle,
  TrendingDown,
  Target,
} from 'lucide-react';
import DocumentationModal from './DocumentationModal';
import MetricCard from './MetricCard';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { LineChart, Line } from 'recharts';

const DecisionView = ({
  darkMode,
  setDarkMode,
  setCurrentPage,
  results,
  setIsDocModalOpen,
  isDocModalOpen,
}) => {
  // Use server-provided dilution and runway metrics
  const options = [
    {
      id: 'option1',
      title: 'BTC-Backed Loan',
      dilution: results.dilution.avg_btc_loan_dilution,
      ltvRisk: results.ltv.exceed_prob,
      roe: results.roe.avg_roe,
      runway: results.runway.btc_loan_runway_months, // Use server-provided runway
      sparklineData: results.nav.nav_paths.slice(0, 20).map((point, i) => ({
        time: i / 20,
        value: point.value,
      })),
    },
    {
      id: 'option2',
      title: 'Convertible Note',
      dilution: results.dilution.avg_convertible_dilution,
      ltvRisk: results.ltv.exceed_prob * 0.8,
      roe: results.roe.avg_roe * 0.95,
      runway: results.runway.convertible_runway_months, // Use server-provided runway
      sparklineData: results.nav.nav_paths.slice(0, 20).map((point, i) => ({
        time: i / 20,
        value: point.value * 0.95,
      })),
    },
    {
      id: 'option3',
      title: 'Hybrid Structure',
      dilution: results.dilution.avg_hybrid_dilution,
      ltvRisk: results.ltv.exceed_prob * 1.2,
      roe: results.roe.avg_roe * 1.05,
      runway: results.runway.hybrid_runway_months, // Use server-provided runway
      sparklineData: results.nav.nav_paths.slice(0, 20).map((point, i) => ({
        time: i / 20,
        value: point.value * 1.05,
      })),
    },
  ];

  // Update scatterData to use structure-specific runways
  const scatterData = options.map((opt) => ({
    name: opt.title,
    dilution: opt.dilution * 100, // Convert to percentage
    runway: opt.runway, // Use the structure-specific runway
    ltvRisk: opt.ltvRisk * 100, // For bubble size
  }));

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#111827]' : 'bg-[#F9FAFB]'} font-inter p-4 sm:p-6`}>
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
              Decision Options
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
      <div className="max-w-7xl mx-auto mt-6">
        {/* Option Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {options.map((option) => (
            <div
              key={option.id}
              className={`p-4 rounded-[12px] border ${darkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E5E7EB]'} shadow-[0_1px_4px_rgba(0,0,0,0.08)]`}
            >
              <h2 className={`text-[20px] font-semibold mb-4 ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
                {option.title}
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <MetricCard
                  title="Dilution"
                  value={option.dilution}
                  description="Equity dilution impact"
                  tooltip="Dilution from new equity or convertible debt, adjusted for structure"
                  icon={TrendingDown}
                  format="percentage"
                  darkMode={darkMode}
                  highlight={option.dilution > 0.1 ? 'red' : null}
                />
                <MetricCard
                  title="Runway"
                  value={option.runway}
                  description="Months of cash reserves"
                  tooltip="Calculated as Cash Reserves ÷ Monthly Burn Rate"
                  icon={DollarSign}
                  format="number"
                  darkMode={darkMode}
                  highlight={option.runway < 12 ? 'red' : null}
                />
                <MetricCard
                  title="LTV Breach Risk"
                  value={option.ltvRisk}
                  description="Probability LTV exceeds cap"
                  tooltip="Likelihood that the Loan-to-Value ratio exceeds the LTV Cap"
                  icon={AlertTriangle}
                  format="percentage"
                  darkMode={darkMode}
                  highlight={option.ltvRisk > 0.5 ? 'red' : null}
                />
                <MetricCard
                  title="Expected ROE"
                  value={option.roe}
                  description="Return on Equity"
                  tooltip="Calculated using CAPM, adjusted for BTC volatility and beta"
                  icon={Target}
                  format="percentage"
                  darkMode={darkMode}
                />
              </div>
              {/* Sparkline Chart */}
              <div className="h-24 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={option.sparklineData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={darkMode ? '#CDA349' : '#0A1F44'}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <button
                onClick={() => setCurrentPage('termSheet')}
                className={`w-full px-6 py-3 bg-[#0A1F44] text-white rounded-[12px] text-[16px] font-medium hover:bg-[#1e3a8a]`}
              >
                View Term Sheet
              </button>
            </div>
          ))}
        </div>

        {/* Comparative Frontier Chart */}
        <div className={`p-4 rounded-[12px] border ${darkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E5E7EB]'} shadow-[0_1px_4px_rgba(0,0,0,0.08)]`}>
          <h2 className={`text-[20px] font-semibold mb-4 ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
            Comparative Frontier
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                <XAxis
                  dataKey="dilution"
                  name="Dilution"
                  unit="%"
                  type="number"
                  tickFormatter={(v) => `${v.toFixed(1)}%`}
                  stroke={darkMode ? '#D1D5DB' : '#334155'}
                />
                <YAxis
                  dataKey="runway"
                  name="Runway"
                  unit=" months"
                  type="number"
                  tickFormatter={(v) => v.toFixed(0)}
                  stroke={darkMode ? '#D1D5DB' : '#334155'}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'Dilution') return `${value.toFixed(1)}%`;
                    if (name === 'Runway') return `${value.toFixed(0)} months`;
                    return value;
                  }}
                  contentStyle={
                    darkMode
                      ? { backgroundColor: '#1F2937', border: '1px solid #374151' }
                      : { backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }
                  }
                />
                <Legend />
                {scatterData.map((entry, index) => (
                  <Scatter
                    key={entry.name}
                    name={entry.name}
                    data={[entry]}
                    fill={['#10b981', '#3b82f6', '#CDA349'][index % 3]}
                    shape="circle"
                    r={Math.max(10, Math.min(50, entry.ltvRisk * 100))}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <DocumentationModal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} darkMode={darkMode} />
    </div>
  );
};

export default DecisionView;