import React, { useState, useEffect } from 'react';
import './index.css';
import {
  TrendingUp,
  TrendingDown,
  Calculator,
  Shield,
  DollarSign,
  Target,
  AlertTriangle,
  Moon,
  Sun,
  Briefcase,
  Save,
  Play,
  Sliders,
  Home,
  Gauge,
  Download,
  FileText
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
  Area
} from 'recharts';

const App = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [currentPage, setCurrentPage] = useState('landing');
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationProgress, setCalculationProgress] = useState(0);
  const [bespokePanelOpen, setBespokePanelOpen] = useState(false);
  const [isWhatIfLoading, setIsWhatIfLoading] = useState(false);
  const [error, setError] = useState(null);

  const [assumptions, setAssumptions] = useState({
    BTC_treasury: 1000,
    BTC_current_market_price: null, // Initialize as null until live price is fetched
    BTC_t: 55000,
    mu: 0.42,
    sigma: 0.65,
    t: 1.0,
    paths: 5000,
    LoanPrincipal: 25000000,
    C_Debt: 0.08,
    LTV_Cap: 0.6,
    TreasurySize: 50000000,
    EquityRaise: 100000000,
    K: 50000,
    beta_ROE: 1.2,
  });

  // Fetch live Bitcoin price on component mount
  useEffect(() => {
    const fetchLiveBTCPrice = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/btc_price/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.BTC_current_market_price) {
          setAssumptions((prev) => ({
            ...prev,
            BTC_current_market_price: data.BTC_current_market_price,
          }));
        } else {
          throw new Error('No BTC price in response');
        }
      } catch (err) {
        console.error('Failed to fetch BTC price:', err);
        setError('Failed to fetch live BTC price. Using default value.');
        setAssumptions((prev) => ({
          ...prev,
          BTC_current_market_price: 45000, // Fallback to default if fetch fails
        }));
      }
    };

    fetchLiveBTCPrice();
  }, []); // Empty dependency array to run once on mount

  const handleCalculate = async () => {
    setIsCalculating(true);
    setCalculationProgress(0);
    setError(null);

    const progressInterval = setInterval(() => {
      setCalculationProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    const backendAssumptions = {
      BTC_treasury: assumptions.BTC_treasury,
      BTC_current_market_price: assumptions.BTC_current_market_price,
      BTC_t: assumptions.BTC_t,
      mu: assumptions.mu,
      sigma: assumptions.sigma,
      t: assumptions.t,
      paths: assumptions.paths,
      LoanPrincipal: assumptions.LoanPrincipal,
      C_Debt: assumptions.C_Debt,
      LTV_Cap: assumptions.LTV_Cap,
      S_0: assumptions.TreasurySize,
      delta_S: assumptions.EquityRaise,
      K: assumptions.K,
      beta_ROE: assumptions.beta_ROE,
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/api/calculate/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assumptions: backendAssumptions,
          format: 'json',
          use_live: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const backendResults = await response.json();
      const mappedResults = {
        nav: {
          avg_nav: backendResults.nav.avg_nav,
          ci_lower: backendResults.nav.ci_lower,
          ci_upper: backendResults.nav.ci_upper,
          erosion_prob: backendResults.nav.erosion_prob,
          nav_paths: backendResults.nav.nav_paths.map((value, index) => ({
            time: index / 100,
            value,
          })),
        },
        dilution: {
          base_dilution: backendResults.dilution.base_dilution,
          avg_dilution: backendResults.dilution.avg_dilution,
        },
        ltv: {
          avg_ltv: backendResults.ltv.avg_ltv,
          exceed_prob: backendResults.ltv.exceed_prob,
          ltv_distribution: backendResults.ltv.ltv_paths.map((ltv, index) => ({
            ltv: 0.3 + index * 0.01,
            frequency: ltv,
          })),
        },
        roe: {
          avg_roe: backendResults.roe.avg_roe,
        },
        preferred_bundle: {
          bundle_value: backendResults.preferred_bundle.bundle_value,
        },
      };

      setResults(mappedResults);
      setCalculationProgress(100);
      setCurrentPage('dashboard');
    } catch (err) {
      console.error('Calculation failed:', err);
      setError('Failed to run models. Please try again.');
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsCalculating(false);
        setCalculationProgress(0);
      }, 500);
    }
  };

  const handleWhatIf = async (param, value) => {
    setIsWhatIfLoading(true);
    setError(null);

    const backendAssumptions = {
      BTC_treasury: assumptions.BTC_treasury,
      BTC_current_market_price: assumptions.BTC_current_market_price,
      BTC_t: assumptions.BTC_t,
      mu: assumptions.mu,
      sigma: assumptions.sigma,
      t: assumptions.t,
      paths: assumptions.paths,
      LoanPrincipal: assumptions.LoanPrincipal,
      C_Debt: assumptions.C_Debt,
      LTV_Cap: assumptions.LTV_Cap,
      S_0: assumptions.TreasurySize,
      delta_S: assumptions.EquityRaise,
      K: assumptions.K,
      beta_ROE: assumptions.beta_ROE,
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/api/what_if/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          param,
          value,
          assumptions: backendAssumptions,
          format: 'json',
          use_live: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const backendResults = await response.json();
      const mappedResults = {
        nav: {
          avg_nav: backendResults.nav.avg_nav,
          ci_lower: backendResults.nav.ci_lower,
          ci_upper: backendResults.nav.ci_upper,
          erosion_prob: backendResults.nav.erosion_prob,
          nav_paths: backendResults.nav.nav_paths.map((value, index) => ({
            time: index / 100,
            value,
          })),
        },
        dilution: {
          base_dilution: backendResults.dilution.base_dilution,
          avg_dilution: backendResults.dilution.avg_dilution,
        },
        ltv: {
          avg_ltv: backendResults.ltv.avg_ltv,
          exceed_prob: backendResults.ltv.exceed_prob,
          ltv_distribution: backendResults.ltv.ltv_paths.map((ltv, index) => ({
            ltv: 0.3 + index * 0.01,
            frequency: ltv,
          })),
        },
        roe: {
          avg_roe: backendResults.roe.avg_roe,
        },
        preferred_bundle: {
          bundle_value: backendResults.preferred_bundle.bundle_value,
        },
      };

      setResults(mappedResults);
    } catch (err) {
      console.error('What-If analysis failed:', err);
      setError('What-If analysis failed. Please try again.');
    } finally {
      setIsWhatIfLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const backendAssumptions = {
        BTC_treasury: assumptions.BTC_treasury,
        BTC_current_market_price: assumptions.BTC_current_market_price,
        BTC_t: assumptions.BTC_t,
        mu: assumptions.mu,
        sigma: assumptions.sigma,
        t: assumptions.t,
        paths: assumptions.paths,
        LoanPrincipal: assumptions.LoanPrincipal,
        C_Debt: assumptions.C_Debt,
        LTV_Cap: assumptions.LTV_Cap,
        S_0: assumptions.TreasurySize,
        delta_S: assumptions.EquityRaise,
        K: assumptions.K,
        beta_ROE: assumptions.beta_ROE,
      };

      const response = await fetch('http://127.0.0.1:8000/api/calculate/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assumptions: backendAssumptions,
          format,
          use_live: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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
    }
  };

  const SliderInput = ({ label, value, onChange, min, max, step = 0.01, suffix = "" }) => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
          {label}
        </label>
        <span className={`text-sm font-mono ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
          {value.toFixed(step >= 1 ? 0 : 2)}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );

  const InputField = ({ label, value, onChange, suffix = "" }) => {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    const handleBlur = () => {
      const parsed = parseFloat(localValue);
      onChange(isNaN(parsed) ? 0 : parsed);
    };

    return (
      <div className="mb-4">
        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
          {label}
        </label>
        <div className="relative">
          <input
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            className={`w-full px-3 py-2 rounded-lg border ${darkMode
                ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-400'
                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors text-sm`}
          />
          {suffix && (
            <span className={`absolute right-2 top-2 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              {suffix}
            </span>
          )}
        </div>
      </div>
    );
  };

  const MetricCard = ({ title, value, icon: Icon, format = "number" }) => (
    <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} transition-all hover:shadow-lg`}>
      <div className="flex items-center justify-between mb-3">
        <Icon className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
      </div>
      <h3 className={`text-xs font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>
        {title}
      </h3>
      <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {format === "currency" ? `$${(value / 1000000).toFixed(1)}M` :
          format === "percentage" ? `${(value * 100).toFixed(1)}%` :
            value.toFixed(2)}
      </p>
    </div>
  );

  const [results, setResults] = useState(null);

  if (currentPage === 'landing') {
    return (
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
  }

  if (currentPage === 'assumptions') {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-gray-50'} p-4 sm:p-8`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <div className="mb-4 sm:mb-0">
              <h1 className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Model Assumptions
              </h1>
              <p className={`${darkMode ? 'text-slate-400' : 'text-gray-600'} mt-2 text-sm sm:text-base`}>
                Configure parameters for risk analysis and treasury optimization
              </p>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'}`}
            >
              {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className={`p-4 sm:p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-base sm:text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                BTC Parameters
              </h3>
              <InputField
                label="BTC Treasury (Quantity)"
                value={assumptions.BTC_treasury}
                onChange={(val) => setAssumptions({ ...assumptions, BTC_treasury: val })}
                suffix="BTC"
              />
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Current BTC Price
                </label>
                <div className={`w-full px-3 py-2 rounded-lg border opacity-75 ${darkMode ? 'bg-slate-800 border-slate-600 text-slate-400' : 'bg-gray-200 border-gray-300 text-gray-500'} flex items-center justify-between`}>
                  <span>{assumptions.BTC_current_market_price ? `$${assumptions.BTC_current_market_price.toFixed(2)}` : 'Loading...'}</span>
                  <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>USD</span>
                </div>
              </div>
              <InputField
                label="Target BTC Price"
                value={assumptions.BTC_t}
                onChange={(val) => setAssumptions({ ...assumptions, BTC_t: val })}
                suffix="USD"
              />
            </div>

            <div className={`p-4 sm:p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-base sm:text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Model Parameters
              </h3>
              <SliderInput
                label="Expected Drift (μ)"
                value={assumptions.mu}
                onChange={(val) => setAssumptions({ ...assumptions, mu: val })}
                min={0.35}
                max={0.50}
                step={0.01}
              />
              <SliderInput
                label="Volatility (σ)"
                value={assumptions.sigma}
                onChange={(val) => setAssumptions({ ...assumptions, sigma: val })}
                min={0.50}
                max={0.80}
                step={0.01}
              />
              <SliderInput
                label="Time Horizon"
                value={assumptions.t}
                onChange={(val) => setAssumptions({ ...assumptions, t: val })}
                min={0.25}
                max={2.0}
                step={0.25}
                suffix=" years"
              />
            </div>

            <div className={`p-4 sm:p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-base sm:text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Debt Parameters
              </h3>
              <InputField
                label="Loan Principal"
                value={assumptions.LoanPrincipal}
                onChange={(val) => setAssumptions({ ...assumptions, LoanPrincipal: val })}
                suffix="USD"
              />
              <SliderInput
                label="Cost of Debt"
                value={assumptions.C_Debt}
                onChange={(val) => setAssumptions({ ...assumptions, C_Debt: val })}
                min={0.04}
                max={0.12}
                step={0.01}
                suffix="%"
              />
              <SliderInput
                label="LTV Cap"
                value={assumptions.LTV_Cap}
                onChange={(val) => setAssumptions({ ...assumptions, LTV_Cap: val })}
                min={0.10}
                max={0.90}
                step={0.05}
                suffix="%"
              />
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleCalculate}
              disabled={isCalculating || !assumptions.BTC_current_market_price}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-base font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {isCalculating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Running Models ({calculationProgress}%)
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Run Models
                </>
              )}
            </button>
          </div>
          {error && (
            <p className="text-red-500 text-sm mt-4 text-center">{error}</p>
          )}
          {isCalculating && (
            <div className="mt-6 max-w-md mx-auto">
              <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${calculationProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentPage === 'dashboard' && results) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
        <nav className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border-b px-4 sm:px-8 py-3`}>
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <h1 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3 sm:mb-0`}>
              Block Three Capital - Risk Dashboard
            </h1>
            <div className="flex flex-wrap items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => setBespokePanelOpen(!bespokePanelOpen)}
                className={`px-3 py-2 rounded-lg flex items-center text-sm ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700'}`}
              >
                <Sliders className="w-4 h-4 mr-1" />
                Bespoke Mode
              </button>
              <button
                onClick={() => handleExport('csv')}
                className={`px-3 py-2 rounded-lg flex items-center text-sm ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700'}`}
              >
                <Download className="w-4 h-4 mr-1" />
                Export CSV
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className={`px-3 py-2 rounded-lg flex items-center text-sm ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700'}`}
              >
                <FileText className="w-4 h-4 mr-1" />
                Export PDF
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
          {error && (
            <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
            <MetricCard
              title="Portfolio Value"
              value={results.preferred_bundle.bundle_value}
              icon={Briefcase}
              format="currency"
            />
            <MetricCard
              title="NAV Erosion Risk"
              value={results.nav.erosion_prob}
              icon={Shield}
              format="percentage"
            />
            <MetricCard
              title="LTV Exceedance"
              value={results.ltv.exceed_prob}
              icon={AlertTriangle}
              format="percentage"
            />
            <MetricCard
              title="Expected ROE"
              value={results.roe.avg_roe}
              icon={Target}
              format="percentage"
            />
            <MetricCard
              title="Dilution Risk"
              value={results.dilution.base_dilution}
              icon={TrendingDown}
              format="percentage"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8">
            <div className={`p-4 sm:p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-base sm:text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                NAV Path Simulation
              </h3>
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={results.nav.nav_paths}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis dataKey="time" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                    <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                        border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                        borderRadius: '8px'
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
                  <AreaChart data={results.ltv.ltv_distribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis dataKey="ltv" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                    <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                        border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                        borderRadius: '8px'
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

          <div className={`p-4 sm:p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-base sm:text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Scenario Analysis
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`border-b ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                    <th className={`text-left py-2 px-3 font-medium ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Scenario</th>
                    <th className={`text-right py-2 px-3 font-medium ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>BTC Price</th>
                    <th className={`text-right py-2 px-3 font-medium ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>NAV Impact</th>
                    <th className={`text-right py-2 px-3 font-medium ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>LTV Ratio</th>
                    <th className={`text-right py-2 px-3 font-medium ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Probability</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className={`border-b ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                    <td className={`py-2 px-3 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Bull Case</td>
                    <td className={`py-2 px-3 text-right ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>${assumptions.BTC_current_market_price ? (assumptions.BTC_current_market_price * 1.5).toFixed(0) : '-'}</td>
                    <td className="py-2 px-3 text-right font-medium text-green-400">+45%</td>
                    <td className={`py-2 px-3 text-right ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>32%</td>
                    <td className={`py-2 px-3 text-right ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>25%</td>
                  </tr>
                  <tr className={`border-b ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                    <td className={`py-2 px-3 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Base Case</td>
                    <td className={`py-2 px-3 text-right ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>${assumptions.BTC_current_market_price ? assumptions.BTC_current_market_price.toFixed(0) : '-'}</td>
                    <td className="py-2 px-3 text-right font-medium text-green-400">+18%</td>
                    <td className={`py-2 px-3 text-right ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>45%</td>
                    <td className={`py-2 px-3 text-right ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>40%</td>
                  </tr>
                  <tr className={`border-b ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                    <td className={`py-2 px-3 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Bear Case</td>
                    <td className={`py-2 px-3 text-right ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>${assumptions.BTC_current_market_price ? (assumptions.BTC_current_market_price * 0.7).toFixed(0) : '-'}</td>
                    <td className="py-2 px-3 text-right font-medium text-red-400">-15%</td>
                    <td className={`py-2 px-3 text-right ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>68%</td>
                    <td className={`py-2 px-3 text-right ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>25%</td>
                  </tr>
                  <tr>
                    <td className={`py-2 px-3 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Stress Test</td>
                    <td className={`py-2 px-3 text-right ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>${assumptions.BTC_current_market_price ? (assumptions.BTC_current_market_price * 0.4).toFixed(0) : '-'}</td>
                    <td className="py-2 px-3 text-right font-medium text-red-400">-45%</td>
                    <td className={`py-2 px-3 text-right ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>95%</td>
                    <td className={`py-2 px-3 text-right ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>10%</td>
                  </tr>
                </tbody>
              </table>
            </div>
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
                    What-If Scenarios
                  </h4>
                  <SliderInput
                    label="BTC Price Shock"
                    value={assumptions.BTC_t / assumptions.BTC_current_market_price - 1}
                    onChange={(value) => {
                      const newBTC_t = assumptions.BTC_current_market_price * (1 + value);
                      setAssumptions({ ...assumptions, BTC_t: newBTC_t });
                      handleWhatIf('BTC_t', newBTC_t);
                    }}
                    min={-0.5}
                    max={0.5}
                    step={0.05}
                    suffix="%"
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
                    className={`w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm ${isWhatIfLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Maximize ROE
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-gray-50'} px-4 sm:px-8`}>
      <div className="text-center max-w-4xl mx-auto">
        <h1 className={`text-3xl sm:text-5xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Block Three Capital
        </h1>
        <h2 className={`text-lg sm:text-2xl mb-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
          Precision Risk + Treasury Structuring for Bitcoin Institutions
        </h2>
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
};

export default App;