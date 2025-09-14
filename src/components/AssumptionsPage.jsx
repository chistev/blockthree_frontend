import { useState, useEffect, useCallback } from 'react';
import HybridInput from './HybridInput';
import InputField from './InputField';
import DocumentationModal from './DocumentationModal';
import { Home, Sun, Moon, Upload, Save, Folder, Trash2, Calculator, Info } from 'lucide-react';

const AssumptionsPage = ({
  darkMode,
  setDarkMode,
  setCurrentPage,
  assumptions,
  setAssumptions,
  savedConfigs,
  setSavedConfigs,
  isCalculating,
  calculationProgress,
  setIsDocModalOpen,
  isDocModalOpen,
  error,
  setError,
  ticker,
  setTicker,
  mode,
  setMode,
  handleCalculate,
}) => {
  const [configName, setConfigName] = useState('');
  const [selectedConfig, setSelectedConfig] = useState('');
  const [localSavedConfigs, setLocalSavedConfigs] = useState(savedConfigs);

  useEffect(() => {
    setSavedConfigs(localSavedConfigs);
  }, [localSavedConfigs, setSavedConfigs]);

  const saveConfiguration = (assumptions, configName, setSavedConfigs, setError) => {
    if (!configName.trim()) {
      setError('Configuration name cannot be empty');
      return;
    }
    try {
      const existingConfigs = JSON.parse(localStorage.getItem('savedConfigs') || '{}');
      existingConfigs[configName] = { assumptions, timestamp: new Date().toISOString() };
      localStorage.setItem('savedConfigs', JSON.stringify(existingConfigs));
      setSavedConfigs(existingConfigs);
      setError(null);
    } catch (err) {
      console.error('Failed to save configuration:', err);
      setError('Failed to save configuration. Please try again.');
    }
  };

  const loadConfiguration = (configName, setAssumptions, setError) => {
    try {
      const existingConfigs = JSON.parse(localStorage.getItem('savedConfigs') || '{}');
      if (existingConfigs[configName]) {
        setAssumptions(existingConfigs[configName].assumptions);
        setError(null);
      } else {
        setError('Configuration not found');
      }
    } catch (err) {
      console.error('Failed to load configuration:', err);
      setError('Failed to load configuration. Please try again.');
    }
  };

  const deleteConfiguration = (configName, setSavedConfigs, setError) => {
    try {
      const existingConfigs = JSON.parse(localStorage.getItem('savedConfigs') || '{}');
      delete existingConfigs[configName];
      localStorage.setItem('savedConfigs', JSON.stringify(existingConfigs));
      setSavedConfigs(existingConfigs);
      setError(null);
    } catch (err) {
      console.error('Failed to delete configuration:', err);
      setError('Failed to delete configuration. Please try again.');
    }
  };

  const handleSaveConfiguration = useCallback(
    (name) => {
      saveConfiguration(assumptions, name, setLocalSavedConfigs, setError);
      setConfigName('');
    },
    [assumptions, setError]
  );

  const handleLoadConfiguration = useCallback(
    (name) => {
      loadConfiguration(name, setAssumptions, setError);
    },
    [setAssumptions, setError]
  );

  const handleDeleteConfiguration = useCallback(
    (name) => {
      deleteConfiguration(name, setLocalSavedConfigs, setError);
      if (selectedConfig === name) {
        setSelectedConfig('');
      }
    },
    [selectedConfig, setError]
  );

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('File uploaded:', file.name);
      setError(null);
      // Add logic to parse 10-K/10-Q and update assumptions if needed
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#111827]' : 'bg-[#F9FAFB]'} font-inter p-4 sm:p-6`}>
      <div className="max-w-7xl mx-auto">
        <div className={`flex flex-col sm:flex-row justify-between items-center mb-6 border-b ${darkMode ? 'border-[#374151]' : 'border-[#E5E7EB]'} pb-4`}>
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <button
              onClick={() => setCurrentPage('landing')}
              className={`p-2 rounded-lg flex items-center text-sm ${darkMode ? 'bg-[#374151] text-white' : 'bg-[#E5E7EB] text-[#0A1F44]'}`}
              title="Back to Home"
            >
              <Home className="w-4 h-4 mr-1" />
              Home
            </button>
            <div>
              <h1 className={`text-2xl sm:text-3xl font-semibold ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
                Model Assumptions
              </h1>
              <p className={`text-sm ${darkMode ? 'text-[#9CA3AF]' : 'text-[#334155]'} mt-1`}>
                Configure parameters for risk analysis and treasury optimization
              </p>
            </div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg ${darkMode ? 'bg-[#374151] text-white' : 'bg-[#E5E7EB] text-[#0A1F44]'}`}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Top Bar: Mode Toggle, Ticker Lookup, File Upload */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setMode('public')}
              className={`px-4 py-2 rounded-full text-sm font-medium ${mode === 'public' ? 'bg-[#0A1F44] text-white' : 'bg-[#E5E7EB] text-[#0A1F44]'}`}
            >
              Public/SEC Mode
            </button>
            <button
              onClick={() => setMode('manual')}
              className={`px-4 py-2 rounded-full text-sm font-medium ${mode === 'manual' ? 'bg-[#0A1F44] text-white' : 'bg-[#E5E7EB] text-[#0A1F44]'}`}
            >
              Manual Mode
            </button>
          </div>
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="Enter ticker symbol"
            className={`w-full sm:w-[300px] px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-[#1F2937] border-[#374151] text-white' : 'bg-white border-[#E5E7EB] text-[#0A1F44]'} focus:outline-none focus:ring-2 focus:ring-[#CDA349]`}
          />
          <label className={`flex items-center justify-center w-full sm:w-[400px] p-4 border-2 border-dashed rounded-lg ${darkMode ? 'border-[#374151] bg-[#1F2937]' : 'border-[#E5E7EB] bg-white'} cursor-pointer`}>
            <Upload className={`w-5 h-5 mr-2 ${darkMode ? 'text-[#CDA349]' : 'text-[#0A1F44]'}`} />
            <span className={`text-sm ${darkMode ? 'text-[#D1D5DB]' : 'text-[#334155]'}`}>Upload 10-K/10-Q</span>
            <input
              type="file"
              accept=".pdf,.xlsx,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Configuration Management */}
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E5E7EB]'} shadow-sm mb-6`}>
          <h3 className={`text-lg sm:text-xl font-medium mb-4 ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
            Saved Configurations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="text"
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
              placeholder="Enter configuration name"
              className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-[#1F2937] border-[#374151] text-white' : 'bg-white border-[#E5E7EB] text-[#0A1F44]'} focus:outline-none focus:ring-2 focus:ring-[#CDA349]`}
            />
            <select
              value={selectedConfig}
              onChange={(e) => setSelectedConfig(e.target.value)}
              className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-[#1F2937] border-[#374151] text-white' : 'bg-white border-[#E5E7EB] text-[#0A1F44]'}`}
            >
              <option value="">Select a configuration</option>
              {Object.keys(localSavedConfigs).map((name) => (
                <option key={name} value={name}>
                  {name} ({new Date(localSavedConfigs[name].timestamp).toLocaleString()})
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => handleSaveConfiguration(configName)}
                className={`flex-1 px-3 py-2 bg-[#0A1F44] text-white rounded-lg text-sm hover:bg-[#1e3a8a] ${!configName.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!configName.trim()}
              >
                <Save className="w-4 h-4 inline-block mr-1" />
                Save
              </button>
              <button
                onClick={() => handleLoadConfiguration(selectedConfig)}
                className={`flex-1 px-3 py-2 bg-[#0A1F44] text-white rounded-lg text-sm hover:bg-[#1e3a8a] ${!selectedConfig ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!selectedConfig}
              >
                <Folder className="w-4 h-4 inline-block mr-1" />
                Load
              </button>
              <button
                onClick={() => handleDeleteConfiguration(selectedConfig)}
                className={`flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 ${!selectedConfig ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!selectedConfig}
              >
                <Trash2 className="w-4 h-4 inline-block mr-1" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Assumptions Panels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E5E7EB]'} shadow-sm`}>
            <h3 className={`text-lg font-medium mb-3 ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
              BTC Parameters
            </h3>
            <InputField
              label="BTC Treasury (Quantity)"
              value={assumptions.BTC_treasury}
              onChange={(val) => setAssumptions({ ...assumptions, BTC_treasury: val })}
              suffix="BTC"
              tooltip="The amount of Bitcoin held in the treasury"
              darkMode={darkMode}
              className="text-sm"
            />
            <div className="mb-3">
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-[#D1D5DB]' : 'text-[#334155]'}`}>
                Current BTC Price
              </label>
              <div className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-[#1F2937] border-[#374151] text-[#D1D5DB]' : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#334155]'} flex items-center justify-between opacity-75`}>
                <span>{assumptions.BTC_current_market_price ? `$${assumptions.BTC_current_market_price.toFixed(2)}` : 'Loading...'}</span>
                <span className="text-sm">USD</span>
              </div>
            </div>
            <InputField
              label="Target BTC Price"
              value={assumptions.targetBTCPrice}
              onChange={(val) => setAssumptions({ ...assumptions, targetBTCPrice: val })}
              suffix="USD"
              tooltip="Your expected Bitcoin price at the end of the time horizon"
              darkMode={darkMode}
              className="text-sm"
            />
            <InputField
              label="Issue Price"
              value={assumptions.IssuePrice}
              onChange={(val) => setAssumptions({ ...assumptions, IssuePrice: val })}
              suffix="USD"
              tooltip="Price at which convertible notes are issued"
              darkMode={darkMode}
              className="text-sm"
            />
          </div>

          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E5E7EB]'} shadow-sm`}>
            <h3 className={`text-lg font-medium mb-3 ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
              Model Parameters
            </h3>
            {[
              { label: "Expected Drift (μ)", key: "mu", step: 0.01, tooltip: "Expected price appreciation rate of BTC" },
              { label: "Volatility (σ)", key: "sigma", step: 0.01, tooltip: "Standard deviation of BTC returns" },
              { label: "Time Horizon", key: "t", step: 0.25, suffix: " years", tooltip: "Investment time horizon" },
              { label: "Delta", key: "delta", step: 0.001, suffix: "%", tooltip: "Dividend yield or carry cost" },
              { label: "Expected BTC Return", key: "expected_return_btc", step: 0.001, suffix: "%", tooltip: "Expected annual return on BTC" },
              { label: "Risk-Free Rate", key: "risk_free_rate", step: 0.001, suffix: "%", tooltip: "Risk-free interest rate" },
            ].map(({ label, key, step, suffix, tooltip }) => (
              <HybridInput
                key={key}
                label={label}
                value={assumptions[key]}
                onChange={(val) => setAssumptions({ ...assumptions, [key]: val })}
                min={0}
                max={key === "t" ? 5 : 1}
                step={step}
                suffix={suffix}
                tooltip={tooltip}
                darkMode={darkMode}
                className="text-sm"
              />
            ))}
          </div>

          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E5E7EB]'} shadow-sm`}>
            <h3 className={`text-lg font-medium mb-3 ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
              Debt & Equity
            </h3>
            <InputField
              label="Loan Principal"
              value={assumptions.LoanPrincipal}
              onChange={(val) => setAssumptions({ ...assumptions, LoanPrincipal: val })}
              suffix="USD"
              tooltip="Principal amount of the loan"
              darkMode={darkMode}
              className="text-sm"
            />
            <HybridInput
              label="Cost of Debt"
              value={assumptions.cost_of_debt}
              onChange={(val) => setAssumptions({ ...assumptions, cost_of_debt: val })}
              min={0}
              max={0.12}
              step={0.001}
              suffix="%"
              tooltip="Interest rate on the loan"
              darkMode={darkMode}
              className="text-sm"
            />
            <HybridInput
              label="LTV Cap"
              value={assumptions.LTV_Cap}
              onChange={(val) => setAssumptions({ ...assumptions, LTV_Cap: val })}
              min={0}
              max={0.90}
              step={0.001}
              suffix="%"
              tooltip="Maximum loan-to-value ratio"
              darkMode={darkMode}
              className="text-sm"
            />
            <InputField
              label="Initial Equity Value"
              value={assumptions.initial_equity_value}
              onChange={(val) => setAssumptions({ ...assumptions, initial_equity_value: val })}
              suffix="USD"
              tooltip="Initial value of equity"
              darkMode={darkMode}
              className="text-sm"
            />
            <InputField
              label="New Equity Raised"
              value={assumptions.new_equity_raised}
              onChange={(val) => setAssumptions({ ...assumptions, new_equity_raised: val })}
              suffix="USD"
              tooltip="Amount of new equity raised"
              darkMode={darkMode}
              className="text-sm"
            />
            <HybridInput
              label="Beta ROE"
              value={assumptions.beta_ROE}
              onChange={(val) => setAssumptions({ ...assumptions, beta_ROE: val })}
              min={1.0}
              max={3.0}
              step={0.1}
              tooltip="Beta for return on equity"
              darkMode={darkMode}
              className="text-sm"
            />
          </div>

          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E5E7EB]'} shadow-sm`}>
            <h3 className={`text-lg font-medium mb-3 ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
              Advanced Parameters
            </h3>
            {[
              { label: "Dilution Volatility", key: "dilution_vol_estimate", step: 0.001, suffix: "%", tooltip: "Volatility estimate for dilution" },
              { label: "Mean Reversion Speed", key: "vol_mean_reversion_speed", step: 0.01, tooltip: "Speed of mean reversion for volatility" },
              { label: "Long-Run Volatility", key: "long_run_volatility", step: 0.001, suffix: "%", tooltip: "Long-term average volatility" },
              { label: "Paths", key: "paths", step: 1000, tooltip: "Number of simulation paths" },
              { label: "Jump Intensity", key: "jump_intensity", step: 0.01, tooltip: "Intensity of jumps in BTC price" },
              { label: "Jump Mean", key: "jump_mean", step: 0.01, tooltip: "Mean of jumps in BTC price" },
              { label: "Jump Volatility", key: "jump_volatility", step: 0.001, suffix: "%", tooltip: "Volatility of jumps in BTC price" },
            ].map(({ label, key, step, suffix, tooltip }) => (
              <HybridInput
                key={key}
                label={label}
                value={assumptions[key]}
                onChange={(val) => setAssumptions({ ...assumptions, [key]: val })}
                min={0}
                max={key === "paths" ? 50000 : 1}
                step={step}
                suffix={suffix}
                tooltip={tooltip}
                darkMode={darkMode}
                className="text-sm"
              />
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={handleCalculate}
            disabled={isCalculating || !assumptions.BTC_current_market_price}
            className={`px-6 py-3 bg-[#0A1F44] text-white rounded-lg text-base font-medium hover:bg-[#1e3a8a] transition-colors disabled:opacity-50 flex items-center`}
          >
            {isCalculating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Running ({calculationProgress}%)
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4 mr-2" />
                Run Models
              </>
            )}
          </button>
          <button
            onClick={() => setIsDocModalOpen(true)}
            className={`px-4 py-2 rounded-lg text-sm ${darkMode ? 'bg-[#374151] text-white' : 'bg-[#E5E7EB] text-[#0A1F44]'}`}
          >
            <Info className="w-4 h-4 inline-block mr-1" />
            Learn More
          </button>
        </div>
        {error && (
          <p className="text-red-500 text-sm mt-4 text-center">{error}</p>
        )}
        {isCalculating && (
          <div className="mt-4 max-w-md mx-auto">
            <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-[#374151]' : 'bg-[#E5E7EB]'}`}>
              <div
                className="bg-[#CDA349] h-2 rounded-full transition-all duration-300"
                style={{ width: `${calculationProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
      <DocumentationModal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} darkMode={darkMode} />
    </div>
  );
};

export default AssumptionsPage;