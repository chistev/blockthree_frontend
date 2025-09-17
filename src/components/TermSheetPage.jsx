import { useState } from 'react';
import {
  Home,
  Sliders,
  Sun,
  Moon,
  Info,
  Download,
  FileText,
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
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const TermSheetPage = ({
  darkMode,
  setDarkMode,
  setCurrentPage,
  results,
  assumptions,
  setIsDocModalOpen,
  isDocModalOpen,
  error,
  handleExport,
}) => {
  const [activeTab, setActiveTab] = useState('ltv_stress');

  // Helper function to generate scenario paths for LTV
  const generateScenarioPaths = (results, assumptions, metricType = 'ltv') => {
    const scenarios = results.scenario_metrics;
    const timeSteps = 100;
    const paths = {};

    Object.entries(scenarios).forEach(([scenarioName, metrics]) => {
      const path = [];
      const initialBTCPrice = assumptions.BTC_current_market_price;
      const finalBTCPrice = metrics.btc_price;
      const totalBTC = assumptions.BTC_treasury + assumptions.BTC_purchased;

      for (let i = 0; i <= timeSteps; i++) {
        const t = i / timeSteps;
        const interpolatedPrice = initialBTCPrice + t * (finalBTCPrice - initialBTCPrice);

        if (metricType === 'ltv') {
          const ltv = assumptions.LoanPrincipal / (totalBTC * interpolatedPrice);
          path.push({ time: t, value: ltv });
        }
      }
      paths[scenarioName] = path;
    });

    return paths;
  };

  // Generate LTV Paths
  const ltvPaths = generateScenarioPaths(results, assumptions, 'ltv');

  // Generate Runway Calculator Data
  const generateRunwayData = () => {
    const cashReserves = assumptions.new_equity_raised || 10000000;
    const annualBurnRate = 12000000; // Assume $1M/month
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      cash: cashReserves - (annualBurnRate / 12) * (i + 1),
    }));
    return months.filter((d) => d.cash >= 0); // Only show non-negative cash
  };

  // Colors for charts
  const colors = {
    'Bull Case': '#10b981',
    'Base Case': '#3b82f6',
    'Bear Case': '#ef4444',
    'Stress Test': '#CDA349',
  };

  // Tab content rendering
  const renderTabContent = () => {
    switch (activeTab) {
      case 'ltv_stress':
        return (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                <XAxis
                  dataKey="time"
                  tickFormatter={(t) => `${(t * 100).toFixed(0)}%`}
                  stroke={darkMode ? '#D1D5DB' : '#334155'}
                />
                <YAxis
                  domain={[0, 1]}
                  tickFormatter={(v) => `${(v * 100).toFixed(1)}%`}
                  stroke={darkMode ? '#D1D5DB' : '#334155'}
                />
                <Tooltip
                  formatter={(value) => `${(value * 100).toFixed(1)}%`}
                  labelFormatter={(label) => `Time: ${(label * 100).toFixed(0)}%`}
                  contentStyle={
                    darkMode
                      ? { backgroundColor: '#1F2937', border: '1px solid #374151' }
                      : { backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }
                  }
                />
                <Legend />
                {Object.keys(ltvPaths).map(
                  (scenario) =>
                    ltvPaths[scenario] && (
                      <Area
                        key={scenario}
                        type="monotone"
                        dataKey="value"
                        data={ltvPaths[scenario]}
                        name={scenario}
                        stroke={colors[scenario]}
                        fill={colors[scenario]}
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    )
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );
      case 'runway_calculator':
        return (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={generateRunwayData()} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                <XAxis dataKey="month" stroke={darkMode ? '#D1D5DB' : '#334155'} />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                  stroke={darkMode ? '#D1D5DB' : '#334155'}
                />
                <Tooltip
                  formatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                  labelFormatter={(label) => `Month: ${label}`}
                  contentStyle={
                    darkMode
                      ? { backgroundColor: '#1F2937', border: '1px solid #374151' }
                      : { backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }
                  }
                />
                <Line
                  type="monotone"
                  dataKey="cash"
                  stroke={darkMode ? '#CDA349' : '#0A1F44'}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#111827]' : 'bg-[#F9FAFB]'} font-inter p-4 sm:p-6`}>
      <nav className={`px-4 sm:px-8 py-3 border-b ${darkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E5E7EB]'}`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center space-x-4 mb-3 sm:mb-0">
            <button
              onClick={() => setCurrentPage('landing')}
              className={`p-2 rounded-[12px] text-[14px] ${darkMode ? 'bg-[#374151] text-white' : 'bg-[#E5E7EB] text-[#0A1F44]'}`}
              title="Back to Home"
            >
              <Home className="w-4 h-4 inline-block mr-1" />
              Home
            </button>
            <button
              onClick={() => setCurrentPage('assumptions')}
              className={`p-2 rounded-[12px] text-[14px] ${darkMode ? 'bg-[#374151] text-white' : 'bg-[#E5E7EB] text-[#0A1F44]'}`}
              title="Back to Assumptions"
            >
              <Sliders className="w-4 h-4 inline-block mr-1" />
              Assumptions
            </button>
            <h1 className={`text-[28px] font-semibold ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
              Term Sheet Drill-Down
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsDocModalOpen(true)}
              className={`px-3 py-2 rounded-[12px] text-[14px] ${darkMode ? 'bg-[#374151] text-white' : 'bg-[#E5E7EB] text-[#0A1F44]'}`}
            >
              <Info className="w-4 h-4 inline-block mr-1" />
              Learn More
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-[12px] ${darkMode ? 'bg-[#374151] text-white' : 'bg-[#E5E7EB] text-[#0A1F44]'}`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Panel: Term Sheet Summary (60%) */}
        <div className="lg:col-span-3">
          <div className={`p-4 rounded-[12px] border ${darkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E5E7EB]'} shadow-[0_1px_4px_rgba(0,0,0,0.08)]`}>
            <h2 className={`text-[24px] font-semibold mb-4 ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
              Term Sheet Summary
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                title="Bundle Value"
                value={results.preferred_bundle.bundle_value}
                description="Weighted value of NAV, dilution, and convertible note"
                tooltip="Calculated as (0.4 × NAV + 0.3 × Dilution + 0.3 × Convertible Note Value) × (1 - 20% Tax)"
                icon={Briefcase}
                format="currency"
                darkMode={darkMode}
              />
              <MetricCard
                title="NAV Erosion Risk"
                value={results.nav.erosion_prob}
                description="Probability NAV falls below 90% of average"
                tooltip="Likelihood that NAV drops below 90% of its average value across simulations"
                icon={Shield}
                format="percentage"
                darkMode={darkMode}
              />
              <MetricCard
                title="LTV Exceedance"
                value={results.ltv.exceed_prob}
                description="Probability LTV exceeds cap"
                tooltip="Likelihood that the Loan-to-Value ratio exceeds the LTV Cap"
                icon={AlertTriangle}
                format="percentage"
                darkMode={darkMode}
              />
              <MetricCard
                title="Expected ROE"
                value={results.roe.avg_roe}
                description="Expected Return on Equity"
                tooltip="Calculated using CAPM, adjusted for BTC volatility and beta"
                icon={Target}
                format="percentage"
                darkMode={darkMode}
              />
              <MetricCard
                title="Dilution Risk"
                value={results.dilution.base_dilution}
                description={`Structure: ${
                  results.dilution.structure_threshold_breached
                    ? 'BTC-Collateralized Loan'
                    : 'Convertible Note'
                }`}
                tooltip="Dilution impact from new equity, adjusted by NAV paths and volatility"
                icon={TrendingDown}
                format="percentage"
                darkMode={darkMode}
              />
            </div>
          </div>
        </div>

        {/* Right Panel: Tabbed Visualizations (40%) */}
        <div className="lg:col-span-2">
          <div className={`p-4 rounded-[12px] border ${darkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E5E7EB]'} shadow-[0_1px_4px_rgba(0,0,0,0.08)]`}>
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { id: 'ltv_stress', label: 'LTV Stress' },
                { id: 'runway_calculator', label: 'Runway Calculator' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-[12px] text-[14px] font-medium ${
                    activeTab === tab.id
                      ? 'bg-[#0A1F44] text-white'
                      : darkMode
                      ? 'bg-[#374151] text-white'
                      : 'bg-[#E5E7EB] text-[#0A1F44]'
                  } hover:bg-[#1e3a8a] hover:text-white transition-colors`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Export and Boardroom Buttons */}
      <div className="max-w-7xl mx-auto mt-6 flex gap-4">
        <button
          onClick={() => handleExport('csv')}
          className={`flex-1 px-6 py-3 bg-[#0A1F44] text-white rounded-[12px] text-[16px] font-medium hover:bg-[#1e3a8a] flex items-center justify-center transition-colors`}
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </button>
        <button
          onClick={() => handleExport('pdf')}
          className={`flex-1 px-6 py-3 bg-[#0A1F44] text-white rounded-[12px] text-[16px] font-medium hover:bg-[#1e3a8a] flex items-center justify-center transition-colors`}
        >
          <FileText className="w-4 h-4 mr-2" />
          Export PDF
        </button>
        <button
          onClick={() => setCurrentPage('boardroom')}
          className={`flex-1 px-6 py-3 bg-[#0A1F44] text-white rounded-[12px] text-[16px] font-medium hover:bg-[#1e3a8a] flex items-center justify-center transition-colors`}
        >
          <Briefcase className="w-4 h-4 mr-2" />
          Boardroom Mode
        </button>
      </div>

      {error && (
        <p className="text-red-500 text-[14px] mt-4 text-center max-w-7xl mx-auto">{error}</p>
      )}

      <DocumentationModal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} darkMode={darkMode} />
    </div>
  );
};

export default TermSheetPage;