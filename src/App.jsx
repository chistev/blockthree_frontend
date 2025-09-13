import { useState, useEffect, useCallback } from 'react';
import HybridInput from './components/HybridInput';
import InputField from './components/InputField';
import DocumentationModal from './components/DocumentationModal';
import AssumptionsPage from './components/AssumptionsPage';
import { mapResults } from './components/mapResults';
import { handleExport, validateWhatIfInput } from './utils/handleExport';
import './index.css';
import {
  TrendingDown,
  Shield,
  DollarSign,
  Target,
  AlertTriangle,
  Moon,
  Info,
  Sun,
  Briefcase,
  Play,
  Sliders,
  Home,
  Download,
  FileText,
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

// App.jsx
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
  shares_basic: 1000000,
  shares_fd: 1100000,
  opex_monthly: 100000,
  capex_schedule: [],
  tax_rate: 0.2,
  nols: 0,
  // New capital routes/capacity fields
  adv_30d: 1000000, // 30-day average daily volume ($)
  atm_pct_adv: 0.25, // ATM as % of average daily volume
  pipe_discount: 0.1, // PIPE discount (e.g., 10%)
  fees_ecm: 0.03, // ECM fees (e.g., 3%)
  fees_oid: 0.02, // OID fees (e.g., 2%)
};

const MetricCard = ({ title, value, description, tooltip, icon: Icon, format = "number", darkMode }) => (
  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} transition-all hover:shadow-lg relative group`}>
    <div className="flex items-center justify-between mb-3">
      <Icon className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
      {tooltip && (
        <span className="ml-2 text-xs text-gray-500 cursor-help" title={tooltip}>
          <Info className="w-4 h-4" />
        </span>
      )}
    </div>
    <h3 className={`text-xs font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>
      {title}
    </h3>
    <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      {format === "currency" ? `$${(value / 1000000).toFixed(1)}M` :
        format === "percentage" ? `${(value * 100).toFixed(1)}%` :
          value.toFixed(2)}
    </p>
    {description && (
      <p className={`text-xs mt-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
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
  const [mode, setMode] = useState('default');
  const [secAssumptions, setSecAssumptions] = useState({});
  const [ticker, setTicker] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsedSecData, setParsedSecData] = useState(null);
  const [privateFile, setPrivateFile] = useState(null);
  const [parsedPrivateData, setParsedPrivateData] = useState(null);
  const [isParsingPrivateFile, setIsParsingPrivateFile] = useState(false);
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
      setCalculationProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      const body = { assumptions, format: 'json', use_live: true };
      if (mode === 'sec' || mode === 'private') {
        body.secAssumptions = secAssumptions;
      }
      const backendResults = await handleAPIRequest(
        '/api/calculate/',
        body,
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

  // App.jsx (handlePrivateFileUpload)
const handlePrivateFileUpload = async (file) => {
  setIsParsingPrivateFile(true);
  const formData = new FormData();
  formData.append('file', file);
  try {
    const response = await fetch('http://127.0.0.1:8000/api/private_parse/', {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    setParsedPrivateData({
      total_equity: data.total_equity,
      total_debt: data.total_debt,
      cash_reserves: data.cash_reserves,
      shares_basic: data.shares_basic,
      shares_fd: data.shares_fd,
      opex_monthly: data.opex_monthly,
      capex_schedule: data.capex_schedule,
      tax_rate: data.tax_rate,
      nols: data.nols,
      adv_30d: data.adv_30d,
      atm_pct_adv: data.atm_pct_adv,
      pipe_discount: data.pipe_discount,
      fees_ecm: data.fees_ecm,
      fees_oid: data.fees_oid,
    });
    setError(null);
  } catch (err) {
    console.error('Failed to parse private file:', err);
    setError('Failed to parse private file. Please try again.');
  } finally {
    setIsParsingPrivateFile(false);
  }
};

  const applyPrivateData = (parsedData) => {
    setSecAssumptions({
      sec_initial_equity_value: parsedData.total_equity != null ? parsedData.total_equity : assumptions.initial_equity_value,
      sec_loan_principal: parsedData.total_debt != null ? parsedData.total_debt : assumptions.LoanPrincipal,
      sec_cash_reserves: parsedData.cash_reserves != null ? parsedData.cash_reserves : 0,
    });
    setParsedPrivateData(null);
  };

  const LandingPage = () => (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-gray-50'} px-4 sm:px-8`}>
      <div className="text-center max-w-4xl mx-auto">
        <h1 className={`text-3xl sm:text-5xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Block Three Capital
        </h1>
        <h2 className={`text-lg sm:text-2xl mb-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
          Precision Risk + Treasury Structuring for Bitcoin Institutions
        </h2>
        <p className={`text-base sm:text-lg mb-8 max-w-2xl mx-auto ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>
          Optimize BTC treasuries with elite models for NAV audit, dilution mitigation, convertibles, LTV loans, ROE optimization, and preferred bundles.
        </p>
        <button
          onClick={() => setCurrentPage('assumptions')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg text-base sm:text-lg font-semibold hover:bg-blue-700 transition-colors flex items-center mx-auto"
        >
          <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Get Started
        </button>
      </div>
    </div>
  );

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
      'Stress Test': '#f59e0b',
    };

    return (
      <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
        <nav className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border-b px-4 sm:px-8 py-3`}>
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-3 sm:mb-0">
              <button
                onClick={() => setCurrentPage('landing')}
                className={`p-2 rounded-lg flex items-center text-sm ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                title="Back to Home"
              >
                <Home className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                Home
              </button>
              <button
                onClick={() => setCurrentPage('assumptions')}
                className={`p-2 rounded-lg flex items-center text-sm ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                title="Back to Assumptions"
              >
                <Sliders className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                Assumptions
              </button>
              <h1 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Block Three Capital - Risk Dashboard
              </h1>
            </div>
            <div className="flex flex-wrap items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => setBespokePanelOpen(!bespokePanelOpen)}
                className={`px-3 py-2 rounded-lg flex items-center text-sm ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700'}`}
              >
                <Sliders className="w-4 h-4 mr-1" />
                Bespoke Mode
              </button>
              <button
                onClick={() => handleExport('csv', '/api/calculate/', null, null, assumptions, setError, setIsExportLoading, setExportType)}
                disabled={isExportLoading}
                className={`px-3 py-2 rounded-lg flex items-center text-sm ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700'} ${isExportLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'}`}
              >
                {isExportLoading && exportType === 'CSV' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-1" />
                    Export CSV
                  </>
                )}
              </button>
              <button
                onClick={() => handleExport('pdf', '/api/calculate/', null, null, assumptions, setError, setIsExportLoading, setExportType)}
                disabled={isExportLoading}
                className={`px-3 py-2 rounded-lg flex items-center text-sm ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700'} ${isExportLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'}`}
              >
                {isExportLoading && exportType === 'PDF' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-1" />
                    Export PDF
                  </>
                )}
              </button>
              <button
                onClick={() => setIsDocModalOpen(true)}
                className={`px-3 py-2 rounded-lg flex items-center text-sm ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700'}`}
              >
                <Info className="w-4 h-4 mr-1" />
                Learn More
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'}`}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </nav>

        <div className="p-4 sm:p-8">
          {isExportLoading && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className={`p-6 rounded-lg ${darkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'} shadow-lg flex items-center space-x-3`}>
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                <p className="text-sm">Preparing {exportType} for download...</p>
              </div>
            </div>
          )}
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
            {[
              {
                title: "Total BTC Portfolio Value",
                value: results.btc_portfolio_value,
                description: "Raw value of BTC holdings (Treasury × Current Price)",
                tooltip: "Calculated as BTC Treasury Quantity × Current BTC Price, reflecting the total market value of your Bitcoin holdings.",
                icon: DollarSign,
                format: "currency",
              },
              {
                title: "Structured Product Bundle Value",
                value: results.preferred_bundle.bundle_value,
                description: "Weighted value of NAV, dilution, and convertible note",
                tooltip: "Calculated as (0.4 × NAV + 0.3 × Dilution + 0.3 × Convertible Note Value) × (1 - 20% Tax), accounting for debt costs and simulated BTC price paths.",
                icon: Briefcase,
                format: "currency",
              },
              {
                title: "NAV Erosion Risk",
                value: results.nav.erosion_prob,
                description: "Probability NAV falls below 90% of its average across simulations",
                tooltip: "The likelihood that the Net Asset Value drops below 90% of its average value across all simulated BTC price paths, indicating potential downside risk.",
                icon: Shield,
                format: "percentage",
              },
              {
                title: "LTV Exceedance",
                value: results.ltv.exceed_prob,
                description: "Probability LTV exceeds the cap",
                tooltip: "The likelihood that the Loan-to-Value ratio exceeds the specified LTV Cap, based on simulated BTC price paths.",
                icon: AlertTriangle,
                format: "percentage",
              },
              {
                title: "Expected ROE",
                value: results.roe.avg_roe,
                description: "Expected Return on Equity",
                tooltip: "Calculated using the CAPM model, adjusted for BTC volatility and beta, reflecting the expected return on equity.",
                icon: Target,
                format: "percentage",
              },
              {
                title: "Dilution Risk",
                value: results.dilution.base_dilution,
                description: `Base dilution from new equity raised. Structure: ${
                  results.dilution.structure_threshold_breached ? 'BTC-Collateralized Loan' : 'Convertible Note'
                }`,
                tooltip: "The dilution impact from new equity, adjusted by simulated NAV paths and volatility estimate. Structure chosen based on base dilution threshold (10%).",
                icon: TrendingDown,
                format: "percentage",
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8">
            <div className={`p-4 sm:p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-base sm:text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                NAV Path Simulation
              </h3>
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={results.nav.nav_paths}
                    margin={{ top: 10, right: 30, left: 30, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis
                      dataKey="time"
                      stroke={darkMode ? '#9ca3af' : '#6b7280'}
                      name="Time (Normalized)"
                      label={{ value: 'Time (Normalized)', position: 'insideBottom', offset: -15, fill: darkMode ? '#9ca3af' : '#6b7280' }}
                      padding={{ left: 10, right: 10 }}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value.toFixed(2)}
                    />
                    <YAxis
                      stroke={darkMode ? '#9ca3af' : '#6b7280'}
                      name="NAV"
                      label={{ value: 'NAV', angle: -90, position: 'insideLeft', offset: -20, fill: darkMode ? '#9ca3af' : '#6b7280' }}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                        border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                        borderRadius: '8px',
                      }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={`p-4 sm:p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-base sm:text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                LTV Risk Distribution
              </h3>
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={results.ltv.ltv_distribution}
                    margin={{ top: 10, right: 30, left: 30, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis
                      dataKey="ltv"
                      stroke={darkMode ? '#9ca3af' : '#6b7280'}
                      name="LTV Ratio"
                      label={{ value: 'LTV Ratio', position: 'insideBottom', offset: -15, fill: darkMode ? '#9ca3af' : '#6b7280' }}
                      padding={{ left: 10, right: 10 }}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => parseFloat(value).toFixed(2)}
                    />
                    <YAxis
                      stroke={darkMode ? '#9ca3af' : '#6b7280'}
                      name="Frequency"
                      label={{ value: 'Frequency', angle: -90, position: 'insideLeft', offset: -20, fill: darkMode ? '#9ca3af' : '#6b7280' }}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                        border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="frequency"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className={`p-4 sm:p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} mb-8`}>
            <h3 className={`text-base sm:text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Scenario Comparison
            </h3>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
              <div className="flex space-x-4 mb-4 sm:mb-0">
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                >
                  <option value="nav">NAV Paths</option>
                  <option value="ltv">LTV Paths</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.keys(visibleScenarios).map((scenario) => (
                  <label key={scenario} className="flex items-center space-x-1 text-sm">
                    <input
                      type="checkbox"
                      checked={visibleScenarios[scenario]}
                      onChange={() =>
                        setVisibleScenarios({
                          ...visibleScenarios,
                          [scenario]: !visibleScenarios[scenario],
                        })
                      }
                      className="rounded text-blue-600"
                    />
                    <span className={darkMode ? 'text-slate-300' : 'text-gray-700'}>{scenario}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                  <XAxis
                    dataKey="time"
                    stroke={darkMode ? '#9ca3af' : '#6b7280'}
                    name="Time (Normalized)"
                    label={{ value: 'Time (Normalized)', position: 'insideBottomRight', offset: -10, fill: darkMode ? '#9ca3af' : '#6b7280' }}
                  />
                  <YAxis
                    stroke={darkMode ? '#9ca3af' : '#6b7280'}
                    name={selectedMetric === 'nav' ? 'NAV' : 'LTV Ratio'}
                    label={{
                      value: selectedMetric === 'nav' ? 'NAV' : 'LTV Ratio',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 10,
                      fill: darkMode ? '#9ca3af' : '#6b7280',
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                      border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px',
                    }}
                    formatter={(value, name) => [
                      selectedMetric === 'nav' ? value.toFixed(2) : (value * 100).toFixed(1) + '%',
                      name,
                    ]}
                  />
                  <Legend />
                  {Object.entries(scenarioPaths)
                    .filter(([scenario]) => visibleScenarios[scenario])
                    .map(([scenario, path]) => (
                      <Line
                        key={scenario}
                        type="monotone"
                        dataKey="value"
                        data={path}
                        name={scenario}
                        stroke={colors[scenario]}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {bespokePanelOpen && (
            <div className={`fixed inset-0 sm:right-0 sm:top-0 sm:h-full sm:w-80 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border-l shadow-xl z-50 overflow-y-auto`}>
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className={`text-base sm:text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Bespoke Analysis
                  </h3>
                  <button
                    onClick={() => setBespokePanelOpen(false)}
                    className={`p-2 rounded-lg text-lg ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className={`font-medium mb-3 text-sm sm:text-base ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Custom Parameter
                    </h4>
                    <select
                      value={selectedParam}
                      onChange={(e) => setSelectedParam(e.target.value)}
                      className={`w-full mb-3 px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    >
                      <option value="">Select Parameter</option>
                      {Object.keys(assumptions).map((key) => (
                        <option key={key} value={key}>{key}</option>
                      ))}
                    </select>
                    <InputField
                      label="Parameter Value"
                      value={paramValue}
                      onChange={(val) => setParamValue(val)}
                      tooltip="Enter a value for the selected parameter"
                      darkMode={darkMode}
                    />
                    <button
                      onClick={() => handleWhatIf(selectedParam, paramValue)}
                      disabled={isWhatIfLoading || !selectedParam || !paramValue}
                      className={`w-full mb-3 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm ${isWhatIfLoading || !selectedParam || !paramValue ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Run What-If
                    </button>
                  </div>

                  <div>
                    <h4 className={`font-medium mb-3 text-sm sm:text-base ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      What-If Scenarios
                    </h4>
                    <HybridInput
                      label="BTC Price Shock"
                      value={assumptions.targetBTCPrice / assumptions.BTC_current_market_price - 1}
                      onChange={(value) => {
                        const newTargetBTCPrice = assumptions.BTC_current_market_price * (1 + value);
                        setAssumptions({ ...assumptions, targetBTCPrice: newTargetBTCPrice });
                        handleWhatIf('targetBTCPrice', newTargetBTCPrice);
                      }}
                      min={-0.5}
                      max={0.5}
                      step={0.05}
                      suffix="%"
                      darkMode={darkMode}
                    />
                  </div>

                  <div>
                    <h4 className={`font-medium mb-3 text-sm sm:text-base ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Optimization Controls
                    </h4>
                    <button
                      onClick={() => handleWhatIf('LTV_Cap', 'optimize')}
                      disabled={isWhatIfLoading}
                      className={`w-full mb-3 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm ${isWhatIfLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Optimize LTV Cap
                    </button>
                    <button
                      onClick={() => handleWhatIf('beta_ROE', 'maximize')}
                      disabled={isWhatIfLoading}
                      className={`w-full mb-3 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm ${isWhatIfLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Maximize ROE
                    </button>
                  </div>

                  <div>
                    <h4 className={`font-medium mb-3 text-sm sm:text-base ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Export What-If Results
                    </h4>
                    <button
                      onClick={() => {
                        if (!selectedParam || !paramValue) {
                          setError('Please select a parameter and enter a valid value.');
                          return;
                        }
                        if (!validateWhatIfInput(selectedParam, paramValue, setError)) return;
                        handleExport('csv', '/api/what_if/', selectedParam, paramValue, assumptions, setError, setIsExportLoading, setExportType);
                      }}
                      disabled={isExportLoading || isWhatIfLoading}
                      className={`w-full mb-3 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm ${isExportLoading || isWhatIfLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                    >
                      {isExportLoading && exportType === 'CSV' ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2 inline-block"></div>
                          Exporting CSV...
                        </>
                      ) : (
                        'Export CSV'
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (!selectedParam || !paramValue) {
                          setError('Please select a parameter and enter a valid value.');
                          return;
                        }
                        if (!validateWhatIfInput(selectedParam, paramValue, setError)) return;
                        handleExport('pdf', '/api/what_if/', selectedParam, paramValue, assumptions, setError, setIsExportLoading, setExportType);
                      }}
                      disabled={isExportLoading || isWhatIfLoading}
                      className={`w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm ${isExportLoading || isWhatIfLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                    >
                      {isExportLoading && exportType === 'PDF' ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2 inline-block"></div>
                          Exporting PDF...
                        </>
                      ) : (
                        'Export PDF'
                      )}
                    </button>
                  </div>

                  {results?.optimized_param && (
                    <div>
                      <h4 className={`font-medium mb-2 text-sm sm:text-base ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                        Optimized Parameter
                      </h4>
                      <p className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {Object.keys(results.optimized_param)[0]}: {Object.values(results.optimized_param)[0].toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DocumentationModal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} darkMode={darkMode} />
        </div>
      </div>
    );
  };

  return (
    <>
      {currentPage === 'landing' && <LandingPage />}
      {currentPage === 'assumptions' && (
        <AssumptionsPage
          assumptions={assumptions}
          setAssumptions={setAssumptions}
          darkMode={darkMode}
          setCurrentPage={setCurrentPage}
          setError={setError}
          savedConfigs={savedConfigs}
          setSavedConfigs={setSavedConfigs}
          mode={mode}
          setMode={setMode}
          ticker={ticker}
          setTicker={setTicker}
          uploadedFile={uploadedFile}
          setUploadedFile={setUploadedFile}
          parsedSecData={parsedSecData}
          setParsedSecData={setParsedSecData}
          secAssumptions={secAssumptions}
          setSecAssumptions={setSecAssumptions}
          privateFile={privateFile}
          setPrivateFile={setPrivateFile}
          parsedPrivateData={parsedPrivateData}
          setParsedPrivateData={setParsedPrivateData}
          isParsingPrivateFile={isParsingPrivateFile}
          handlePrivateFileUpload={handlePrivateFileUpload}
          applyPrivateData={applyPrivateData}
          handleCalculate={handleCalculate}
          isCalculating={isCalculating}
          calculationProgress={calculationProgress}
          isDocModalOpen={isDocModalOpen}
          setIsDocModalOpen={setIsDocModalOpen}
        />
      )}
      {currentPage === 'dashboard' && results && <DashboardPage />}
    </>
  );
};

export default App;