import { useState, useEffect, useCallback } from 'react';
import HybridInput from './HybridInput';
import InputField from './InputField';
import DocumentationModal from './DocumentationModal';
import { Home, Sun, Moon, Upload, Save, Folder, Trash2, Calculator } from 'lucide-react';

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
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [lockDefaults, setLockDefaults] = useState(true);
  const [successMessage, setSuccessMessage] = useState(null);

  // Sync localSavedConfigs with savedConfigs
  useEffect(() => {
    setSavedConfigs(localSavedConfigs);
  }, [localSavedConfigs, setSavedConfigs]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Fetch live BTC price in Public/SEC Mode
  useEffect(() => {
    if (mode === 'public') {
      const fetchBTCPrice = async () => {
        try {
          const response = await fetch('http://127.0.0.1:8000/api/btc_price/');
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const data = await response.json();
          if (data.BTC_current_market_price) {
            setAssumptions((prev) => ({
              ...prev,
              BTC_current_market_price: data.BTC_current_market_price,
              targetBTCPrice:
                prev.targetBTCPrice === prev.BTC_current_market_price
                  ? data.BTC_current_market_price
                  : prev.targetBTCPrice,
            }));
          }
        } catch (err) {
          console.error('Failed to fetch BTC price:', err);
          setError('Failed to fetch live BTC price. Using default value.');
        }
      };
      fetchBTCPrice();
    }
  }, [mode, setAssumptions, setError]);

  // Save configuration to localStorage
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

  // Load configuration from localStorage
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

  // Delete configuration from localStorage
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

  // Handle file upload for SEC filings
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsFetchingData(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('ticker', ticker);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/upload_sec_data/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setAssumptions((prev) => ({
        ...prev,
        initial_equity_value: data.initial_equity_value || prev.initial_equity_value,
        LoanPrincipal: data.loan_principal || prev.LoanPrincipal,
        new_equity_raised: data.new_equity_raised || prev.new_equity_raised,
      }));
      setError(null);
      setSuccessMessage('SEC filing data successfully uploaded and parsed.');
    } catch (err) {
      console.error('Failed to upload and parse file:', err);
      setError(err.message.includes('Unsupported file format')
        ? err.message
        : 'Failed to process SEC filing. Ensure the file is a valid PDF, XLSX, CSV, or DOCX with financial data.');
    } finally {
      setIsFetchingData(false);
    }
  };

  // Handle fetching SEC data
  const handleFetchSECData = async () => {
    if (!ticker.trim()) {
      setError('Please enter a valid ticker symbol');
      return;
    }

    setIsFetchingData(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/fetch_sec_data/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.error) {
        if (data.error.includes('rate limit')) {
          setError('Alpha Vantage API rate limit exceeded. Please try again in a few minutes.');
        } else {
          throw new Error(data.error);
        }
      }

      setAssumptions((prev) => ({
        ...prev,
        initial_equity_value: data.initial_equity_value || prev.initial_equity_value,
        LoanPrincipal: data.loan_principal || prev.LoanPrincipal,
        new_equity_raised: data.new_equity_raised || prev.new_equity_raised,
      }));
      setError(null);
      setSuccessMessage(`Successfully fetched SEC data for ticker ${ticker}.`);
    } catch (err) {
      console.error('Failed to fetch SEC data:', err);
      setError('Failed to fetch SEC data. Please check the ticker symbol.');
    } finally {
      setIsFetchingData(false);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#111827]' : 'bg-[#F9FAFB]'} font-inter p-4 sm:p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
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
              <h1 className={`text-[28px] font-semibold ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
                Model Assumptions
              </h1>
              <p className={`text-[14px] ${darkMode ? 'text-[#9CA3AF]' : 'text-[#334155]'} mt-1`}>
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
              className={`px-4 py-2 rounded-full text-[14px] font-medium ${mode === 'public' ? 'bg-[#0A1F44] text-white' : 'bg-[#E5E7EB] text-[#0A1F44]'}`}
            >
              Public/SEC Mode
            </button>
            <button
              onClick={() => setMode('manual')}
              className={`px-4 py-2 rounded-full text-[14px] font-medium ${mode === 'manual' ? 'bg-[#0A1F44] text-white' : 'bg-[#E5E7EB] text-[#0A1F44]'}`}
            >
              Manual Mode
            </button>
          </div>
          {mode === 'public' && (
            <>
              <div className="flex space-x-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  placeholder="Enter ticker symbol (e.g. AMZN, etc.)"
                  className={`w-full sm:w-[300px] px-3 py-2 rounded-lg border text-[14px] ${darkMode ? 'bg-[#1F2937] border-[#374151] text-white' : 'bg-white border-[#E5E7EB] text-[#0A1F44]'} focus:outline-none focus:ring-2 focus:ring-[#CDA349]`}
                />
                <button
                  onClick={handleFetchSECData}
                  disabled={isFetchingData || !ticker.trim()}
                  className={`px-4 py-2 bg-[#0A1F44] text-white rounded-lg text-[14px] hover:bg-[#1e3a8a] ${isFetchingData || !ticker.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isFetchingData ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2 inline-block"></div>
                      Fetching...
                    </>
                  ) : (
                    'Fetch SEC Data'
                  )}
                </button>
              </div>
              <label className={`flex items-center justify-center w-full sm:w-[400px] p-4 border-2 border-dashed rounded-lg ${darkMode ? 'border-[#374151] bg-[#1F2937]' : 'border-[#E5E7EB] bg-white'} cursor-pointer`}>
                <Upload className={`w-5 h-5 mr-2 ${darkMode ? 'text-[#CDA349]' : 'text-[#0A1F44]'}`} />
                <span className={`text-[14px] ${darkMode ? 'text-[#D1D5DB]' : 'text-[#334155]'}`}>Upload 10-K/10-Q (PDF, XLSX, CSV, DOCX)</span>
                <input
                  type="file"
                  accept=".pdf,.xlsx,.csv,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </>
          )}
        </div>

        {/* Success Message Display */}
        {successMessage && (
          <div className={`p-4 rounded-[12px] bg-green-100 border border-green-300 text-green-800 text-[14px] mb-4`}>
            {successMessage}
          </div>
        )}

        {/* Configuration Management */}
        <div className={`p-4 rounded-[12px] border ${darkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E5E7EB]'} shadow-[0_1px_4px_rgba(0,0,0,0.08)] mb-6`}>
          <h3 className={`text-[20px] font-semibold mb-4 ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
            Saved Configurations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="text"
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
              placeholder="Enter configuration name"
              className={`px-3 py-2 rounded-[12px] border text-[14px] ${darkMode ? 'bg-[#1F2937] border-[#374151] text-white' : 'bg-white border-[#E5E7EB] text-[#0A1F44]'} focus:outline-none focus:ring-2 focus:ring-[#CDA349]`}
            />
            <select
              value={selectedConfig}
              onChange={(e) => setSelectedConfig(e.target.value)}
              className={`px-3 py-2 rounded-[12px] border text-[14px] ${darkMode ? 'bg-[#1F2937] border-[#374151] text-white' : 'bg-white border-[#E5E7EB] text-[#0A1F44]'}`}
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
                className={`flex-1 px-3 py-2 bg-[#0A1F44] text-white rounded-[12px] text-[14px] hover:bg-[#1e3a8a] ${!configName.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!configName.trim()}
              >
                <Save className="w-4 h-4 inline-block mr-1" />
                Save
              </button>
              <button
                onClick={() => handleLoadConfiguration(selectedConfig)}
                className={`flex-1 px-3 py-2 bg-[#0A1F44] text-white rounded-[12px] text-[14px] hover:bg-[#1e3a8a] ${!selectedConfig ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!selectedConfig}
              >
                <Folder className="w-4 h-4 inline-block mr-1" />
                Load
              </button>
              <button
                onClick={() => handleDeleteConfiguration(selectedConfig)}
                className={`flex-1 px-3 py-2 bg-red-600 text-white rounded-[12px] text-[14px] hover:bg-red-700 ${!selectedConfig ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!selectedConfig}
              >
                <Trash2 className="w-4 h-4 inline-block mr-1" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Warning for Default Values in Public/SEC Mode */}
        {mode === 'public' && (
          <div className={`p-4 rounded-[12px] bg-yellow-100 border border-yellow-300 text-yellow-800 text-[14px] mb-4`}>
            <p>
              Using default values for non-SEC parameters (e.g., BTC Treasury, LTV Cap).{' '}
              <button onClick={() => setMode('manual')} className="underline">
                Switch to Manual Mode
              </button>{' '}
              or{' '}
              <button onClick={() => setLockDefaults(false)} className="underline">
                unlock defaults
              </button>{' '}
              to edit all parameters.
            </p>
          </div>
        )}

        {/* Assumptions Panels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* BTC Parameters */}
          <div className={`p-4 rounded-[12px] border ${darkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E5E7EB]'} shadow-[0_1px_4px_rgba(0,0,0,0.08)]`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-[20px] font-semibold ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
                BTC Parameters
              </h3>
              {mode === 'public' && (
                <button
                  onClick={() => setLockDefaults(!lockDefaults)}
                  className={`px-4 py-2 rounded-full text-[14px] font-medium ${lockDefaults ? 'bg-[#E5E7EB] text-[#0A1F44]' : 'bg-[#0A1F44] text-white'}`}
                >
                  {lockDefaults ? 'Unlock Defaults' : 'Lock Defaults'}
                </button>
              )}
            </div>
            <div className="space-y-4">
              <InputField
                label="Treasury BTC"
                value={assumptions.BTC_treasury}
                onChange={(val) => (mode === 'public' && lockDefaults ? null : setAssumptions({ ...assumptions, BTC_treasury: val }))}
                suffix="BTC"
                tooltip="The amount of Bitcoin held in the treasury"
                darkMode={darkMode}
                className="text-[14px]"
                disabled={mode === 'public' && lockDefaults}
              />
              <InputField
                label="Current BTC Price"
                value={assumptions.BTC_current_market_price}
                onChange={null}
                suffix="USD"
                tooltip="Current market price of Bitcoin"
                darkMode={darkMode}
                className="text-[14px]"
                disabled={true}
              />
              <InputField
                label="Target BTC Price"
                value={assumptions.targetBTCPrice}
                onChange={(val) => (mode === 'public' && lockDefaults ? null : setAssumptions({ ...assumptions, targetBTCPrice: val }))}
                suffix="USD"
                tooltip="Your expected Bitcoin price at the end of the time horizon"
                darkMode={darkMode}
                className="text-[14px]"
                disabled={mode === 'public' && lockDefaults}
              />
              <InputField
                label="Issue Price"
                value={assumptions.IssuePrice}
                onChange={(val) => (mode === 'public' && lockDefaults ? null : setAssumptions({ ...assumptions, IssuePrice: val }))}
                suffix="USD"
                tooltip="Price at which convertible notes are issued"
                darkMode={darkMode}
                className="text-[14px]"
                disabled={mode === 'public' && lockDefaults}
              />
            </div>
          </div>

          {/* Model Parameters */}
          <div className={`p-4 rounded-[12px] border ${darkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E5E7EB]'} shadow-[0_1px_4px_rgba(0,0,0,0.08)]`}>
            <h3 className={`text-[20px] font-semibold mb-4 ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
              Model Parameters
            </h3>
            <div className="space-y-4">
              <HybridInput
                label="Drift (μ)"
                value={assumptions.mu}
                onChange={(val) => (mode === 'public' && lockDefaults ? null : setAssumptions({ ...assumptions, mu: val }))}
                min={0.3}
                max={0.6}
                step={0.01}
                tooltip="Expected price appreciation rate of BTC"
                darkMode={darkMode}
                className="text-[14px]"
                disabled={mode === 'public' && lockDefaults}
              />
              <HybridInput
                label="Volatility (σ)"
                value={assumptions.sigma}
                onChange={(val) => (mode === 'public' && lockDefaults ? null : setAssumptions({ ...assumptions, sigma: val }))}
                min={0.4}
                max={0.9}
                step={0.01}
                tooltip="Standard deviation of BTC returns"
                darkMode={darkMode}
                className="text-[14px]"
                disabled={mode === 'public' && lockDefaults}
              />
              <div>
                <label className={`block text-[14px] font-medium mb-1 ${darkMode ? 'text-[#D1D5DB]' : 'text-[#334155]'}`}>
                  Time Horizon
                  <span className="ml-1 text-[#CDA349] cursor-help" title="Investment time horizon">ⓘ</span>
                </label>
                <select
                  value={assumptions.t}
                  onChange={(e) => (mode === 'public' && lockDefaults ? null : setAssumptions({ ...assumptions, t: parseFloat(e.target.value) }))}
                  className={`w-full px-3 py-2 rounded-[12px] border text-[14px] ${darkMode ? 'bg-[#1F2937] border-[#374151] text-white' : 'bg-white border-[#E5E7EB] text-[#0A1F44]'} focus:outline-none focus:ring-2 focus:ring-[#CDA349]`}
                  disabled={mode === 'public' && lockDefaults}
                >
                  {[1, 2, 3].map((year) => (
                    <option key={year} value={year}>{year}y</option>
                  ))}
                </select>
              </div>
              <InputField
                label="Risk-Free Rate"
                value={assumptions.risk_free_rate}
                onChange={(val) => (mode === 'public' && lockDefaults ? null : setAssumptions({ ...assumptions, risk_free_rate: val }))}
                suffix="%"
                tooltip="Risk-free interest rate"
                darkMode={darkMode}
                className="text-[14px]"
                disabled={mode === 'public' && lockDefaults}
              />
              <InputField
                label="Expected BTC Return"
                value={assumptions.expected_return_btc}
                onChange={(val) => (mode === 'public' && lockDefaults ? null : setAssumptions({ ...assumptions, expected_return_btc: val }))}
                suffix="%"
                tooltip="Expected annual return on BTC"
                darkMode={darkMode}
                className="text-[14px]"
                disabled={mode === 'public' && lockDefaults}
              />
            </div>
          </div>

          {/* Debt & Equity Parameters */}
          <div className={`p-4 rounded-[12px] border ${darkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E5E7EB]'} shadow-[0_1px_4px_rgba(0,0,0,0.08)]`}>
            <h3 className={`text-[20px] font-semibold mb-4 ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
              Debt & Equity Parameters
            </h3>
            <div className="space-y-4">
              <InputField
                label="Initial Equity Value"
                value={assumptions.initial_equity_value}
                onChange={(val) => setAssumptions({ ...assumptions, initial_equity_value: val })}
                suffix="USD"
                tooltip="Fetched or parsed initial equity value from SEC filings"
                darkMode={darkMode}
                className="text-[14px]"
                extraLabel={mode === 'public' && <span className="ml-2 text-[#CDA349] text-xs">[SEC]</span>}
              />
              <InputField
                label="Loan Principal"
                value={assumptions.LoanPrincipal}
                onChange={(val) => setAssumptions({ ...assumptions, LoanPrincipal: val })}
                suffix="USD"
                tooltip="Fetched or parsed loan principal from SEC filings"
                darkMode={darkMode}
                className="text-[14px]"
                extraLabel={mode === 'public' && <span className="ml-2 text-[#CDA349] text-xs">[SEC]</span>}
              />
              <InputField
                label="New Equity Raised"
                value={assumptions.new_equity_raised}
                onChange={(val) => setAssumptions({ ...assumptions, new_equity_raised: val })}
                suffix="USD"
                tooltip="Fetched or parsed new equity raised from SEC filings"
                darkMode={darkMode}
                className="text-[14px]"
                extraLabel={mode === 'public' && <span className="ml-2 text-[#CDA349] text-xs">[SEC]</span>}
              />
              <HybridInput
                label="Cost of Debt"
                value={assumptions.cost_of_debt}
                onChange={(val) => (mode === 'public' && lockDefaults ? null : setAssumptions({ ...assumptions, cost_of_debt: val }))}
                min={0}
                max={0.12}
                step={0.001}
                suffix="%"
                tooltip="Interest rate on the loan"
                darkMode={darkMode}
                className="text-[14px]"
                disabled={mode === 'public' && lockDefaults}
              />
              <HybridInput
                label="LTV Cap"
                value={assumptions.LTV_Cap}
                onChange={(val) => (mode === 'public' && lockDefaults ? null : setAssumptions({ ...assumptions, LTV_Cap: val }))}
                min={0}
                max={0.9}
                step={0.001}
                suffix="%"
                tooltip="Maximum loan-to-value ratio"
                darkMode={darkMode}
                className="text-[14px]"
                disabled={mode === 'public' && lockDefaults}
              />
              <HybridInput
                label="Beta ROE"
                value={assumptions.beta_ROE}
                onChange={(val) => (mode === 'public' && lockDefaults ? null : setAssumptions({ ...assumptions, beta_ROE: val }))}
                min={1.0}
                max={3.0}
                step={0.1}
                tooltip="Beta for return on equity"
                darkMode={darkMode}
                className="text-[14px]"
                disabled={mode === 'public' && lockDefaults}
              />
            </div>
          </div>

          {/* Advanced Parameters */}
          <div className={`p-4 rounded-[12px] border ${darkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E5E7EB]'} shadow-[0_1px_4px_rgba(0,0,0,0.08)]`}>
            <h3 className={`text-[20px] font-semibold mb-4 ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
              Advanced Parameters
            </h3>
            <div className="space-y-4">
              <HybridInput
                label="Dilution Volatility"
                value={assumptions.dilution_vol_estimate}
                onChange={(val) => (mode === 'public' && lockDefaults ? null : setAssumptions({ ...assumptions, dilution_vol_estimate: val }))}
                min={0}
                max={1}
                step={0.001}
                suffix="%"
                tooltip="Volatility estimate for dilution"
                darkMode={darkMode}
                className="text-[14px]"
                disabled={mode === 'public' && lockDefaults}
              />
              <HybridInput
                label="Mean Reversion Speed"
                value={assumptions.vol_mean_reversion_speed}
                onChange={(val) => (mode === 'public' && lockDefaults ? null : setAssumptions({ ...assumptions, vol_mean_reversion_speed: val }))}
                min={0.3}
                max={0.7}
                step={0.01}
                tooltip="Speed of volatility mean reversion"
                darkMode={darkMode}
                className="text-[14px]"
                disabled={mode === 'public' && lockDefaults}
              />
              <HybridInput
                label="Long-Run Volatility"
                value={assumptions.long_run_volatility}
                onChange={(val) => (mode === 'public' && lockDefaults ? null : setAssumptions({ ...assumptions, long_run_volatility: val }))}
                min={0.1}
                max={0.7}
                step={0.01}
                tooltip="Long-run volatility of BTC"
                darkMode={darkMode}
                className="text-[14px]"
                disabled={mode === 'public' && lockDefaults}
              />
              <InputField
                label="Jump Intensity"
                value={assumptions.jump_intensity}
                onChange={(val) => (mode === 'public' && lockDefaults ? null : setAssumptions({ ...assumptions, jump_intensity: val }))}
                min={0}
                max={0.5}
                step={0.01}
                tooltip="Intensity of price jumps in BTC"
                darkMode={darkMode}
                className="text-[14px]"
                disabled={mode === 'public' && lockDefaults}
              />
              <InputField
                label="Jump Mean"
                value={assumptions.jump_mean}
                onChange={(val) => (mode === 'public' && lockDefaults ? null : setAssumptions({ ...assumptions, jump_mean: val }))}
                min={-0.5}
                max={0.5}
                step={0.01}
                tooltip="Mean of price jumps in BTC"
                darkMode={darkMode}
                className="text-[14px]"
                disabled={mode === 'public' && lockDefaults}
              />
              <InputField
                label="Jump Volatility"
                value={assumptions.jump_volatility}
                onChange={(val) => (mode === 'public' && lockDefaults ? null : setAssumptions({ ...assumptions, jump_volatility: val }))}
                min={0}
                max={0.5}
                step={0.01}
                tooltip="Volatility of price jumps in BTC"
                darkMode={darkMode}
                className="text-[14px]"
                disabled={mode === 'public' && lockDefaults}
              />
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <p className="text-red-500 text-[14px] mt-4 text-center">{error}</p>
        )}

        {/* Calculate Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleCalculate}
            disabled={isCalculating}
            className={`px-6 py-3 bg-[#0A1F44] text-white rounded-[12px] text-[16px] font-medium hover:bg-[#1e3a8a] flex items-center justify-center transition-colors ${isCalculating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isCalculating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Calculating... {calculationProgress}%
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4 mr-2" />
                Run Models
              </>
            )}
          </button>
        </div>

        <DocumentationModal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} darkMode={darkMode} />
      </div>
    </div>
  );
};

export default AssumptionsPage;