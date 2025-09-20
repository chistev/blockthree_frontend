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
import { BarChart, Bar } from 'recharts';

const DecisionView = ({
  darkMode,
  setDarkMode,
  setCurrentPage,
  results,
  setIsDocModalOpen,
  isDocModalOpen,
}) => {
  // Define options based on server-provided results
  const options = [
    {
      id: 'option1',
      title: 'BTC-Backed Loan',
      structure: 'Loan',
      dilution: results.dilution.avg_btc_loan_dilution,
      ltvRisk: results.ltv.exceed_prob_btc_loan,
      roe: results.roe.avg_roe_btc_loan,
      runway: results.runway.btc_loan_runway_months,
      navChange: results.nav.avg_nav_btc_loan,
      sparklineData: results.nav.nav_paths.slice(0, 20).map((point, i) => ({
        time: i / 20,
        value: point.value,
      })),
    },
    {
      id: 'option2',
      title: 'Convertible Note',
      structure: 'Convertible',
      dilution: results.dilution.avg_convertible_dilution,
      ltvRisk: results.ltv.exceed_prob_convertible,
      roe: results.roe.avg_roe_convertible,
      runway: results.runway.convertible_runway_months,
      navChange: results.nav.avg_nav_convertible,
      sparklineData: results.nav.nav_paths.slice(0, 20).map((point, i) => ({
        time: i / 20,
        value: point.value,
      })),
    },
    {
      id: 'option3',
      title: 'Hybrid Structure',
      structure: 'Hybrid',
      dilution: results.dilution.avg_hybrid_dilution,
      ltvRisk: results.ltv.exceed_prob_hybrid,
      roe: results.roe.avg_roe_hybrid,
      runway: results.runway.hybrid_runway_months,
      navChange: results.nav.avg_nav_hybrid,
      sparklineData: results.nav.nav_paths.slice(0, 20).map((point, i) => ({
        time: i / 20,
        value: point.value,
      })),
    },
  ];

  // Data for Efficient Frontier scatter plot
  const scatterData = options.map((opt) => ({
    name: opt.title,
    dilution: opt.dilution * 100, // Convert to percentage
    runway: opt.runway,
    ltvRisk: opt.ltvRisk * 100, // Convert to percentage
  }));

  // Data for Scenario Comparison bar chart (Bull, Base, Bear, Stress)
  const scenarioData = [
    {
      name: 'Bull',
      btcLoan: results.scenarios?.bull?.btc_loan_roe || 0.1,
      convertible: results.scenarios?.bull?.convertible_roe || 0.1,
      hybrid: results.scenarios?.bull?.hybrid_roe || 0.1,
    },
    {
      name: 'Base',
      btcLoan: results.scenarios?.base?.btc_loan_roe || 0.08,
      convertible: results.scenarios?.base?.convertible_roe || 0.08,
      hybrid: results.scenarios?.base?.hybrid_roe || 0.08,
    },
    {
      name: 'Bear',
      btcLoan: results.scenarios?.bear?.btc_loan_roe || 0.05,
      convertible: results.scenarios?.bear?.convertible_roe || 0.05,
      hybrid: results.scenarios?.bear?.hybrid_roe || 0.05,
    },
    {
      name: 'Stress',
      btcLoan: results.scenarios?.stress?.btc_loan_roe || 0.02,
      convertible: results.scenarios?.stress?.convertible_roe || 0.02,
      hybrid: results.scenarios?.stress?.hybrid_roe || 0.02,
    },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-slate-100'} font-inter p-4 sm:p-6`}>
      {/* Header */}
      <nav className={`px-4 sm:px-8 py-4 border-b ${darkMode ? 'border-slate-900' : 'border-slate-100'}`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <button
              onClick={() => setCurrentPage('landing')}
              className={`p-2 rounded-lg text-[14px] font-inter transform hover:scale-101 transition-transform ${
                darkMode ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
              }`}
              title="Back to Home"
            >
              <Home className="w-4 h-4 inline-block mr-1" />
              Home
            </button>
            <button
              onClick={() => setCurrentPage('assumptions')}
              className={`p-2 rounded-lg text-[14px] font-inter transform hover:scale-101 transition-transform ${
                darkMode ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
              }`}
              title="Back to Assumptions"
            >
              <Sliders className="w-4 h-4 inline-block mr-1" />
              Assumptions
            </button>
            <h1 className={`text-[28px] font-semibold tracking-tight font-inter-tight ${
              darkMode ? 'text-slate-100' : 'text-slate-900'
            }`}>
              Decision Options
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 bg-emerald-500 rounded-full"></span>
              <span className={`text-[12px] font-inter ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                Snapshot: #ABC123
              </span>
            </div>
            <button
              onClick={() => setIsDocModalOpen(true)}
              className={`px-3 py-2 rounded-lg text-[14px] font-inter transform hover:scale-101 transition-transform ${
                darkMode ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
              }`}
            >
              <Info className="w-4 h-4 inline-block mr-1" />
              Learn More
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transform hover:scale-101 transition-transform ${
                darkMode ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto mt-6">
        {/* Hero Row: Option Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {options.map((option) => (
            <div
              key={option.id}
              className={`p-4 rounded-2xl border shadow-md transform hover:scale-101 transition-transform bg-gradient-to-b ${
                darkMode ? 'bg-slate-800 border-slate-700 from-slate-800 to-slate-900' : 'bg-white border-slate-200 from-white to-slate-100'
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-[22px] font-semibold tracking-tight font-inter-tight ${
                  darkMode ? 'text-slate-100' : 'text-slate-900'
                }`}>
                  {option.title}
                </h2>
                <span className={`text-[12px] font-inter rounded-full px-2 py-1 bg-gray-400 text-slate-900`}>
                  {option.structure}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <MetricCard
                  title="ΔNAV"
                  value={option.navChange}
                  description="Net Asset Value change"
                  tooltip="Change in Net Asset Value, accounting for structure-specific impacts"
                  icon={DollarSign}
                  format="percentage"
                  darkMode={darkMode}
                  numberClassName="text-[26px] font-bold font-roboto-mono"
                />
                <MetricCard
                  title="Dilution"
                  value={option.dilution}
                  description="Equity dilution impact"
                  tooltip="Dilution from new equity or convertible debt, adjusted for structure"
                  icon={TrendingDown}
                  format="percentage"
                  darkMode={darkMode}
                  highlight={option.dilution > 0.1 ? 'red' : null}
                  numberClassName="text-[26px] font-bold font-roboto-mono"
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
                  numberClassName="text-[26px] font-bold font-roboto-mono"
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
                  numberClassName="text-[26px] font-bold font-roboto-mono"
                />
                <MetricCard
                  title="Expected ROE"
                  value={option.roe}
                  description="Return on Equity"
                  tooltip="Calculated using CAPM, adjusted for BTC volatility and structure-specific leverage and dilution"
                  icon={Target}
                  format="percentage"
                  darkMode={darkMode}
                  numberClassName="text-[26px] font-bold font-roboto-mono"
                />
              </div>
              <div className="h-24 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={option.sparklineData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={darkMode ? '#10b981' : '#047857'}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <button
                onClick={() => setCurrentPage('termSheet')}
                className={`w-full px-6 py-3 bg-emerald-500 text-white rounded-lg text-[16px] font-inter font-medium hover:bg-emerald-600 active:bg-emerald-700 transform hover:scale-101 transition-transform`}
              >
                View Term Sheet
              </button>
            </div>
          ))}
        </div>

        {/* Charts Panel */}
        <div className={`p-4 rounded-2xl border shadow-md bg-gradient-to-b ${
          darkMode ? 'bg-slate-800 border-slate-700 from-slate-800 to-slate-900' : 'bg-white border-slate-200 from-white to-slate-100'
        }`}>
          <h2 className={`text-[22px] font-semibold tracking-tight font-inter-tight mb-4 ${
            darkMode ? 'text-slate-100' : 'text-slate-900'
          }`}>
            Comparative Analysis
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Efficient Frontier Scatter Plot */}
            <div className="h-64">
              <h3 className={`text-[18px] font-semibold font-inter-tight mb-2 ${
                darkMode ? 'text-slate-100' : 'text-slate-900'
              }`}>
                Efficient Frontier
              </h3>
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
                    label={{
                      value: 'Dilution (%)',
                      position: 'bottom',
                      offset: 0,
                      fill: darkMode ? '#D1D5DB' : '#334155',
                      fontFamily: 'Inter',
                      fontSize: 14,
                    }}
                  />
                  <YAxis
                    dataKey="runway"
                    name="Runway"
                    unit=" months"
                    type="number"
                    tickFormatter={(v) => v.toFixed(0)}
                    stroke={darkMode ? '#D1D5DB' : '#334155'}
                    label={{
                      value: 'Runway (months)',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 10,
                      fill: darkMode ? '#D1D5DB' : '#334155',
                      fontFamily: 'Inter',
                      fontSize: 14,
                    }}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'Dilution') return `${value.toFixed(1)}%`;
                      if (name === 'Runway') return `${value.toFixed(0)} months`;
                      return value;
                    }}
                    contentStyle={{
                      backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                      border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                      borderRadius: '8px',
                      fontFamily: 'Inter',
                      fontSize: 14,
                    }}
                  />
                  <Legend wrapperStyle={{ fontFamily: 'Inter', fontSize: 14 }} />
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

            {/* Scenario Comparison Bar Chart */}
            <div className="h-64">
              <h3 className={`text-[18px] font-semibold font-inter-tight mb-2 ${
                darkMode ? 'text-slate-100' : 'text-slate-900'
              }`}>
                Scenario Comparison
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scenarioData} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                  <XAxis
                    dataKey="name"
                    stroke={darkMode ? '#D1D5DB' : '#334155'}
                    label={{
                      value: 'Scenario',
                      position: 'bottom',
                      offset: 0,
                      fill: darkMode ? '#D1D5DB' : '#334155',
                      fontFamily: 'Inter',
                      fontSize: 14,
                    }}
                  />
                  <YAxis
                    tickFormatter={(v) => `${(v * 100).toFixed(1)}%`}
                    stroke={darkMode ? '#D1D5DB' : '#334155'}
                    label={{
                      value: 'ROE (%)',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 10,
                      fill: darkMode ? '#D1D5DB' : '#334155',
                      fontFamily: 'Inter',
                      fontSize: 14,
                    }}
                  />
                  <Tooltip
                    formatter={(value) => `${(value * 100).toFixed(1)}%`}
                    contentStyle={{
                      backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                      border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                      borderRadius: '8px',
                      fontFamily: 'Inter',
                      fontSize: 14,
                    }}
                  />
                  <Legend wrapperStyle={{ fontFamily: 'Inter', fontSize: 14 }} />
                  <Bar dataKey="btcLoan" name="BTC-Backed Loan" fill="#10b981" />
                  <Bar dataKey="convertible" name="Convertible Note" fill="#3b82f6" />
                  <Bar dataKey="hybrid" name="Hybrid Structure" fill="#CDA349" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <DocumentationModal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} darkMode={darkMode} />
    </div>
  );
};

export default DecisionView;