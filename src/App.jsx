import React, { useState } from 'react';
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
  Gauge
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
  
  const [assumptions, setAssumptions] = useState({
    BTC_0: 45000,
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
    beta_ROE: 1.2
  });
  
  const [results, setResults] = useState(null);

  const generateMockResults = () => {
    const navPaths = [];
    for (let i = 0; i < 100; i++) {
      navPaths.push({
        time: i / 100,
        value: 50000000 + (Math.random() - 0.5) * 10000000
      });
    }

    const ltvDistribution = [];
    for (let i = 0; i < 50; i++) {
      ltvDistribution.push({
        ltv: 0.3 + i * 0.01,
        frequency: Math.exp(-Math.pow((0.3 + i * 0.01 - 0.48) / 0.1, 2))
      });
    }

    return {
      nav: {
        avg_nav: 52500000,
        ci_lower: 48200000,
        ci_upper: 56800000,
        erosion_prob: 0.198,
        nav_paths: navPaths
      },
      dilution: {
        base_dilution: 0.15,
        avg_dilution: 8500000
      },
      ltv: {
        avg_ltv: 0.48,
        exceed_prob: 0.12,
        ltv_distribution: ltvDistribution
      },
      roe: {
        avg_roe: 0.18
      },
      preferred_bundle: {
        bundle_value: 58750000
      }
    };
  };

  const handleCalculate = async () => {
    setIsCalculating(true);
    setCalculationProgress(0);
    
    const progressInterval = setInterval(() => {
      setCalculationProgress(prev => Math.min(prev + 10, 90));
    }, 200);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockResults = generateMockResults();
      setResults(mockResults);
      setCalculationProgress(100);
      setCurrentPage('dashboard');
    } catch (err) {
      console.error('Calculation failed:', err);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsCalculating(false);
        setCalculationProgress(0);
      }, 500);
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

  const InputField = ({ label, value, onChange, suffix = "" }) => (
    <div className="mb-4">
      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={`w-full px-4 py-3 rounded-lg border ${
            darkMode 
              ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-400' 
              : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
          } focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors`}
        />
        {suffix && (
          <span className={`absolute right-3 top-3 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );

  const MetricCard = ({ title, value, icon: Icon, format = "number" }) => (
    <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} transition-all hover:shadow-lg`}>
      <div className="flex items-center justify-between mb-4">
        <Icon className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
      </div>
      <h3 className={`text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>
        {title}
      </h3>
      <p className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {format === "currency" ? `$${(value / 1000000).toFixed(1)}M` :
         format === "percentage" ? `${(value * 100).toFixed(1)}%` :
         value.toFixed(2)}
      </p>
    </div>
  );

  if (currentPage === 'landing') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
        <div className="text-center max-w-4xl mx-auto px-8">
          <h1 className={`text-5xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Block Three Capital
          </h1>
          <h2 className={`text-2xl mb-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            Precision Risk + Treasury Structuring for Bitcoin Institutions
          </h2>
          <p className={`text-lg mb-12 max-w-2xl mx-auto ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>
            Optimize BTC treasuries with elite models for NAV audit, dilution mitigation, convertibles, LTV loans, ROE optimization, and preferred bundles.
          </p>
          <button
            onClick={() => setCurrentPage('assumptions')}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors flex items-center mx-auto"
          >
            <Play className="w-5 h-5 mr-2" />
            Get Started
          </button>
        </div>
      </div>
    );
  }

  if (currentPage === 'assumptions') {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-gray-50'} p-8`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Model Assumptions
              </h1>
              <p className={`${darkMode ? 'text-slate-400' : 'text-gray-600'} mt-2`}>
                Configure parameters for risk analysis and treasury optimization
              </p>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'}`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-8 mb-8">
            <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                BTC Parameters
              </h3>
              <InputField
                label="Current BTC Price"
                value={assumptions.BTC_0}
                onChange={(val) => setAssumptions({...assumptions, BTC_0: val})}
                suffix="USD"
              />
              <InputField
                label="Target BTC Price"
                value={assumptions.BTC_t}
                onChange={(val) => setAssumptions({...assumptions, BTC_t: val})}
                suffix="USD"
              />
            </div>

            <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Model Parameters
              </h3>
              <SliderInput
                label="Expected Drift (μ)"
                value={assumptions.mu}
                onChange={(val) => setAssumptions({...assumptions, mu: val})}
                min={0.35}
                max={0.50}
                step={0.01}
              />
              <SliderInput
                label="Volatility (σ)"
                value={assumptions.sigma}
                onChange={(val) => setAssumptions({...assumptions, sigma: val})}
                min={0.50}
                max={0.80}
                step={0.01}
              />
              <SliderInput
                label="Time Horizon"
                value={assumptions.t}
                onChange={(val) => setAssumptions({...assumptions, t: val})}
                min={0.25}
                max={2.0}
                step={0.25}
                suffix=" years"
              />
            </div>

            <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Debt Parameters
              </h3>
              <InputField
                label="Loan Principal"
                value={assumptions.LoanPrincipal}
                onChange={(val) => setAssumptions({...assumptions, LoanPrincipal: val})}
                suffix="USD"
              />
              <SliderInput
                label="Cost of Debt"
                value={assumptions.C_Debt}
                onChange={(val) => setAssumptions({...assumptions, C_Debt: val})}
                min={0.04}
                max={0.12}
                step={0.01}
                suffix="%"
              />
              <SliderInput
                label="LTV Cap"
                value={assumptions.LTV_Cap}
                onChange={(val) => setAssumptions({...assumptions, LTV_Cap: val})}
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
              disabled={isCalculating}
              className="bg-blue-600 text-white px-12 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {isCalculating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                  Running Models ({calculationProgress}%)
                </>
              ) : (
                <>
                  <Calculator className="w-5 h-5 mr-3" />
                  Run Models
                </>
              )}
            </button>
          </div>

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
        <nav className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border-b px-8 py-4`}>
          <div className="flex justify-between items-center">
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Block Three Capital - Risk Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setBespokePanelOpen(!bespokePanelOpen)}
                className={`px-4 py-2 rounded-lg flex items-center ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700'}`}
              >
                <Sliders className="w-4 h-4 mr-2" />
                Bespoke Mode
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'}`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </nav>

        <div className="p-8">
          <div className="grid grid-cols-5 gap-6 mb-8">
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

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                NAV Path Simulation
              </h3>
              <div className="h-64">
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

            <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                LTV Risk Distribution
              </h3>
              <div className="h-64">
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

          <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Scenario Analysis
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                    <th className={`text-left py-3 px-4 font-medium ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Scenario</th>
                    <th className={`text-right py-3 px-4 font-medium ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>BTC Price</th>
                    <th className={`text-right py-3 px-4 font-medium ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>NAV Impact</th>
                    <th className={`text-right py-3 px-4 font-medium ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>LTV Ratio</th>
                    <th className={`text-right py-3 px-4 font-medium ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Probability</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className={`border-b ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                    <td className={`py-3 px-4 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Bull Case</td>
                    <td className={`py-3 px-4 text-right ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>$75,000</td>
                    <td className="py-3 px-4 text-right font-medium text-green-400">+45%</td>
                    <td className={`py-3 px-4 text-right ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>32%</td>
                    <td className={`py-3 px-4 text-right ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>25%</td>
                  </tr>
                  <tr className={`border-b ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                    <td className={`py-3 px-4 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Base Case</td>
                    <td className={`py-3 px-4 text-right ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>$55,000</td>
                    <td className="py-3 px-4 text-right font-medium text-green-400">+18%</td>
                    <td className={`py-3 px-4 text-right ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>45%</td>
                    <td className={`py-3 px-4 text-right ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>40%</td>
                  </tr>
                  <tr className={`border-b ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                    <td className={`py-3 px-4 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Bear Case</td>
                    <td className={`py-3 px-4 text-right ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>$35,000</td>
                    <td className="py-3 px-4 text-right font-medium text-red-400">-15%</td>
                    <td className={`py-3 px-4 text-right ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>68%</td>
                    <td className={`py-3 px-4 text-right ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>25%</td>
                  </tr>
                  <tr>
                    <td className={`py-3 px-4 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Stress Test</td>
                    <td className={`py-3 px-4 text-right ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>$20,000</td>
                    <td className="py-3 px-4 text-right font-medium text-red-400">-45%</td>
                    <td className={`py-3 px-4 text-right ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>95%</td>
                    <td className={`py-3 px-4 text-right ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>10%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {bespokePanelOpen && (
          <div className={`fixed right-0 top-0 h-full w-96 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border-l shadow-xl z-50 overflow-y-auto`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Bespoke Analysis
                </h3>
                <button
                  onClick={() => setBespokePanelOpen(false)}
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className={`font-medium mb-3 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    What-If Scenarios
                  </h4>
                  <SliderInput
                    label="BTC Price Shock"
                    value={0}
                    onChange={() => {}}
                    min={-0.5}
                    max={0.5}
                    step={0.05}
                    suffix="%"
                  />
                </div>
                
                <div>
                  <h4 className={`font-medium mb-3 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Optimization Controls
                  </h4>
                  <button className="w-full mb-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Optimize LTV Cap
                  </button>
                  <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
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
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <div className="text-center max-w-4xl mx-auto px-8">
        <h1 className={`text-5xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Block Three Capital
        </h1>
        <h2 className={`text-2xl mb-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
          Precision Risk + Treasury Structuring for Bitcoin Institutions
        </h2>
        <button
          onClick={() => setCurrentPage('assumptions')}
          className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors flex items-center mx-auto"
        >
          <Play className="w-5 h-5 mr-2" />
          Get Started
        </button>
      </div>
    </div>
  );
};

export default App;

