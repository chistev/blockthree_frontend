const DocumentationModal = ({ isOpen, onClose, darkMode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`p-6 rounded-xl max-w-lg w-full ${darkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'} border ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
        <h2 className="text-xl font-semibold mb-4">Calculation Methodology</h2>
        <p className="text-sm mb-4">
          <strong>Total BTC Portfolio Value</strong>: Calculated as BTC Treasury Quantity × Current BTC Price. This represents the raw value of your Bitcoin holdings.
        </p>
        <p className="text-sm mb-4">
          <strong>Structured Product Bundle Value</strong>: A weighted composite metric calculated as (0.4 × NAV + 0.3 × Dilution + 0.3 × Convertible Note Value) × (1 - Tax Rate), where Tax Rate is 20%. NAV accounts for collateral value, debt costs, and equity dilution. Convertible Note Value uses the Black-Scholes model adjusted for BTC price paths.
        </p>
        <p className="text-sm mb-4">
          <strong>NAV Erosion Risk</strong>: Probability that the Net Asset Value falls below 90% of its average value across all simulated BTC price paths, indicating potential downside risk.
        </p>
        <p className="text-sm mb-4">
          <strong>LTV Exceedance</strong>: Probability that the Loan-to-Value ratio exceeds the LTV Cap, based on simulated BTC price paths.
        </p>
        <p className="text-sm mb-4">
          <strong>Expected ROE</strong>: Return on Equity, calculated using the CAPM model adjusted for BTC volatility and beta.
        </p>
        <p className="text-sm mb-4">
          <strong>Dilution Risk</strong>: The base dilution from new equity raised, adjusted by simulated NAV paths and volatility. Structure (Convertible Note or BTC-Collateralized Loan) is chosen based on whether base dilution exceeds 10%.
        </p>
        <p className="text-sm mb-4">
          <strong>Price Distribution Analysis</strong>: Empirical probabilities from Monte Carlo simulations, including Bull Market (BTC price ≥ 1.5x current), Bear Market (≤ 0.7x), Stress Test (≤ 0.4x), and Normal Market (0.8x to 1.2x). Also includes Value at Risk (5th percentile) and Expected Shortfall (average price in worst 5% of scenarios).
        </p>
        <p className="text-sm mb-4">
          <strong>Scenario Analysis</strong>: Uses fixed, assumption-based probabilities for Bull, Base, Bear, and Stress Test scenarios. These are separate from empirical probabilities and are intended for narrative analysis, with some scenarios marked as stress tests.
        </p>
        <button
          onClick={onClose}
          className={`w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm`}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default DocumentationModal;