// Validate input for What-If analysis
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

const handleExport = async (
  format,
  endpoint = '/api/calculate/',
  param = null,
  value = null,
  assumptions,
  setError,
  setIsExportLoading,
  setExportType
) => {
  if (param !== null && value !== null && !validateWhatIfInput(param, value, setError)) return;

  setIsExportLoading(true);
  setExportType(format.toUpperCase());
  setError(null);

  try {
    const body = { assumptions, format, use_live: true };
    if (param !== null && value !== null) {
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


export { handleExport, validateWhatIfInput };