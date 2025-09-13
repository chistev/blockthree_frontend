import { useState, useEffect, useCallback } from 'react';
import HybridInput from './HybridInput';
import InputField from './InputField';
import DocumentationModal from './DocumentationModal';
import {
  Home,
  Moon,
  Sun,
  Save,
  Folder,
  Calculator,
  Info,
  Trash2,
} from 'lucide-react';

const AssumptionsPage = ({
  darkMode,
  setDarkMode,
  setCurrentPage,
  mode,
  setMode,
  secAssumptions,
  setSecAssumptions,
  assumptions,
  setAssumptions,
  isCalculating,
  calculationProgress,
  handleCalculate,
  isDocModalOpen,
  setIsDocModalOpen,
  error,
  setError,
  savedConfigs,
  setSavedConfigs,
  ticker,
  setTicker,
  uploadedFile,
  setUploadedFile,
  parsedSecData,
  setParsedSecData,
  privateFile,
  setPrivateFile,
  parsedPrivateData,
  setParsedPrivateData,
  isParsingPrivateFile,
  handlePrivateFileUpload,
  applyPrivateData,
}) => {
  const [configName, setConfigName] = useState('');
  const [selectedConfig, setSelectedConfig] = useState('');
  const [localSavedConfigs, setLocalSavedConfigs] = useState(savedConfigs);
  const [isFetchingSECData, setIsFetchingSECData] = useState(false);
  // Updated state for net-new mode fields
  const [netNewAssumptions, setNetNewAssumptions] = useState({
    starting_equity: assumptions.initial_equity_value || 90000000,
    btc_allocation_pct: 0.1, // Default 10%
    opex_per_month: 100000, // Default $100,000
    planned_debt_capacity: assumptions.LoanPrincipal || 25000000,
    initial_share_count: 1000000, // Default 1M shares
    capex_schedule: assumptions.capex_schedule || [], // Default empty array
    tax_rate: assumptions.tax_rate || 0.2, // Default 20%
    nols: assumptions.nols || 0, // Default 0
  });

  useEffect(() => {
    setSavedConfigs(localSavedConfigs);
  }, [localSavedConfigs, setSavedConfigs]);

  // Update assumptions when net-new fields change
  useEffect(() => {
    if (mode === 'net-new') {
      setAssumptions((prev) => ({
        ...prev,
        initial_equity_value: netNewAssumptions.starting_equity,
        LoanPrincipal: netNewAssumptions.planned_debt_capacity,
        BTC_treasury: (netNewAssumptions.starting_equity * netNewAssumptions.btc_allocation_pct) /
          (prev.BTC_current_market_price || 117000),
        shares_basic: netNewAssumptions.initial_share_count,
        shares_fd: netNewAssumptions.initial_share_count * 1.1, // Assume 10% dilution
        opex_monthly: netNewAssumptions.opex_per_month,
        capex_schedule: netNewAssumptions.capex_schedule,
        tax_rate: netNewAssumptions.tax_rate,
        nols: netNewAssumptions.nols,
      }));
    }
  }, [netNewAssumptions, mode, setAssumptions]);

  const handleSaveConfiguration = useCallback((name) => {
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

    saveConfiguration(assumptions, name, setLocalSavedConfigs, setError);
    setConfigName('');
  }, [assumptions, setError]);

  const handleLoadConfiguration = useCallback((name) => {
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

    loadConfiguration(name, setAssumptions, setError);
  }, [setAssumptions, setError]);

  const handleDeleteConfiguration = useCallback((name) => {
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

    deleteConfiguration(name, setLocalSavedConfigs, setError);
    if (selectedConfig === name) {
      setSelectedConfig('');
    }
  }, [selectedConfig, setError]);

  const fetchSECData = async (ticker) => {
    setIsFetchingSECData(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/sec_fetch/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setParsedSecData(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch SEC data:', err);
      setError('Failed to fetch SEC data. Please check the ticker and try again.');
    } finally {
      setIsFetchingSECData(false);
    }
  };

  const handleFileUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/sec_parse/', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setParsedSecData(data);
      setError(null);
    } catch (err) {
      console.error('Failed to parse uploaded file:', err);
      setError('Failed to parse uploaded file. Please try again.');
    }
  };

  const applySecData = (parsedData) => {
    setSecAssumptions({
      sec_initial_equity_value: parsedData.total_equity != null ? parsedData.total_equity : assumptions.initial_equity_value,
      sec_loan_principal: parsedData.total_debt != null ? parsedData.total_debt : assumptions.LoanPrincipal,
      sec_cash_reserves: parsedData.cash_reserves != null ? parsedData.cash_reserves : 0,
      shares_basic: parsedData.shares_basic != null ? parsedData.shares_basic : assumptions.shares_basic,
      shares_fd: parsedData.shares_fd != null ? parsedData.shares_fd : assumptions.shares_fd,
      opex_monthly: parsedData.opex_monthly != null ? parsedData.opex_monthly : assumptions.opex_monthly,
      capex_schedule: parsedData.capex_schedule != null ? parsedData.capex_schedule : assumptions.capex_schedule,
      tax_rate: parsedData.tax_rate != null ? parsedData.tax_rate : assumptions.tax_rate,
      nols: parsedData.nols != null ? parsedData.nols : assumptions.nols,
    });
    setParsedSecData(null);
  };

  const handleApplyPrivateData = (parsedData) => {
    setSecAssumptions({
      sec_initial_equity_value: parsedData.total_equity != null ? parsedData.total_equity : assumptions.initial_equity_value,
      sec_loan_principal: parsedData.total_debt != null ? parsedData.total_debt : assumptions.LoanPrincipal,
      sec_cash_reserves: parsedData.cash_reserves != null ? parsedData.cash_reserves : 0,
      shares_basic: parsedData.shares_basic != null ? parsedData.shares_basic : assumptions.shares_basic,
      shares_fd: parsedData.shares_fd != null ? parsedData.shares_fd : assumptions.shares_fd,
      opex_monthly: parsedData.opex_monthly != null ? parsedData.opex_monthly : assumptions.opex_monthly,
      capex_schedule: parsedData.capex_schedule != null ? parsedData.capex_schedule : assumptions.capex_schedule,
      tax_rate: parsedData.tax_rate != null ? parsedData.tax_rate : assumptions.tax_rate,
      nols: parsedData.nols != null ? parsedData.nols : assumptions.nols,
    });
    setParsedPrivateData(null);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-gray-50'} p-4 sm:p-8`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <button
              onClick={() => setCurrentPage('landing')}
              className={`p-2 rounded-lg flex items-center text-sm ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              title="Back to Home"
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
              Home
            </button>
            <div>
              <h1 className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Model Assumptions
              </h1>
              <p className={`${darkMode ? 'text-slate-400' : 'text-gray-600'} mt-2 text-sm sm:text-base`}>
                Configure parameters for risk analysis and treasury optimization
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                Mode:
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setMode('default')}
                  className={`px-3 py-1 rounded-lg text-sm ${mode === 'default' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700'}`}
                >
                  Default
                </button>
                <button
                  onClick={() => setMode('sec')}
                  className={`px-3 py-1 rounded-lg text-sm ${mode === 'sec' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700'}`}
                >
                  Public/SEC
                </button>
                <button
                  onClick={() => setMode('private')}
                  className={`px-3 py-1 rounded-lg text-sm ${mode === 'private' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700'}`}
                >
                  Private Company
                </button>
                <button
                  onClick={() => setMode('net-new')}
                  className={`px-3 py-1 rounded-lg text-sm ${mode === 'net-new' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700'}`}
                >
                  Net-New / Pro-Forma
                </button>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'}`}
            >
              {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>

        <div className={`p-4 sm:p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} mb-6`}>
          <h3 className={`text-base sm:text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Balance Sheet Parameters
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Basic Shares Outstanding"
              value={assumptions.shares_basic}
              onChange={(val) => setAssumptions({ ...assumptions, shares_basic: parseFloat(val) || 0 })}
              tooltip="Number of basic shares outstanding"
              darkMode={darkMode}
              disabled={mode === 'sec' && parsedSecData?.shares_basic}
            />
            <InputField
              label="Fully Diluted Shares"
              value={assumptions.shares_fd}
              onChange={(val) => setAssumptions({ ...assumptions, shares_fd: parseFloat(val) || 0 })}
              tooltip="Number of fully diluted shares"
              darkMode={darkMode}
              disabled={mode === 'sec' && parsedSecData?.shares_fd}
            />
            <InputField
              label="Monthly Operating Expenses ($)"
              value={assumptions.opex_monthly}
              onChange={(val) => setAssumptions({ ...assumptions, opex_monthly: parseFloat(val) || 0 })}
              tooltip="Monthly operating expenses"
              darkMode={darkMode}
              disabled={(mode === 'sec' && parsedSecData?.opex_monthly) || (mode === 'private' && parsedPrivateData?.opex_monthly)}
            />
            <InputField
              label="Tax Rate (%)"
              value={assumptions.tax_rate * 100}
              onChange={(val) => setAssumptions({ ...assumptions, tax_rate: parseFloat(val) / 100 || 0 })}
              tooltip="Effective corporate tax rate"
              darkMode={darkMode}
              disabled={mode === 'sec' && parsedSecData?.tax_rate}
            />
            <InputField
              label="Net Operating Losses ($)"
              value={assumptions.nols}
              onChange={(val) => setAssumptions({ ...assumptions, nols: parseFloat(val) || 0 })}
              tooltip="Net operating loss carryforwards"
              darkMode={darkMode}
              disabled={mode === 'sec' && parsedSecData?.nols}
            />
            <div className="col-span-2">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                Capital Expenditure Schedule (JSON)
              </label>
              <textarea
                value={JSON.stringify(assumptions.capex_schedule, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    if (Array.isArray(parsed) && parsed.every(val => typeof val === 'number' && !isNaN(val))) {
                      setAssumptions({ ...assumptions, capex_schedule: parsed });
                    } else {
                      setError('capex_schedule must be an array of numbers');
                    }
                  } catch {
                    setError('Invalid JSON format for capex_schedule');
                  }
                }}
                className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                rows={4}
                disabled={mode === 'sec' && parsedSecData?.capex_schedule}
              />
            </div>
          </div>
        </div>

        {mode === 'net-new' && (
          <div className={`p-4 sm:p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} mb-6`}>
            <h3 className={`text-base sm:text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Net-New / Pro-Forma Parameters
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Starting Equity"
                value={netNewAssumptions.starting_equity}
                onChange={(val) => setNetNewAssumptions({ ...netNewAssumptions, starting_equity: parseFloat(val) || 0 })}
                suffix="USD"
                tooltip="Total equity value at the start of the pro-forma analysis"
                darkMode={darkMode}
              />
              <HybridInput
                label="Intended BTC Allocation"
                value={netNewAssumptions.btc_allocation_pct}
                onChange={(val) => setNetNewAssumptions({ ...netNewAssumptions, btc_allocation_pct: parseFloat(val) || 0 })}
                min={0}
                max={1}
                step={0.01}
                suffix="%"
                tooltip="Percentage of starting equity to allocate to BTC treasury"
                darkMode={darkMode}
              />
              <InputField
                label="Opex per Month"
                value={netNewAssumptions.opex_per_month}
                onChange={(val) => setNetNewAssumptions({ ...netNewAssumptions, opex_per_month: parseFloat(val) || 0 })}
                suffix="USD"
                tooltip="Monthly operational expenditure"
                darkMode={darkMode}
              />
              <InputField
                label="Planned Debt Capacity"
                value={netNewAssumptions.planned_debt_capacity}
                onChange={(val) => setNetNewAssumptions({ ...netNewAssumptions, planned_debt_capacity: parseFloat(val) || 0 })}
                suffix="USD"
                tooltip="Maximum debt the company plans to take on"
                darkMode={darkMode}
              />
              <InputField
                label="Initial Share Count"
                value={netNewAssumptions.initial_share_count}
                onChange={(val) => setNetNewAssumptions({ ...netNewAssumptions, initial_share_count: parseFloat(val) || 0 })}
                tooltip="Number of shares outstanding at the start"
                darkMode={darkMode}
              />
              <InputField
                label="Tax Rate (%)"
                value={netNewAssumptions.tax_rate * 100}
                onChange={(val) => setNetNewAssumptions({ ...netNewAssumptions, tax_rate: parseFloat(val) / 100 || 0 })}
                tooltip="Effective corporate tax rate"
                darkMode={darkMode}
              />
              <InputField
                label="Net Operating Losses ($)"
                value={netNewAssumptions.nols}
                onChange={(val) => setNetNewAssumptions({ ...netNewAssumptions, nols: parseFloat(val) || 0 })}
                tooltip="Net operating loss carryforwards"
                darkMode={darkMode}
              />
              <div className="col-span-2">
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Capital Expenditure Schedule (JSON)
                </label>
                <textarea
                  value={JSON.stringify(netNewAssumptions.capex_schedule, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      if (Array.isArray(parsed) && parsed.every(val => typeof val === 'number' && !isNaN(val))) {
                        setNetNewAssumptions({ ...netNewAssumptions, capex_schedule: parsed });
                      } else {
                        setError('capex_schedule must be an array of numbers');
                      }
                    } catch {
                      setError('Invalid JSON format for capex_schedule');
                    }
                  }}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  rows={4}
                />
              </div>
            </div>
          </div>
        )}

        {mode === 'sec' && (
          <div className={`p-4 sm:p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} mb-6`}>
            <h3 className={`text-base sm:text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              SEC Data Ingestion
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="Enter ticker symbol (e.g., AAPL)"
                className={`w-full sm:w-64 px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-400' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'} focus:outline-none text-sm`}
              />
              <button
                onClick={() => fetchSECData(ticker)}
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center ${!ticker.trim() || isFetchingSECData ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                disabled={!ticker.trim() || isFetchingSECData}
              >
                {isFetchingSECData ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Fetching...
                  </>
                ) : (
                  'Fetch 10-K/10-Q'
                )}
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <input
                type="file"
                accept=".ixbrl,.pdf"
                aria-label="Upload SEC file"
                onChange={(e) => setUploadedFile(e.target.files[0])}
                className={`w-full sm:w-64 px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-400' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'} focus:outline-none text-sm`}
              />
              <button
                onClick={() => handleFileUpload(uploadedFile)}
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center ${!uploadedFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!uploadedFile}
              >
                Upload & Parse
              </button>
            </div>
            {parsedSecData && (
              <div className="mt-4">
                <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Parsed SEC Data
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(parsedSecData).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span>{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}:</span>
                      <span>{value != null ? value.toLocaleString() : 'N/A'}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => applySecData(parsedSecData)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Apply SEC Data
                </button>
              </div>
            )}
          </div>
        )}

        {mode === 'private' && (
          <div className={`p-4 sm:p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} mb-6`}>
            <h3 className={`text-base sm:text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Private Company Data Ingestion
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={(e) => setPrivateFile(e.target.files[0])}
                className={`w-full sm:w-64 px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-400' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'} focus:outline-none text-sm`}
              />
              <button
                onClick={() => handlePrivateFileUpload(privateFile)}
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center ${!privateFile || isParsingPrivateFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!privateFile || isParsingPrivateFile}
              >
                {isParsingPrivateFile ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Parsing...
                  </>
                ) : (
                  'Upload & Parse'
                )}
              </button>
            </div>
            {parsedPrivateData && (
              <div className="mt-4">
                <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Parsed Private Company Data
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(parsedPrivateData).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span>{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}:</span>
                      <span>{value != null ? value.toLocaleString() : 'N/A'}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => applyPrivateData(parsedPrivateData)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Apply Private Data
                </button>
              </div>
            )}
          </div>
        )}

        {Object.keys(secAssumptions).length > 0 && (
          <div className={`p-4 sm:p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} mb-6`}>
            <h3 className={`text-base sm:text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {mode === 'private' ? 'Private Company Parameters' : 'SEC-Derived Parameters'}
            </h3>
            {Object.entries(secAssumptions).map(([key, value]) => (
              <InputField
                key={key}
                label={key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                value={value}
                onChange={(val) => {
                  const numVal = parseFloat(val);
                  if (!isNaN(numVal) && numVal >= 0) {
                    setSecAssumptions({ ...secAssumptions, [key]: numVal });
                  }
                }}
                suffix="USD"
                darkMode={darkMode}
              />
            ))}
          </div>
        )}

        <div className={`p-4 sm:p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} mb-6`}>
          <h3 className={`text-base sm:text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Saved Configurations
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <input
              type="text"
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
              placeholder="Enter configuration name"
              className={`w-full sm:w-64 px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-400' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'} focus:outline-none text-sm`}
            />
            <button
              onClick={() => handleSaveConfiguration(configName)}
              className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center ${!configName.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!configName.trim()}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={selectedConfig}
              onChange={(e) => setSelectedConfig(e.target.value)}
              className={`w-full sm:w-64 px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              <option value="">Select a saved configuration</option>
              {Object.keys(localSavedConfigs).map((name) => (
                <option key={name} value={name}>
                  {name} ({new Date(localSavedConfigs[name].timestamp).toLocaleString()})
                </option>
              ))}
            </select>
            <button
              onClick={() => handleLoadConfiguration(selectedConfig)}
              className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center ${!selectedConfig ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!selectedConfig}
            >
              <Folder className="w-4 h-4 mr-2" />
              Load
            </button>
            <button
              onClick={() => handleDeleteConfiguration(selectedConfig)}
              className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center ${!selectedConfig ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!selectedConfig}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className={`p-4 sm:p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-base sm:text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              BTC Parameters
            </h3>
            <InputField
              label="BTC Treasury (Quantity)"
              value={assumptions.BTC_treasury}
              onChange={(val) => setAssumptions({ ...assumptions, BTC_treasury: val })}
              suffix="BTC"
              tooltip="The amount of Bitcoin held in the treasury"
              darkMode={darkMode}
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
              value={assumptions.targetBTCPrice}
              onChange={(val) => setAssumptions({ ...assumptions, targetBTCPrice: val })}
              suffix="USD"
              tooltip="Your expected Bitcoin price at the end of the time horizon"
              darkMode={darkMode}
            />
            <InputField
              label="Issue Price"
              value={assumptions.IssuePrice}
              onChange={(val) => setAssumptions({ ...assumptions, IssuePrice: val })}
              suffix="USD"
              tooltip="Price at which convertible notes are issued"
              darkMode={darkMode}
            />
          </div>

          <div className={`p-4 sm:p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-base sm:text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
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
              />
            ))}
          </div>

          <div className={`p-4 sm:p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-base sm:text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Debt & Equity Parameters
            </h3>
            <InputField
              label="Loan Principal"
              value={assumptions.LoanPrincipal}
              onChange={(val) => setAssumptions({ ...assumptions, LoanPrincipal: val })}
              suffix="USD"
              tooltip="Principal amount of the loan"
              darkMode={darkMode}
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
            />
            <InputField
              label="Initial Equity Value"
              value={assumptions.initial_equity_value}
              onChange={(val) => setAssumptions({ ...assumptions, initial_equity_value: val })}
              suffix="USD"
              tooltip="Initial value of equity"
              darkMode={darkMode}
            />
            <InputField
              label="New Equity Raised"
              value={assumptions.new_equity_raised}
              onChange={(val) => setAssumptions({ ...assumptions, new_equity_raised: val })}
              suffix="USD"
              tooltip="Amount of new equity raised"
              darkMode={darkMode}
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
            />
          </div>

          <div className={`p-4 sm:p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-base sm:text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Advanced Parameters
            </h3>
            {[
              { label: "Dilution Volatility Estimate", key: "dilution_vol_estimate", step: 0.001, suffix: "%", tooltip: "Volatility estimate for dilution calculation" },
              { label: "Volatility Mean Reversion Speed", key: "vol_mean_reversion_speed", step: 0.01, tooltip: "Speed of mean reversion for volatility" },
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
              />
            ))}
          </div>
        </div>

        <div className="flex justify-center space-x-4">
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
          <button
            onClick={() => setIsDocModalOpen(true)}
            className={`px-4 py-2 rounded-lg flex items-center text-sm ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <Info className="w-4 h-4 mr-1" />
            Learn More
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
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
      <DocumentationModal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} darkMode={darkMode} />
    </div>
  );
};

export default AssumptionsPage;