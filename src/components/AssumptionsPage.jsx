import { useState, useEffect, useCallback } from 'react';
import HybridInput from './HybridInput';
import InputField from './InputField';
import DocumentationModal from './DocumentationModal';
import { Home, Sun, Moon, Upload, Save, Folder, Trash2, Calculator, ChevronRight, ChevronDown } from 'lucide-react';

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
  snapshotId,
}) => {
  const [configName, setConfigName] = useState('');
  const [selectedConfig, setSelectedConfig] = useState('');
  const [localSavedConfigs, setLocalSavedConfigs] = useState(savedConfigs);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [lockDefaults, setLockDefaults] = useState(true);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [objectivePreset, setObjectivePreset] = useState('Balanced');
  const [presets, setPresets] = useState({}); // State to store server-side presets

  // Fetch presets on component mount
  useEffect(() => {
    const fetchPresets = async () => {
      try {
        const response = await fetch('https://cperez.pythonanywhere.com/api/presets/');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setPresets(data); // Store presets from server
      } catch (error) {
        console.error('Error fetching presets:', error);
        // Fallback to default presets in case of error
        setPresets({
          Defensive: { LTV_Cap: 0.5, min_profit_margin: 0.2, mu: 0.3, sigma: 0.4 },
          Balanced: { LTV_Cap: 0.7, min_profit_margin: 0.1, mu: 0.45, sigma: 0.6 },
          Growth: { LTV_Cap: 0.9, min_profit_margin: 0.05, mu: 0.6, sigma: 0.8 },
        });
      }
    };
    fetchPresets();
  }, []);

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

  // Fetch live BTC price in Public mode
  useEffect(() => {
    if (mode === 'public') {
      const fetchBTCPrice = async () => {
        try {
          const response = await fetch('https://cperez.pythonanywhere.com/api/btc_price/');
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

  // Handle objective preset changes
  useEffect(() => {
    if (mode === 'public' && lockDefaults) return;
    if (presets[objectivePreset]) {
      setAssumptions((prev) => ({
        ...prev,
        ...presets[objectivePreset],
      }));
    }
  }, [objectivePreset, mode, lockDefaults, setAssumptions, presets]);

  // Save, load, and delete configuration functions
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
      setSuccessMessage('Configuration saved successfully.');
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
        setSuccessMessage(`Configuration ${configName} loaded successfully.`);
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
      setSuccessMessage(`Configuration ${configName} deleted successfully.`);
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
      const response = await fetch('https://cperez.pythonanywhere.com/api/upload_sec_data/', {
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
      setError(
        err.message.includes('Unsupported file format')
          ? err.message
          : 'Failed to process SEC filing. Ensure the file is a valid PDF, XLSX, CSV, or DOCX with financial data.'
      );
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
      const response = await fetch('https://cperez.pythonanywhere.com/api/fetch_sec_data/', {
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
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-slate-100'} font-inter p-4 sm:p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={`flex flex-col sm:flex-row justify-between items-center mb-6 border-b ${darkMode ? 'border-slate-900' : 'border-slate-100'} pb-4`}>
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <button
              onClick={() => setCurrentPage('landing')}
              className={`p-2 rounded-lg flex items-center text-sm font-inter ${darkMode ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-slate-200 text-slate-900 hover:bg-slate-300'} transform hover:scale-101 transition-transform`}
              title="Back to Home"
            >
              <Home className="w-4 h-4 mr-1" />
              Home
            </button>
            <div>
              <h1 className={`text-[28px] font-semibold tracking-tight font-inter-tight ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                Model Assumptions
              </h1>
              <p className={`text-[14px] font-inter ${darkMode ? 'text-slate-400' : 'text-slate-600'} mt-1`}>
                Configure parameters for risk analysis and treasury optimization
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 bg-emerald-500 rounded-full"></span>
              <span className={`text-[12px] font-inter ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                Snapshot: #{snapshotId || 'N/A'}
              </span>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${darkMode ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-slate-200 text-slate-900 hover:bg-slate-300'} transform hover:scale-101 transition-transform`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Top Bar: Mode Toggle, Ticker Lookup, File Upload */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setMode('public')}
              className={`px-4 py-2 rounded-full text-[14px] font-medium font-inter ${mode === 'public' ? 'bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700' : 'bg-gray-400 text-slate-900 hover:bg-gray-500 active:bg-gray-600'} transform hover:scale-101 transition-transform`}
            >
              Public/SEC Mode
            </button>
            <button
              onClick={() => setMode('private')}
              className={`px-4 py-2 rounded-full text-[14px] font-medium font-inter ${mode === 'private' ? 'bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700' : 'bg-gray-400 text-slate-900 hover:bg-gray-500 active:bg-gray-600'} transform hover:scale-101 transition-transform`}
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
                  placeholder="Enter ticker symbol (e.g. AMZN)"
                  className={`w-full sm:w-[300px] px-3 py-2 rounded-lg border text-[14px] font-roboto-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'} focus:outline-none focus:border-emerald-500`}
                />
                <button
                  onClick={handleFetchSECData}
                  disabled={isFetchingData || !ticker.trim()}
                  className={`px-4 py-2 bg-emerald-500 text-white rounded-lg text-[14px] font-inter hover:bg-emerald-600 active:bg-emerald-700 transform hover:scale-101 transition-transform ${isFetchingData || !ticker.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
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
              <label
                className={`flex items-center justify-center w-full sm:w-[400px] p-4 border-2 border-dashed rounded-2xl ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} cursor-pointer transform hover:scale-101 transition-transform`}
              >
                <Upload className={`w-5 h-5 mr-2 ${darkMode ? 'text-emerald-500' : 'text-emerald-500'}`} />
                <span className={`text-[14px] font-inter ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Upload 10-K/10-Q (PDF, XLSX, CSV, DOCX)
                </span>
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
          <div className={`p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-[14px] font-inter mb-4`}>
            {successMessage}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className={`p-4 rounded-2xl bg-red-100 border border-red-300 text-red-500 text-[14px] font-inter mb-4`}>
            {error}
          </div>
        )}

        {/* Warning for Default Values in Public/SEC Mode */}
        {mode === 'public' && (
          <div className={`p-4 rounded-2xl bg-amber-100 border border-amber-300 text-amber-500 text-[14px] font-inter mb-4`}>
            <p>
              Using default values for non-SEC parameters (e.g., BTC Treasury, LTV Cap).{' '}
              <button onClick={() => setMode('private')} className="underline">
                Switch to Private Mode
              </button>{' '}
              or{' '}
              <button
                onClick={() => {
                  setLockDefaults(false);
                  setSuccessMessage('Default parameters unlocked successfully.');
                }}
                className="underline"
              >
                unlock defaults
              </button>{' '}
              to edit all parameters.
            </p>
          </div>
        )}

        {/* Configuration Management */}
        <div
          className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-md mb-6 transform hover:scale-101 transition-transform bg-gradient-to-b ${darkMode ? 'from-slate-800 to-slate-900' : 'from-white to-slate-100'}`}
        >
          <h3 className={`text-[22px] font-semibold tracking-tight font-inter-tight mb-4 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
            Saved Configurations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="text"
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
              placeholder="Enter configuration name"
              className={`px-3 py-2 rounded-lg border text-[14px] font-roboto-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'} focus:outline-none focus:border-emerald-500`}
            />
            <select
              value={selectedConfig}
              onChange={(e) => setSelectedConfig(e.target.value)}
              className={`px-3 py-2 rounded-lg border text-[14px] font-inter ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'} focus:outline-none focus:border-emerald-500`}
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
                className={`flex-1 px-3 py-2 bg-emerald-500 text-white rounded-lg text-[14px] font-inter hover:bg-emerald-600 active:bg-emerald-700 transform hover:scale-101 transition-transform ${!configName.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!configName.trim()}
              >
                <Save className="w-4 h-4 inline-block mr-1" />
                Save
              </button>
              <button
                onClick={() => handleLoadConfiguration(selectedConfig)}
                className={`flex-1 px-3 py-2 bg-emerald-500 text-white rounded-lg text-[14px] font-inter hover:bg-emerald-600 active:bg-emerald-700 transform hover:scale-101 transition-transform ${!selectedConfig ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!selectedConfig}
              >
                <Folder className="w-4 h-4 inline-block mr-1" />
                Load
              </button>
              <button
                onClick={() => handleDeleteConfiguration(selectedConfig)}
                className={`flex-1 px-3 py-2 bg-red-500 text-white rounded-lg text-[14px] font-inter hover:bg-red-600 active:bg-red-700 transform hover:scale-101 transition-transform ${!selectedConfig ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!selectedConfig}
              >
                <Trash2 className="w-4 h-4 inline-block mr-1" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Objective Preset */}
        <div
          className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-md mb-6 transform hover:scale-101 transition-transform bg-gradient-to-b ${darkMode ? 'from-slate-800 to-slate-900' : 'from-white to-slate-100'}`}
        >
          <h3 className={`text-[22px] font-semibold tracking-tight font-inter-tight mb-4 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
            Objective Preset
          </h3>
          <div className="flex space-x-4">
            {['Defensive', 'Balanced', 'Growth'].map((preset) => (
              <label key={preset} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="objectivePreset"
                  value={preset}
                  checked={objectivePreset === preset}
                  onChange={() => setObjectivePreset(preset)}
                  className="form-radio text-emerald-500 focus:ring-emerald-500"
                  disabled={mode === 'public' && lockDefaults}
                />
                <span className={`text-[14px] font-inter ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                  {preset}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Core Inputs (Left) */}
          <div>
            {/* Company Financials */}
            <div
              className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-md mb-6 transform hover:scale-101 transition-transform bg-gradient-to-b ${darkMode ? 'from-slate-800 to-slate-900' : 'from-white to-slate-100'}`}
            >
              <h3 className={`text-[22px] font-semibold tracking-tight font-inter-tight mb-4 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                Company Financials
              </h3>
              <div className="space-y-4">
                <InputField
                  label="Initial Equity Value"
                  value={assumptions.initial_equity_value}
                  onChange={(val) => setAssumptions({ ...assumptions, initial_equity_value: val })}
                  suffix="USD"
                  tooltip="Initial equity value from SEC filings or manual input"
                  darkMode={darkMode}
                  className="text-[14px] font-roboto-mono"
                  extraLabel={
                    mode === 'public' && (
                      <span
                        className={`ml-2 text-[12px] font-inter rounded-full px-2 py-1 ${darkMode ? 'bg-gray-400 text-slate-900' : 'bg-gray-400 text-slate-900'}`}
                      >
                        SEC XBRL
                      </span>
                    )
                  }
                />
                <InputField
                  label="Loan Principal"
                  value={assumptions.LoanPrincipal}
                  onChange={(val) => setAssumptions({ ...assumptions, LoanPrincipal: val })}
                  suffix="USD"
                  tooltip="Loan principal from SEC filings or manual input"
                  darkMode={darkMode}
                  className="text-[14px] font-roboto-mono"
                  extraLabel={
                    mode === 'public' && (
                      <span
                        className={`ml-2 text-[12px] font-inter rounded-full px-2 py-1 ${darkMode ? 'bg-gray-400 text-slate-900' : 'bg-gray-400 text-slate-900'}`}
                      >
                        SEC XBRL
                      </span>
                    )
                  }
                />
                <InputField
                  label="New Equity Raised"
                  value={assumptions.new_equity_raised}
                  onChange={(val) => setAssumptions({ ...assumptions, new_equity_raised: val })}
                  suffix="USD"
                  tooltip="New equity raised from SEC filings or manual input"
                  darkMode={darkMode}
                  className="text-[14px] font-roboto-mono"
                  extraLabel={
                    mode === 'public' && (
                      <span
                        className={`ml-2 text-[12px] font-inter rounded-full px-2 py-1 ${darkMode ? 'bg-gray-400 text-slate-900' : 'bg-gray-400 text-slate-900'}`}
                      >
                        SEC XBRL
                      </span>
                    )
                  }
                />
                <InputField
                  label="Annual Burn Rate"
                  value={assumptions.annual_burn_rate}
                  onChange={(val) => setAssumptions({ ...assumptions, annual_burn_rate: val })}
                  suffix="USD"
                  tooltip="Annual cash burn rate for calculating runway"
                  darkMode={darkMode}
                  className="text-[14px] font-roboto-mono"
                  disabled={mode === 'public' && lockDefaults}
                  extraLabel={
                    mode === 'public' && lockDefaults && (
                      <span
                        className={`ml-2 text-[12px] font-inter rounded-full px-2 py-1 ${darkMode ? 'bg-gray-400 text-slate-900' : 'bg-gray-400 text-slate-900'}`}
                      >
                        Imputed
                      </span>
                    )
                  }
                />
              </div>
            </div>

            {/* Treasury */}
            <div
              className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-md mb-6 transform hover:scale-101 transition-transform bg-gradient-to-b ${darkMode ? 'from-slate-800 to-slate-900' : 'from-white to-slate-100'}`}
            >
              <h3 className={`text-[22px] font-semibold tracking-tight font-inter-tight mb-4 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                Treasury
              </h3>
              <div className="space-y-4">
                <InputField
                  label="Treasury BTC"
                  value={assumptions.BTC_treasury}
                  onChange={(val) => (mode === 'public' && lockDefaults ? null : setAssumptions({ ...assumptions, BTC_treasury: val }))}
                  suffix="BTC"
                  tooltip="The amount of Bitcoin held in the treasury"
                  darkMode={darkMode}
                  className="text-[14px] font-roboto-mono"
                  disabled={mode === 'public' && lockDefaults}
                  extraLabel={
                    mode === 'public' && lockDefaults && (
                      <span
                        className={`ml-2 text-[12px] font-inter rounded-full px-2 py-1 ${darkMode ? 'bg-gray-400 text-slate-900' : 'bg-gray-400 text-slate-900'}`}
                      >
                        Imputed
                      </span>
                    )
                  }
                />
                <InputField
                  label="Current BTC Price"
                  value={assumptions.BTC_current_market_price}
                  onChange={null}
                  suffix="USD"
                  tooltip="Current market price of Bitcoin"
                  darkMode={darkMode}
                  className="text-[14px] font-roboto-mono"
                  disabled={true}
                  extraLabel={
                    mode === 'public' && (
                      <span
                        className={`ml-2 text-[12px] font-inter rounded-full px-2 py-1 ${darkMode ? 'bg-gray-400 text-slate-900' : 'bg-gray-400 text-slate-900'}`}
                      >
                        SEC XBRL
                      </span>
                    )
                  }
                />
                <InputField
                  label="Target BTC Price"
                  value={assumptions.targetBTCPrice}
                  onChange={(val) => (mode === 'public' && lockDefaults ? null : setAssumptions({ ...assumptions, targetBTCPrice: val }))}
                  suffix="USD"
                  tooltip="Your expected Bitcoin price at the end of the time horizon"
                  darkMode={darkMode}
                  className="text-[14px] font-roboto-mono"
                  disabled={mode === 'public' && lockDefaults}
                  extraLabel={
                    mode === 'public' && lockDefaults && (
                      <span
                        className={`ml-2 text-[12px] font-inter rounded-full px-2 py-1 ${darkMode ? 'bg-gray-400 text-slate-900' : 'bg-gray-400 text-slate-900'}`}
                      >
                        Imputed
                      </span>
                    )
                  }
                />
              </div>
            </div>

            {/* Constraints */}
            <div
              className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-md mb-6 transform hover:scale-101 transition-transform bg-gradient-to-b ${darkMode ? 'from-slate-800 to-slate-900' : 'from-white to-slate-100'}`}
            >
              <h3 className={`text-[22px] font-semibold tracking-tight font-inter-tight mb-4 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                Constraints
              </h3>
              <div className="space-y-4">
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
                  className="text-[14px] font-roboto-mono"
                  disabled={mode === 'public' && lockDefaults}
                  extraLabel={
                    mode === 'public' && lockDefaults && (
                      <span
                        className={`ml-2 text-[12px] font-inter rounded-full px-2 py-1 ${darkMode ? 'bg-gray-400 text-slate-900' : 'bg-gray-400 text-slate-900'}`}
                      >
                        Imputed
                      </span>
                    )
                  }
                />
                <HybridInput
                  label="Minimum Profit Margin"
                  value={assumptions.min_profit_margin}
                  onChange={(val) => (mode === 'public' && lockDefaults ? null : setAssumptions({ ...assumptions, min_profit_margin: val }))}
                  min={0.01}
                  max={0.5}
                  step={0.001}
                  suffix="%"
                  tooltip="Minimum acceptable profit margin for the loan"
                  darkMode={darkMode}
                  className="text-[14px] font-roboto-mono"
                  disabled={mode === 'public' && lockDefaults}
                  extraLabel={
                    mode === 'public' && lockDefaults && (
                      <span
                        className={`ml-2 text-[12px] font-inter rounded-full px-2 py-1 ${darkMode ? 'bg-gray-400 text-slate-900' : 'bg-gray-400 text-slate-900'}`}
                      >
                        Imputed
                      </span>
                    )
                  }
                />
                <InputField
                  label="Runway"
                  value={(assumptions.annual_burn_rate ? assumptions.initial_equity_value / assumptions.annual_burn_rate : 0).toFixed(2)}
                  onChange={null}
                  suffix="months"
                  tooltip="Simplified estimate of months of cash liquidity before insolvency. Backend calculations account for additional factors like cash flows, capital expenditures, and interest."
                  darkMode={darkMode}
                  className="text-[14px] font-roboto-mono"
                  disabled={true}
                  extraLabel={
                    <span
                      className={`ml-2 text-[12px] font-inter rounded-full px-2 py-1 ${darkMode ? 'bg-gray-400 text-slate-900' : 'bg-gray-400 text-slate-900'}`}
                    >
                      Calculated
                    </span>
                  }
                />
              </div>
            </div>
          </div>

          {/* Advanced Parameters (Right, Collapsible Drawer) */}
          <div
            className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-md transform hover:scale-101 transition-transform bg-gradient-to-b ${darkMode ? 'from-slate-800 to-slate-900' : 'from-white to-slate-100'}`}
          >
            <button
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className={`flex items-center justify-between w-full text-[22px] font-semibold tracking-tight font-inter-tight mb-4 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}
            >
              Advanced Parameters
              {isAdvancedOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
            {isAdvancedOpen && (
              <div className="space-y-4">
                {/* Heston Parameters */}
                <div>
                  <h4 className={`text-[18px] font-semibold font-inter-tight mb-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Heston Parameters
                  </h4>
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
                      className="text-[14px] font-roboto-mono"
                      disabled={mode === 'public' && lockDefaults}
                      extraLabel={
                        mode === 'public' && lockDefaults && (
                          <span
                            className={`ml-2 text-[12px] font-inter rounded-full px-2 py-1 ${darkMode ? 'bg-gray-400 text-slate-900' : 'bg-gray-400 text-slate-900'}`}
                          >
                            Imputed
                          </span>
                        )
                      }
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
                      className="text-[14px] font-roboto-mono"
                      disabled={mode === 'public' && lockDefaults}
                      extraLabel={
                        mode === 'public' && lockDefaults && (
                          <span
                            className={`ml-2 text-[12px] font-inter rounded-full px-2 py-1 ${darkMode ? 'bg-gray-400 text-slate-900' : 'bg-gray-400 text-slate-900'}`}
                          >
                            Imputed
                          </span>
                        )
                      }
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
                      className="text-[14px] font-roboto-mono"
                      disabled={mode === 'public' && lockDefaults}
                      extraLabel={
                        mode === 'public' && lockDefaults && (
                          <span
                            className={`ml-2 text-[12px] font-inter rounded-full px-2 py-1 ${darkMode ? 'bg-gray-400 text-slate-900' : 'bg-gray-400 text-slate-900'}`}
                          >
                            Imputed
                          </span>
                        )
                      }
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
                      className="text-[14px] font-roboto-mono"
                      disabled={mode === 'public' && lockDefaults}
                      extraLabel={
                        mode === 'public' && lockDefaults && (
                          <span
                            className={`ml-2 text-[12px] font-inter rounded-full px-2 py-1 ${darkMode ? 'bg-gray-400 text-slate-900' : 'bg-gray-400 text-slate-900'}`}
                          >
                            Imputed
                          </span>
                        )
                      }
                    />
                  </div>
                </div>

                {/* Market Assumptions */}
                <div>
                  <h4 className={`text-[18px] font-semibold font-inter-tight mb-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Market Assumptions
                  </h4>
                  <div className="space-y-4">
                    <InputField
                      label="Risk-Free Rate"
                      value={assumptions.risk_free_rate}
                      onChange={(val) => (mode === 'public' && lockDefaults ? null : setAssumptions({ ...assumptions, risk_free_rate: val }))}
                      suffix="%"
                      tooltip="Risk-free interest rate"
                      darkMode={darkMode}
                      className="text-[14px] font-roboto-mono"
                      disabled={mode === 'public' && lockDefaults}
                      extraLabel={
                        mode === 'public' && lockDefaults && (
                          <span
                            className={`ml-2 text-[12px] font-inter rounded-full px-2 py-1 ${darkMode ? 'bg-gray-400 text-slate-900' : 'bg-gray-400 text-slate-900'}`}
                          >
                            Imputed
                          </span>
                        )
                      }
                    />
                    <InputField
                      label="Expected BTC Return"
                      value={assumptions.expected_return_btc}
                      onChange={(val) => (mode === 'public' && lockDefaults ? null : setAssumptions({ ...assumptions, expected_return_btc: val }))}
                      suffix="%"
                      tooltip="Expected annual return on BTC"
                      darkMode={darkMode}
                      className="text-[14px] font-roboto-mono"
                      disabled={mode === 'public' && lockDefaults}
                      extraLabel={
                        mode === 'public' && lockDefaults && (
                          <span
                            className={`ml-2 text-[12px] font-inter rounded-full px-2 py-1 ${darkMode ? 'bg-gray-400 text-slate-900' : 'bg-gray-400 text-slate-900'}`}
                          >
                            Imputed
                          </span>
                        )
                      }
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
                      className="text-[14px] font-roboto-mono"
                      disabled={mode === 'public' && lockDefaults}
                      extraLabel={
                        mode === 'public' && lockDefaults && (
                          <span
                            className={`ml-2 text-[12px] font-inter rounded-full px-2 py-1 ${darkMode ? 'bg-gray-400 text-slate-900' : 'bg-gray-400 text-slate-900'}`}
                          >
                            Imputed
                          </span>
                        )
                      }
                    />
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
                      className="text-[14px] font-roboto-mono"
                      disabled={mode === 'public' && lockDefaults}
                      extraLabel={
                        mode === 'public' && lockDefaults && (
                          <span
                            className={`ml-2 text-[12px] font-inter rounded-full px-2 py-1 ${darkMode ? 'bg-gray-400 text-slate-900' : 'bg-gray-400 text-slate-900'}`}
                          >
                            Imputed
                          </span>
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Calculate Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleCalculate}
            disabled={isCalculating}
            className={`px-6 py-3 bg-emerald-500 text-white rounded-lg text-[16px] font-inter font-medium hover:bg-emerald-600 active:bg-emerald-700 transform hover:scale-101 transition-transform flex items-center justify-center ${isCalculating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isCalculating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Calculating... {calculationProgress}%
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4 mr-2" />
                Lock & Run Models
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