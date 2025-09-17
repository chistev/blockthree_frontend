import { useState, useEffect } from 'react';
import { mapResults } from './components/mapResults';
import LandingPage from './components/LandingPage';
import AssumptionsPage from './components/AssumptionsPage';
import RunModelsPage from './components/RunModelsPage';
import DecisionView from './components/DecisionView';
import TermSheetPage from './components/TermSheetPage';
import './index.css';

// API Utilities
const fetchDefaultParams = async (setAssumptions, setError) => {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/default_params/', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    setAssumptions(data);
    return data;
  } catch (err) {
    console.error('Failed to fetch default parameters:', err);
    setError('Failed to fetch default parameters. Using fallback values.');
    return null;
  }
};

const fetchBTCPrice = async (setAssumptions, setError, retries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
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
      return; // Success, exit the function
    } catch (err) {
      console.error(`Attempt ${attempt} failed to fetch BTC price:`, err);
      if (attempt === retries) {
        // Last attempt failed, set error and fallback values
        setError('Failed to fetch live BTC price after multiple attempts. Using default value.');
        setAssumptions((prev) => ({
          ...prev,
          BTC_current_market_price: prev.BTC_current_market_price || 117000,
          targetBTCPrice: prev.targetBTCPrice || 117000,
        }));
        return;
      }
      // Wait before retrying (exponential backoff: 1s, 2s, 4s)
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
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
  const [error, setError] = useState(null);
  const [assumptions, setAssumptions] = useState({});
  const [results, setResults] = useState(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState(getSavedConfigurations());
  const [mode, setMode] = useState('manual');
  const [ticker, setTicker] = useState('');
  const [isExportLoading, setIsExportLoading] = useState(false); // Track export loading state
  const [exportType, setExportType] = useState(null); // Track export type (CSV or PDF)

  useEffect(() => {
    const initializeAssumptions = async () => {
      const defaultParams = await fetchDefaultParams(setAssumptions, setError);
      if (defaultParams) {
        await fetchBTCPrice(setAssumptions, setError);
      }
    };
    initializeAssumptions();
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
      setCurrentPage('runModels');
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsCalculating(false);
        setCalculationProgress(0);
      }, 500);
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
      const response = await fetch(`http://127.0.0.1:8000${endpoint}`, {
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
      {currentPage === 'runModels' && results && (
        <RunModelsPage
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          setCurrentPage={setCurrentPage}
          results={results}
          assumptions={assumptions}
          isCalculating={isCalculating}
          calculationProgress={calculationProgress}
          setIsDocModalOpen={setIsDocModalOpen}
          isDocModalOpen={isDocModalOpen}
          error={error}
        />
      )}
      {currentPage === 'decision' && results && (
        <DecisionView
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          setCurrentPage={setCurrentPage}
          results={results}
          assumptions={assumptions}
          setIsDocModalOpen={setIsDocModalOpen}
          isDocModalOpen={isDocModalOpen}
        />
      )}
      {currentPage === 'termSheet' && results && (
        <TermSheetPage
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          setCurrentPage={setCurrentPage}
          results={results}
          assumptions={assumptions}
          setIsDocModalOpen={setIsDocModalOpen}
          isDocModalOpen={isDocModalOpen}
          error={error}
          handleExport={handleExport}
          isExportLoading={isExportLoading} // Pass export loading state
          exportType={exportType} // Pass export type
        />
      )}
    </>
  );
};

export default App;