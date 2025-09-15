import {
  Home,
  Sliders,
  Sun,
  Moon,
  Info,
  DollarSign,
  Briefcase,
  Shield,
  AlertTriangle,
  Target,
  TrendingDown,
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

const BoardroomPage = ({
  darkMode,
  setDarkMode,
  setCurrentPage,
  results,
  assumptions,
  setIsDocModalOpen,
  isDocModalOpen,
}) => {
  // Option data (consistent with DecisionView.jsx)
  const options = [
    {
      id: 'option1',
      title: 'BTC-Backed Loan',
      dilution: results.dilution.base_dilution,
      ltvRisk: results.ltv.exceed_prob,
      roe: results.roe.avg_roe,
      runway: (assumptions.new_equity_raised || 10000000) / (12000000 / 12),
    },
    {
      id: 'option2',
      title: 'Convertible Note',
      dilution: results.dilution.avg_dilution * 0.9,
      ltvRisk: results.ltv.exceed_prob * 0.8,
      roe: results.roe.avg_roe * 0.95,
      runway: (assumptions.new_equity_raised || 10000000) / (12000000 / 12) * 1.1,
    },
    {
      id: 'option3',
      title: 'Hybrid Structure',
      dilution: results.dilution.avg_dilution * 1.1,
      ltvRisk: results.ltv.exceed_prob * 1.2,
      roe: results.roe.avg_roe * 1.05,
      runway: (assumptions.new_equity_raised || 10000000) / (12000000 / 12) * 0.9,
    },
  ];

  // Data for Comparative Frontier Chart
  const scatterData = options.map((opt) => ({
    name: opt.title,
    dilution: opt.dilution * 100,
    runway: opt.runway,
    ltvRisk: opt.ltvRisk * 100,
  }));

  // Calculate snapshot metrics
  const cashReserves = assumptions.new_equity_raised || 10000000;
  const annualBurnRate = 12000000;
  const totalDebt = assumptions.LoanPrincipal;
  const equityValue = assumptions.initial_equity_value + assumptions.new_equity_raised;

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
              Boardroom Summary
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
        {/* Company Snapshot */}
        <div className={`p-4 rounded-[12px] border ${darkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E5E7EB]'} shadow-[0_1px_4px_rgba(0,0,0,0.08)] mb-6`}>
          <h2 className={`text-[24px] font-semibold mb-4 ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
            Company Snapshot
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="BTC Holdings Value"
              value={results.btc_portfolio_value}
              description="Value of BTC treasury"
              tooltip="Calculated as BTC Treasury Quantity × Current BTC Price"
              icon={DollarSign}
              format="currency"
              darkMode={darkMode}
            />
            <MetricCard
              title="Cash Reserves"
              value={cashReserves}
              description="Available cash"
              tooltip="Cash reserves from new equity raised"
              icon={DollarSign}
              format="currency"
              darkMode={darkMode}
            />
            <MetricCard
              title="Total Debt"
              value={totalDebt}
              description="Outstanding debt"
              tooltip="Total loan principal"
              icon={Briefcase}
              format="currency"
              darkMode={darkMode}
            />
            <MetricCard
              title="Equity Value"
              value={equityValue}
              description="Total equity"
              tooltip="Sum of initial equity and new equity raised"
              icon={Briefcase}
              format="currency"
              darkMode={darkMode}
            />
          </div>
        </div>

        {/* Comparative Frontier Chart */}
        <div className={`p-4 rounded-[12px] border ${darkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E5E7EB]'} shadow-[0_1px_4px_rgba(0,0,0,0.08)] mb-6`}>
          <h2 className={`text-[24px] font-semibold mb-4 ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
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

        {/* Option Summary */}
        <div className={`p-4 rounded-[12px] border ${darkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E5E7EB]'} shadow-[0_1px_4px_rgba(0,0,0,0.08)]`}>
          <h2 className={`text-[24px] font-semibold mb-4 ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
            Decision Options Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {options.map((option) => (
              <div
                key={option.id}
                className={`p-4 rounded-[12px] border ${darkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E5E7EB]'} shadow-[0_1px_4px_rgba(0,0,0,0.08)]`}
              >
                <h3 className={`text-[20px] font-semibold mb-3 ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
                  {option.title}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard
                    title="Dilution"
                    value={option.dilution}
                    description="Equity dilution impact"
                    tooltip="Dilution from new equity, adjusted by NAV paths"
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
              </div>
            ))}
          </div>
        </div>
      </div>

      <DocumentationModal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} darkMode={darkMode} />
    </div>
  );
};

export default BoardroomPage;