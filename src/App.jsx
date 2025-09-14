import { useState, useEffect } from 'react';
import DocumentationModal from './components/DocumentationModal';
import { mapResults } from './components/mapResults';
import LandingPage from './components/LandingPage';
import AssumptionsPage from './components/AssumptionsPage';
import './index.css';
import {
  TrendingDown,
  Calculator,
  Shield,
  DollarSign,
  Target,
  AlertTriangle,
  Moon,
  Sun,
  Briefcase,
  Sliders,
  Home,
  Download,
  FileText,
  Info,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from 'recharts';

// Constants for default assumptions
const DEFAULT_ASSUMPTIONS = {
  BTC_treasury: 1000,
  BTC_purchased: 0,
  BTC_current_market_price: null,
  targetBTCPrice: 117000,
  mu: 0.45,
  sigma: 0.55,
  t: 1.0,
  delta: 0.08,
  initial_equity_value: 90000000,
  new_equity_raised: 5000000,
  IssuePrice: 117000,
  LoanPrincipal: 25000000,
  cost_of_debt: 0.06,
  dilution_vol_estimate: 0.55,
  LTV_Cap: 0.5,
  beta_ROE: 2.5,
  expected_return_btc: 0.45,
  risk_free_rate: 0.04,
  vol_mean_reversion_speed: 0.5,
  long_run_volatility: 0.5,
  paths: 10000,
  jump_intensity: 0.1,
  jump_mean: 0.0,
  jump_volatility: 0.2,
};

// MetricCard component
const MetricCard = ({ title, value, description, tooltip, icon: Icon, format = "number", darkMode }) => (
  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E5E7EB]'} shadow-sm transition-all hover:shadow-md relative group`}>
    <div className="flex items-center justify-between mb-2">
      <Icon className={`w-4 h-4 ${darkMode ? 'text-[#CDA349]' : 'text-[#0A1F44]'}`} />
      {tooltip && (
        <span className="ml-2 text-xs text-[#334155] cursor-help" title={tooltip}>
          <Info className="w-4 h-4" />
        </span>
      )}
    </div>
    <h3 className={`text-sm font-medium mb-1 ${darkMode ? 'text-[#D1D5DB]' : 'text-[#334155]'}`}>
      {title}
    </h3>
    <p className={`text-xl sm:text-2xl font-semibold ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
      {format === "currency" ? `$${(value / 1000000).toFixed(1)}M` :
        format === "percentage" ? `${(value * 100).toFixed(1)}%` :
          value.toFixed(2)}
    </p>
    {description && (
      <p className={`text-xs mt-2 ${darkMode ? 'text-[#9CA3AF]' : 'text-[#6B7280]'}`}>
        {description}
      </p>
    )}
  </div>
);

// API Utilities
const fetchBTCPrice = async (setAssumptions, setError) => {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/btc_price/', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    if (!data.BTC_current_market_price) throw new Error('No BTC price in response');
    setAssumptions((prev) => ({
      ...prev,
      BTC_current_market_price: data.BTC_current_market_price,
      targetBTCPrice: data.BTC_current_market_price,
    }));
  } catch (err) {
    console.error('Failed to fetch BTC price:', err);
    setError('Failed to fetch live BTC price. Using default value.');
    setAssumptions((prev) => ({
      ...prev,
      BTC_current_market_price: 117000,
      targetBTCPrice: 117000,
    }));
  }
};

const validateWhatIfInput = (param, value, setError) => {
  if (['BTC_treasury', 'BTC_current_market_price', 'targetBTCPrice', 'initial_equity_value', 'IssuePrice', 'LoanPrincipal'].includes(param) && value <= 0) {
    setError(`${param} must be positive`);
    return false;
  }
  if (param === 'long_run_volatility' && value === 0) {
    setError('Long-run volatility cannot be zero');
    return false;
  }
  if (param === 'BTC_purchased' && value < 0) {
    setError('BTC_purchased cannot be negative');
    return false;
  }
  if (param === 'paths' && value < 1) {
    setError('Paths must be at least 1');
    return false;
  }
  return true;
};

const generateScenarioPaths = (results, assumptions, metricType = 'nav') => {
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

      if (metricType === 'nav') {
        const collateralValue = totalBTC * interpolatedPrice;
        const nav = (collateralValue + collateralValue * assumptions.delta - assumptions.LoanPrincipal * assumptions.cost_of_debt) /
          (assumptions.initial_equity_value + assumptions.new_equity_raised);
        path.push({ time: t, value: nav });
      } else if (metricType === 'ltv') {
        const ltv = assumptions.LoanPrincipal / (totalBTC * interpolatedPrice);
        path.push({ time: t, value: ltv });
      }
    }
    paths[scenarioName] = path;
  });

  return paths;
};

const getSavedConfigurations = () => {
  try {
    return JSON.parse(localStorage.getItem('savedConfigs') || '{}');
  } catch (err) {
    console.error('Failed to retrieve saved configurations:', err);
    return {};
  }
};

const App = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [currentPage, setCurrentPage] = useState('landing');
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationProgress, setCalculationProgress] = useState(0);
  const [bespokePanelOpen, setBespokePanelOpen] = useState(false);
  const [isWhatIfLoading, setIsWhatIfLoading] = useState(false);
  const [isExportLoading, setIsExportLoading] = useState(false);
  const [exportType, setExportType] = useState(null);
  const [error, setError] = useState(null);
  const [selectedParam, setSelectedParam] = useState('');
  const [paramValue, setParamValue] = useState('');
  const [assumptions, setAssumptions] = useState(DEFAULT_ASSUMPTIONS);
  const [results, setResults] = useState(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState(getSavedConfigurations());
  const [mode, setMode] = useState('manual');
  const [ticker, setTicker] = useState('');

  useEffect(() => {
    fetchBTCPrice(setAssumptions, setError);
  }, []);

  const handleAPIRequest = async (endpoint, body, setLoading, errorMessage) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data;
    } catch (err) {
      console.error(`${errorMessage}:`, err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    setIsCalculating(true);
    setCalculationProgress(0);
    setError(null);

    const progressInterval = setInterval(() => {
      setCalculationProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      const backendResults = await handleAPIRequest(
        '/api/calculate/',
        { assumptions, format: 'json', use_live: true },
        setIsCalculating,
        'Failed to run models. Please try again.'
      );
      setResults(mapResults(backendResults, assumptions.BTC_treasury, assumptions.BTC_current_market_price));
      setCalculationProgress(100);
      setCurrentPage('dashboard');
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsCalculating(false);
        setCalculationProgress(0);
      }, 500);
    }
  };

  const handleWhatIf = async (param, value) => {
    if (!validateWhatIfInput(param, value, setError)) return;
    setIsWhatIfLoading(true);
    setError(null);

    try {
      const backendResults = await handleAPIRequest(
        '/api/what_if/',
        { param, value, assumptions, format: 'json', use_live: true },
        setIsWhatIfLoading,
        'What-If analysis failed. Please try again.'
      );
      setResults(mapResults(backendResults, assumptions.BTC_treasury, assumptions.BTC_current_market_price));
    } catch (err) {
      // Error handled in handleAPIRequest
    }
  };

  const handleExport = async (format, endpoint = '/api/calculate/', param = null, value = null) => {
    if (param && value && !validateWhatIfInput(param, value, setError)) return;

    setIsExportLoading(true);
    setExportType(format.toUpperCase());
    setError(null);

    try {
      const body = { assumptions, format, use_live: true };
      if (param && value) {
        body.param = param;
        body.value = value;
      }
      const response = await fetch(`http://127.0.0.1:8000/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `metrics.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Export ${format} failed:`, err);
      setError(`Failed to export ${format.toUpperCase()}. Please try again.`);
    } finally {
      setTimeout(() => {
        setIsExportLoading(false);
        setExportType(null);
      }, 500);
    }
  };

  const DashboardPage = () => {
    const [selectedMetric, setSelectedMetric] = useState('nav');
    const [visibleScenarios, setVisibleScenarios] = useState({
      'Bull Case': true,
      'Base Case': true,
      'Bear Case': true,
      'Stress Test': true,
    });

    const scenarioPaths = generateScenarioPaths(results, assumptions, selectedMetric);

    const colors = {
      'Bull Case': '#10b981',
      'Base Case': '#3b82f6',
      'Bear Case': '#ef4444',
      'Stress Test': '#CDA349',
    };

    return (
      <div className={`min-h-screen ${darkMode ? 'bg-[#111827]' : 'bg-[#F9FAFB]'} font-inter`}>
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
              <h1 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
                Risk Dashboard
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setBespokePanelOpen(!bespokePanelOpen)}
                className={`px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-[#374151] text-white' : 'bg-[#E5E7EB] text-[#0A1F44]'}`}
              >
                <Sliders className="w-4 h-4 inline-block mr-1" />
                Bespoke Mode
              </button>
              <button
                onClick={() => handleExport('csv')}
                disabled={isExportLoading}
                className={`px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-[#374151] text-white' : 'bg-[#E5E7EB] text-[#0A1F44]'} ${isExportLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#D1D5DB]'}`}
              >
                {isExportLoading && exportType === 'CSV' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2 inline-block"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 inline-block mr-1" />
                    Export CSV
                  </>
                )}
              </button>
              <button
                onClick={() => handleExport('pdf')}
                disabled={isExportLoading}
                className={`px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-[#374151] text-white' : 'bg-[#E5E7EB] text-[#0A1F44]'} ${isExportLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#D1D5DB]'}`}
              >
                {isExportLoading && exportType === 'PDF' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2 inline-block"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 inline-block mr-1" />
                    Export PDF
                  </>
                )}
              </button>
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

        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          {isExportLoading && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1F2937] text-white' : 'bg-white text-[#0A1F44]'} shadow-lg flex items-center space-x-3`}>
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#CDA349] border-t-transparent"></div>
                <p className="text-sm">Preparing {exportType} for download...</p>
              </div>
            </div>
          )}
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {[
              {
                title: "Total BTC Portfolio Value",
                value: results.btc_portfolio_value,
                description: "Raw value of BTC holdings",
                tooltip: "Calculated as BTC Treasury Quantity × Current BTC Price.",
                icon: DollarSign,
                format: "currency"
              },
              {
                title: "Bundle Value",
                value: results.preferred_bundle.bundle_value,
                description: "Weighted value of NAV, dilution, and convertible note",
                tooltip: "Calculated as (0.4 × NAV + 0.3 × Dilution + 0.3 × Convertible Note Value) × (1 - 20% Tax).",
                icon: Briefcase,
                format: "currency"
              },
              {
                title: "NAV Erosion Risk",
                value: results.nav.erosion_prob,
                description: "Probability NAV falls below 90% of average",
                tooltip: "Likelihood that NAV drops below 90% of its average value across simulations.",
                icon: Shield,
                format: "percentage"
              },
              {
                title: "LTV Exceedance",
                value: offensiveltv.exceed_prob,
                description: "Probability LTV exceeds cap",
                tooltip: "Likelihood that the Loan-to-Value ratio exceeds the LTV Cap.",
                icon: AlertTriangle,
                format: "percentage"
              },
              {
                title: "Expected ROE",
                value: results.roe.avg_roe,
                description: "Expected Return on Equity",
                tooltip: "Calculated using CAPM, adjusted for BTC volatility and beta.",
                icon: Target,
                format: "percentage"
              },
              {
                title: "Dilution Risk",
                value: results.dilution.base_dilution,
                description: `Structure: ${results.dilution.structure_threshold_breached ? 'BTC-Collateralized Loan' : 'Convertible Note'}`,
                tooltip: "Dilution impact from new equity, adjusted by NAV paths and volatility.",
                icon: TrendingDown,
                format: "percentage"
              },
            ].map(({ title, value, description, tooltip, icon, format }) => (
              <MetricCard
                key={title}
                title={title}
                value={value}
                description={description}
                tooltip={tooltip}
                icon={icon}
                format={format}
                darkMode={darkMode}
              />
            ))}
          </div>

          {/* Bespoke Mode Panel */}
          {bespokePanelOpen && (
            <div className={`p-4 rounded-xl border mb-6 ${darkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E5E7EB]'} shadow-sm`}>
              <h3 className={`text-lg font-medium mb-3 ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
                Bespoke What-If Analysis
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <select
                  value={selectedParam}
                  onChange={(e) => setSelectedParam(e.target.value)}
                  className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-[#1F2937] border-[#374151] text-white' : 'bg-white border-[#E5E7EB] text-[#0A1F44]'}`}
                >
                  <option value="">Select Parameter</option>
                  {Object.keys(DEFAULT_ASSUMPTIONS).map((key) => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={paramValue}
                  onChange={(e) => setParamValue(e.target.value)}
                  placeholder="Enter value"
                  className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-[#1F2937] border-[#374151] text-white' : 'bg-white border-[#E5E7EB] text-[#0A1F44]'} focus:outline-none focus:ring-2 focus:ring-[#CDA349]`}
                />
                <button
                  onClick={() => handleWhatIf(selectedParam, parseFloat(paramValue))}
                  disabled={!selectedParam || !paramValue || isWhatIfLoading}
                  className={`px-4 py-2 bg-[#0A1F44] text-white rounded-lg text-sm hover:bg-[#1e3a8a] ${(!selectedParam || !paramValue || isWhatIfLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isWhatIfLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2 inline-block"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4 inline-block mr-1" />
                      Run What-If
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Scenario Controls */}
          <div className={`p-4 rounded-xl border mb-6 ${darkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E5E7EB]'} shadow-sm`}>
            <h3 className={`text-lg font-medium mb-3 ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
              Scenario Analysis
            </h3>
            <div className="flex flex-wrap gap-4 mb-4">
              {Object.keys(visibleScenarios).map((scenario) => (
                <label key={scenario} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={visibleScenarios[scenario]}
                    onChange={() => setVisibleScenarios({ ...visibleScenarios, [scenario]: !visibleScenarios[scenario] })}
                    className="rounded text-[#CDA349] focus:ring-[#CDA349]"
                  />
                  <span className={darkMode ? 'text-[#D1D5DB]' : 'text-[#334155]'}>{scenario}</span>
                </label>
              ))}
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setSelectedMetric('nav')}
                className={`px-4 py-2 rounded-lg text-sm ${selectedMetric === 'nav' ? 'bg-[#0A1F44] text-white' : darkMode ? 'bg-[#374151] text-white' : 'bg-[#E5E7EB] text-[#0A1F44]'}`}
              >
                NAV
              </button>
              <button
                onClick={() => setSelectedMetric('ltv')}
                className={`px-4 py-2 rounded-lg text-sm ${selectedMetric === 'ltv' ? 'bg-[#0A1F44] text-white' : darkMode ? 'bg-[#374151] text-white' : 'bg-[#E5E7EB] text-[#0A1F44]'}`}
              >
                LTV
              </button>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E5E7EB]'} shadow-sm`}>
              <h3 className={`text-lg font-medium mb-3 ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
                {selectedMetric === 'nav' ? 'NAV Path Scenarios' : 'LTV Path Scenarios'}
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    margin={{ top: 10, right: 20, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                    <XAxis dataKey="time" tickFormatter={(t) => `${(t * 100).toFixed(0)}%`} stroke={darkMode ? '#D1D5DB' : '#334155'} />
                    <YAxis
                      domain={selectedMetric === 'nav' ? [0, 'auto'] : [0, 1]}
                      tickFormatter={(v) => selectedMetric === 'nav' ? v.toFixed(2) : `${(v * 100).toFixed(1)}%`}
                      stroke={darkMode ? '#D1D5DB' : '#334155'}
                    />
                    <Tooltip
                      formatter={(value) => selectedMetric === 'nav' ? value.toFixed(2) : `${(value * 100).toFixed(1)}%`}
                      labelFormatter={(label) => `Time: ${(label * 100).toFixed(0)}%`}
                      contentStyle={darkMode ? { backgroundColor: '#1F2937', border: '1px solid #374151' } : { backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
                    />
                    <Legend />
                    {Object.keys(scenarioPaths).map((scenario) => (
                      visibleScenarios[scenario] && (
                        <Line
                          key={scenario}
                          type="monotone"
                          dataKey="value"
                          data={scenarioPaths[scenario]}
                          name={scenario}
                          stroke={colors[scenario]}
                          strokeWidth={2}
                          dot={false}
                        />
                      )
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E5E7EB]'} shadow-sm`}>
              <h3 className={`text-lg font-medium mb-3 ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
                Scenario Distribution
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    margin={{ top: 10, right: 20, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                    <XAxis dataKey="time" tickFormatter={(t) => `${(t * 100).toFixed(0)}%`} stroke={darkMode ? '#D1D5DB' : '#334155'} />
                    <YAxis
                      domain={selectedMetric === 'nav' ? [0, 'auto'] : [0, 1]}
                      tickFormatter={(v) => selectedMetric === 'nav' ? v.toFixed(2) : `${(v * 100).toFixed(1)}%`}
                      stroke={darkMode ? '#D1D5DB' : '#334155'}
                    />
                    <Tooltip
                      formatter={(value) => selectedMetric === 'nav' ? value.toFixed(2) : `${(value * 100).toFixed(1)}%`}
                      labelFormatter={(label) => `Time: ${(label * 100).toFixed(0)}%`}
                      contentStyle={darkMode ? { backgroundColor: '#1F2937', border: '1px solid #374151' } : { backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
                    />
                    <Legend />
                    {Object.keys(scenarioPaths).map((scenario) => (
                      visibleScenarios[scenario] && (
                        <Area
                          key={scenario}
                          type="monotone"
                          dataKey="value"
                          data={scenarioPaths[scenario]}
                          name={scenario}
                          stroke={colors[scenario]}
                          fill={colors[scenario]}
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                      )
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
        <DocumentationModal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} darkMode={darkMode} />
      </div>
    );
  };

  return (
    <>
      {currentPage === 'landing' && (
        <LandingPage
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          setCurrentPage={setCurrentPage}
        />
      )}
      {currentPage === 'assumptions' && (
        <AssumptionsPage
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          setCurrentPage={setCurrentPage}
          assumptions={assumptions}
          setAssumptions={setAssumptions}
          savedConfigs={savedConfigs}
          setSavedConfigs={setSavedConfigs}
          isCalculating={isCalculating}
          calculationProgress={calculationProgress}
          setIsDocModalOpen={setIsDocModalOpen}
          isDocModalOpen={isDocModalOpen}
          error={error}
          setError={setError}
          ticker={ticker}
          setTicker={setTicker}
          mode={mode}
          setMode={setMode}
          handleCalculate={handleCalculate}
        />
      )}
      {currentPage === 'dashboard' && results && <DashboardPage />}
    </>
  );
};

export default App;