import { useState, useEffect, useCallback } from 'react';
import {
  Home,
  Sliders,
  Sun,
  Moon,
  Info,
  Calculator,
  ChevronRight,
  ChevronDown,
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
import { BarChart, Bar } from 'recharts';

const WhatIfPage = ({
  darkMode,
  setDarkMode,
  setCurrentPage,
  assumptions,
  setAssumptions,
  results,
  handleCalculate,
  isCalculating,
  calculationProgress,
  setIsDocModalOpen,
  isDocModalOpen,
  error,
  setError,
}) => {
  // State for drawer and sliders
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [sigmaAdjustment, setSigmaAdjustment] = useState(0); // ±10% for volatility
  const [advAdjustment, setAdvAdjustment] = useState(0); // ±10% for ADV
  const [haircutAdjustment, setHaircutAdjustment] = useState(0); // ±10% for haircut
  const [tempResults, setTempResults] = useState(results); // Temporary results for real-time updates
  const [successMessage, setSuccessMessage] = useState(null);

  // Bootstrap resampling for real-time updates (simplified approximation)
  const bootstrapResample = useCallback(() => {
    // Placeholder for bootstrap resampling logic
    // Adjust results based on slider values (simplified for demo)
    const adjustedResults = JSON.parse(JSON.stringify(results)); // Deep copy
    const sigmaFactor = 1 + sigmaAdjustment / 100;
    const advFactor = 1 + advAdjustment / 100;
    const haircutFactor = 1 + haircutAdjustment / 100;

    // Example adjustments (replace with actual resampling logic)
    adjustedResults.roe.avg_roe_btc_loan *= sigmaFactor;
    adjustedResults.roe.avg_roe_convertible *= sigmaFactor;
    adjustedResults.roe.avg_roe_hybrid *= sigmaFactor;
    adjustedResults.dilution.avg_btc_loan_dilution *= advFactor;
    adjustedResults.dilution.avg_convertible_dilution *= advFactor;
    adjustedResults.dilution.avg_hybrid_dilution *= advFactor;
    adjustedResults.nav.avg_nav_btc_loan *= haircutFactor;
    adjustedResults.nav.avg_nav_convertible *= haircutFactor;
    adjustedResults.nav.avg_nav_hybrid *= haircutFactor;

    setTempResults(adjustedResults);
  }, [sigmaAdjustment, advAdjustment, haircutAdjustment, results]);

  // Run resampling whenever sliders change
  useEffect(() => {
    bootstrapResample();
  }, [sigmaAdjustment, advAdjustment, haircutAdjustment, bootstrapResample]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle commit change (full simulation re-run)
  const handleCommitChange = () => {
    setAssumptions((prev) => ({
      ...prev,
      sigma: prev.sigma * (1 + sigmaAdjustment / 100),
      adv: prev.adv ? prev.adv * (1 + advAdjustment / 100) : prev.adv, // Assuming ADV exists
      haircut: prev.haircut ? prev.haircut * (1 + haircutAdjustment / 100) : prev.haircut, // Assuming haircut exists
    }));
    handleCalculate();
    setSuccessMessage('Full simulation re-run successfully.');
  };

  // Data for scatter plot (Efficient Frontier)
  const scatterData = [
    {
      name: 'BTC-Backed Loan',
      dilution: tempResults.dilution.avg_btc_loan_dilution * 100,
      runway: tempResults.runway.btc_loan_runway_months,
    },
    {
      name: 'Convertible Note',
      dilution: tempResults.dilution.avg_convertible_dilution * 100,
      runway: tempResults.runway.convertible_runway_months,
    },
    {
      name: 'Hybrid Structure',
      dilution: tempResults.dilution.avg_hybrid_dilution * 100,
      runway: tempResults.runway.hybrid_runway_months,
    },
  ];

  // Data for scenario comparison bar chart
  const scenarioData = [
    {
      name: 'Bull',
      btcLoan: tempResults.scenarios?.bull?.btc_loan_roe || 0.1,
      convertible: tempResults.scenarios?.bull?.convertible_roe || 0.1,
      hybrid: tempResults.scenarios?.bull?.hybrid_roe || 0.1,
    },
    {
      name: 'Base',
      btcLoan: tempResults.scenarios?.base?.btc_loan_roe || 0.08,
      convertible: tempResults.scenarios?.base?.convertible_roe || 0.08,
      hybrid: tempResults.scenarios?.base?.hybrid_roe || 0.08,
    },
    {
      name: 'Bear',
      btcLoan: tempResults.scenarios?.bear?.btc_loan_roe || 0.05,
      convertible: tempResults.scenarios?.bear?.convertible_roe || 0.05,
      hybrid: tempResults.scenarios?.bear?.hybrid_roe || 0.05,
    },
    {
      name: 'Stress',
      btcLoan: tempResults.scenarios?.stress?.btc_loan_roe || 0.02,
      convertible: tempResults.scenarios?.stress?.convertible_roe || 0.02,
      hybrid: tempResults.scenarios?.stress?.hybrid_roe || 0.02,
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
              What-If Analysis
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
      <div className="max-w-7xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Panel (2/3 width) */}
        <div className="lg:col-span-2">
          {/* Option Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[
              { title: 'BTC-Backed Loan', dilution: tempResults.dilution.avg_btc_loan_dilution, runway: tempResults.runway.btc_loan_runway_months, roe: tempResults.roe.avg_roe_btc_loan },
              { title: 'Convertible Note', dilution: tempResults.dilution.avg_convertible_dilution, runway: tempResults.runway.convertible_runway_months, roe: tempResults.roe.avg_roe_convertible },
              { title: 'Hybrid Structure', dilution: tempResults.dilution.avg_hybrid_dilution, runway: tempResults.runway.hybrid_runway_months, roe: tempResults.roe.avg_roe_hybrid },
            ].map((option, index) => (
              <div
                key={index}
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
                    {option.title.split(' ')[0]}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <MetricCard
                    title="Dilution"
                    value={option.dilution}
                    description="Equity dilution impact"
                    tooltip="Dilution from new equity or convertible debt"
                    icon={Sliders}
                    format="percentage"
                    darkMode={darkMode}
                    numberClassName="text-[26px] font-bold font-roboto-mono"
                    highlight={option.dilution > 0.1 ? 'red' : null}
                  />
                  <MetricCard
                    title="Runway"
                    value={option.runway}
                    description="Months of cash reserves"
                    tooltip="Calculated as Cash Reserves ÷ Monthly Burn Rate"
                    icon={Sliders}
                    format="number"
                    darkMode={darkMode}
                    numberClassName="text-[26px] font-bold font-roboto-mono"
                    highlight={option.runway < 12 ? 'red' : null}
                  />
                  <MetricCard
                    title="Expected ROE"
                    value={option.roe}
                    description="Return on Equity"
                    tooltip="Adjusted for volatility and structure-specific leverage"
                    icon={Sliders}
                    format="percentage"
                    darkMode={darkMode}
                    numberClassName="text-[26px] font-bold font-roboto-mono"
                  />
                </div>
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
              Sensitivity Analysis
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

        {/* Right Drawer (1/3 width) */}
        <div className="lg:col-span-1">
          <div
            className={`p-4 rounded-2xl border shadow-md transform hover:scale-101 transition-transform bg-gradient-to-b ${
              darkMode ? 'bg-slate-800 border-slate-700 from-slate-800 to-slate-900' : 'bg-white border-slate-200 from-white to-slate-100'
            }`}
          >
            <button
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className={`flex items-center justify-between w-full text-[22px] font-semibold tracking-tight font-inter-tight mb-4 ${
                darkMode ? 'text-slate-100' : 'text-slate-900'
              }`}
            >
              What-If Parameters
              {isDrawerOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
            {isDrawerOpen && (
              <div className="space-y-4">
                {/* Slider for Sigma */}
                <div>
                  <label className={`text-[14px] font-inter ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Volatility (σ) Adjustment (±10%)
                  </label>
                  <input
                    type="range"
                    min={-10}
                    max={10}
                    step={0.1}
                    value={sigmaAdjustment}
                    onChange={(e) => setSigmaAdjustment(Number(e.target.value))}
                    className="w-full h-2 bg-gray-400 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #10b981 ${((sigmaAdjustment + 10) / 20) * 100}%, #4b5563 ${((sigmaAdjustment + 10) / 20) * 100}%, #4b5563 100%)`,
                    }}
                  />
                  <div className={`text-[14px] font-roboto-mono text-right ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {sigmaAdjustment.toFixed(1)}%
                  </div>
                </div>

                {/* Slider for ADV */}
                <div>
                  <label className={`text-[14px] font-inter ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    ADV Adjustment (±10%)
                  </label>
                  <input
                    type="range"
                    min={-10}
                    max={10}
                    step={0.1}
                    value={advAdjustment}
                    onChange={(e) => setAdvAdjustment(Number(e.target.value))}
                    className="w-full h-2 bg-gray-400 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #10b981 ${((advAdjustment + 10) / 20) * 100}%, #4b5563 ${((advAdjustment + 10) / 20) * 100}%, #4b5563 100%)`,
                    }}
                  />
                  <div className={`text-[14px] font-roboto-mono text-right ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {advAdjustment.toFixed(1)}%
                  </div>
                </div>

                {/* Slider for Haircut */}
                <div>
                  <label className={`text-[14px] font-inter ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Haircut Adjustment (±10%)
                  </label>
                  <input
                    type="range"
                    min={-10}
                    max={10}
                    step={0.1}
                    value={haircutAdjustment}
                    onChange={(e) => setHaircutAdjustment(Number(e.target.value))}
                    className="w-full h-2 bg-gray-400 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #10b981 ${((haircutAdjustment + 10) / 20) * 100}%, #4b5563 ${((haircutAdjustment + 10) / 20) * 100}%, #4b5563 100%)`,
                    }}
                  />
                  <div className={`text-[14px] font-roboto-mono text-right ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    {haircutAdjustment.toFixed(1)}%
                  </div>
                </div>

                {/* Commit Change Button */}
                <button
                  onClick={handleCommitChange}
                  disabled={isCalculating}
                  className={`w-full px-6 py-3 bg-emerald-500 text-white rounded-lg text-[16px] font-inter font-medium hover:bg-emerald-600 active:bg-emerald-700 transform hover:scale-101 transition-transform flex items-center justify-center ${
                    isCalculating ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isCalculating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Calculating... {calculationProgress}%
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4 mr-2" />
                      Commit Change
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className={`p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-[14px] font-inter mt-4 max-w-7xl mx-auto`}>
          {successMessage}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className={`p-4 rounded-2xl bg-red-100 border border-red-300 text-red-500 text-[14px] font-inter mt-4 max-w-7xl mx-auto`}>
          {error}
        </div>
      )}

      <DocumentationModal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} darkMode={darkMode} />
    </div>
  );
};

export default WhatIfPage;