import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AssumptionsPage from '../components/AssumptionsPage';

// Mock the child components
vi.mock('../components/HybridInput', () => ({
  default: ({ label, value, onChange, suffix, tooltip, darkMode }) => (
    <div>
      <label>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={`input-${label.replace(/\s+/g, '-').toLowerCase()}`}
      />
      {suffix && <span>{suffix}</span>}
      {tooltip && <span data-testid={`tooltip-${label.replace(/\s+/g, '-').toLowerCase()}`}></span>}
    </div>
  ),
}));

vi.mock('../components/InputField', () => ({
  default: ({ label, value, onChange, suffix, tooltip, darkMode }) => (
    <div>
      <label>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={`input-${label.replace(/\s+/g, '-').toLowerCase()}`}
      />
      {suffix && <span>{suffix}</span>}
      {tooltip && <span data-testid={`tooltip-${label.replace(/\s+/g, '-').toLowerCase()}`}></span>}
    </div>
  ),
}));

vi.mock('../components/DocumentationModal', () => ({
  default: ({ isOpen, onClose, darkMode }) => (
    isOpen ? <div data-testid="documentation-modal">Documentation Modal</div> : null
  ),
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Home: () => <div>HomeIcon</div>,
  Moon: () => <div>MoonIcon</div>,
  Sun: () => <div>SunIcon</div>,
  Save: () => <div>SaveIcon</div>,
  Folder: () => <div>FolderIcon</div>,
  Calculator: () => <div>CalculatorIcon</div>,
  Info: () => <div>InfoIcon</div>,
  Trash2: () => <div>TrashIcon</div>,
}));

// Mock fetch
global.fetch = vi.fn();

// Mock useState to control parsedSecData
const mockSetParsedSecData = vi.fn();
vi.mock('react', async () => {
  const actualReact = await vi.importActual('react');
  return {
    ...actualReact,
    useState: vi.fn((initial) => {
      if (initial === null) {
        return [mockParsedData, mockSetParsedSecData];
      }
      return actualReact.useState(initial);
    }),
  };
});

const mockParsedData = {
  total_equity: 1000000,
  total_debt: 500000,
  cash_reserves: 200000
};

describe('AssumptionsPage', () => {
  const defaultProps = {
    darkMode: false,
    setDarkMode: vi.fn(),
    setCurrentPage: vi.fn(),
    mode: 'default',
    setMode: vi.fn(),
    secAssumptions: {},
    setSecAssumptions: vi.fn(),
    assumptions: {
      BTC_treasury: 100,
      BTC_current_market_price: 50000,
      targetBTCPrice: 100000,
      IssuePrice: 50,
      mu: 0.1,
      sigma: 0.6,
      t: 1,
      delta: 0,
      expected_return_btc: 0.15,
      risk_free_rate: 0.05,
      LoanPrincipal: 1000000,
      cost_of_debt: 0.08,
      LTV_Cap: 0.6,
      initial_equity_value: 5000000,
      new_equity_raised: 1000000,
      beta_ROE: 1.5,
      dilution_vol_estimate: 0.3,
      vol_mean_reversion_speed: 0.2,
      long_run_volatility: 0.6,
      paths: 10000,
      jump_intensity: 0.05,
      jump_mean: 0,
      jump_volatility: 0.1,
    },
    setAssumptions: vi.fn(),
    isCalculating: false,
    calculationProgress: 0,
    handleCalculate: vi.fn(),
    isDocModalOpen: false,
    setIsDocModalOpen: vi.fn(),
    error: null,
    setError: vi.fn(),
    savedConfigs: {},
    setSavedConfigs: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.resetModules();
  });

  const renderComponent = (props = {}) => {
    return render(<AssumptionsPage {...defaultProps} {...props} />);
  };

  it('renders the component with all sections', () => {
    renderComponent();
    
    expect(screen.getByText('Model Assumptions')).toBeInTheDocument();
    expect(screen.getByText('Configure parameters for risk analysis and treasury optimization')).toBeInTheDocument();
    expect(screen.getByText('BTC Parameters')).toBeInTheDocument();
    expect(screen.getByText('Model Parameters')).toBeInTheDocument();
    expect(screen.getByText('Debt & Equity Parameters')).toBeInTheDocument();
    expect(screen.getByText('Advanced Parameters')).toBeInTheDocument();
    expect(screen.getByText('Saved Configurations')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Run Models/i })).toBeInTheDocument();
  });

  it('renders mode selection buttons correctly', () => {
    renderComponent();
    
    expect(screen.getByText('Default')).toBeInTheDocument();
    expect(screen.getByText('Public/SEC')).toBeInTheDocument();
    expect(screen.getByText('Private Company')).toBeInTheDocument();
  });

  it('shows SEC data ingestion section when in SEC mode', () => {
    renderComponent({ mode: 'sec' });
    
    expect(screen.getByText('SEC Data Ingestion')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter ticker symbol (e.g., AAPL)')).toBeInTheDocument();
    expect(screen.getByText('Fetch 10-K/10-Q')).toBeInTheDocument();
  });

  it('shows private company data ingestion section when in private mode', () => {
    renderComponent({ mode: 'private' });
    
    expect(screen.getByText('Private Company Data Ingestion')).toBeInTheDocument();
    expect(screen.getByText('Upload & Parse')).toBeInTheDocument();
  });

  it('shows SEC-derived parameters when secAssumptions has values', () => {
    renderComponent({ 
      secAssumptions: { 
        sec_initial_equity_value: 1000000, 
        sec_loan_principal: 500000 
      } 
    });
    
    expect(screen.getByText('SEC-Derived Parameters')).toBeInTheDocument();
  });

  it('handles saving a configuration', async () => {
    renderComponent();
    
    const configNameInput = screen.getByPlaceholderText('Enter configuration name');
    const saveButton = screen.getByRole('button', { name: /Save/i });
    
    fireEvent.change(configNameInput, { target: { value: 'Test Config' } });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(defaultProps.setError).toHaveBeenCalledWith(null);
    });
  });

  it('handles loading a configuration', async () => {
    // Save a config first
    const configName = 'Test Config';
    const configData = {
      assumptions: defaultProps.assumptions,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('savedConfigs', JSON.stringify({ [configName]: configData }));
    
    renderComponent({ savedConfigs: { [configName]: configData } });
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: configName } });
    
    const loadButton = screen.getByRole('button', { name: /Load/i });
    fireEvent.click(loadButton);
    
    await waitFor(() => {
      expect(defaultProps.setAssumptions).toHaveBeenCalledWith(configData.assumptions);
    });
  });

  it('handles deleting a configuration', async () => {
    // Save a config first
    const configName = 'Test Config';
    const configData = {
      assumptions: defaultProps.assumptions,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('savedConfigs', JSON.stringify({ [configName]: configData }));
    
    renderComponent({ savedConfigs: { [configName]: configData } });
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: configName } });
    
    const deleteButton = screen.getByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(defaultProps.setSavedConfigs).toHaveBeenCalled();
    });
  });

  it('handles dark mode toggle', () => {
    renderComponent();
    
    const darkModeButton = screen.getByRole('button', { name: /MoonIcon|SunIcon/i });
    fireEvent.click(darkModeButton);
    
    expect(defaultProps.setDarkMode).toHaveBeenCalledWith(true);
  });

  it('handles navigation to home', () => {
    renderComponent();
    
    const homeButton = screen.getByRole('button', { name: /HomeIcon/i });
    fireEvent.click(homeButton);
    
    expect(defaultProps.setCurrentPage).toHaveBeenCalledWith('landing');
  });

  it('handles opening documentation modal', () => {
    renderComponent();
    
    const infoButton = screen.getByRole('button', { name: /Learn More/i });
    fireEvent.click(infoButton);
    
    expect(defaultProps.setIsDocModalOpen).toHaveBeenCalledWith(true);
  });

  it('handles running models', () => {
    renderComponent();
    
    const runButton = screen.getByRole('button', { name: /Run Models/i });
    fireEvent.click(runButton);
    
    expect(defaultProps.handleCalculate).toHaveBeenCalled();
  });

  it('shows loading state when calculating', () => {
    renderComponent({ isCalculating: true, calculationProgress: 50 });
    
    expect(screen.getByText('Running Models (50%)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Running Models/i })).toBeDisabled();
  });

  it('shows error message when there is an error', () => {
    const errorMessage = 'Test error message';
    renderComponent({ error: errorMessage });
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('handles SEC data fetching', async () => {
    const mockResponse = {
      total_equity: 1000000,
      total_debt: 500000,
      cash_reserves: 200000
    };
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    renderComponent({ mode: 'sec' });
    
    const tickerInput = screen.getByPlaceholderText('Enter ticker symbol (e.g., AAPL)');
    const fetchButton = screen.getByText('Fetch 10-K/10-Q');
    
    fireEvent.change(tickerInput, { target: { value: 'AAPL' } });
    fireEvent.click(fetchButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:8000/api/sec_fetch/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: 'AAPL' })
      });
    });
  });

  it('handles file upload for SEC data', async () => {
    const mockResponse = {
      total_equity: 1000000,
      total_debt: 500000,
      cash_reserves: 200000
    };
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    renderComponent({ mode: 'sec' });
    
    // Create a mock file input event
    const fileInput = screen.getByLabelText(/upload/i);
    const file = new File(['test content'], 'test.ixbrl', { type: 'application/xml' });
    
    // We need to mock the file input since we can't actually upload files in tests
    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });
    
    const uploadButton = screen.getByText('Upload & Parse');
    fireEvent.click(uploadButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  it('applies SEC data when apply button is clicked', async () => {
    // Mock the useState hook to return our test data
    const useStateSpy = vi.spyOn(require('react'), 'useState');
    useStateSpy.mockImplementationOnce(() => [mockParsedData, mockSetParsedSecData]); // For parsedSecData
    
    renderComponent({ mode: 'sec' });
    
    // The button should now be visible
    const applyButton = screen.getByText('Apply SEC Data');
    fireEvent.click(applyButton);
    
    expect(defaultProps.setSecAssumptions).toHaveBeenCalledWith({
      sec_initial_equity_value: 1000000,
      sec_loan_principal: 500000,
      sec_cash_reserves: 200000
    });
    
    // Clean up
    useStateSpy.mockRestore();
  });
});