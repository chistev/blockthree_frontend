import {
  Home,
  Sliders,
  Sun,
  Moon,
  Info,
  Download,
  FileText,
  DollarSign,
  Briefcase,
  Shield,
  AlertTriangle,
  Target,
  TrendingDown,
  BarChart
} from 'lucide-react';
import DocumentationModal from './DocumentationModal';
import MetricCard from './MetricCard';
import { XAxis, YAxis, CartesianGrid, Tooltip, Bar, ResponsiveContainer } from 'recharts';
import { LineChart, Line } from 'recharts';

const TermSheetPage = ({
  darkMode,
  setDarkMode,
  setCurrentPage,
  results,
  assumptions,
  setIsDocModalOpen,
  isDocModalOpen,
  error,
  handleExport,
  isExportLoading,
  exportType,
}) => {
  // Get actual data from results or use fallbacks
  const termSheet = results?.metrics?.term_sheet || {};
  const businessImpact = results?.metrics?.business_impact || {};
  const navMetrics = results?.metrics?.nav || {};
  const ltvMetrics = results?.metrics?.ltv || {};
  const dilutionMetrics = results?.metrics?.dilution || {};
  const runwayMetrics = results?.metrics?.runway || {};
  const roeMetrics = results?.metrics?.roe || {};
  const btcHoldings = results?.metrics?.btc_holdings || {};
  
  // Prepare data for charts using actual data from results
  const dilutionDistributionData = dilutionMetrics.dilution_paths 
    ? dilutionMetrics.dilution_paths.map((val, i) => ({
        dilution: (val * 100).toFixed(1),
        frequency: i % 10, // Simplified frequency for visualization
      })).slice(0, 20) // Limit data points
    : [];

  // Simplified hedge payoff data (placeholder as this isn't in the server response)
  const hedgePayoffData = [
    { btcPrice: 50000, payoff: -1000 },
    { btcPrice: 60000, payoff: 0 },
    { btcPrice: 70000, payoff: 500 },
    { btcPrice: 80000, payoff: 1500 },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-slate-100'} font-inter p-4 sm:p-6`}>
      {/* Header */}
      <nav className={`px-4 sm:px-8 py-4 border-b ${darkMode ? 'border-slate-900' : 'border-slate-100'}`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <button
              onClick={() => setCurrentPage('landing')}
              className={`p-2 rounded-lg text-[14px] font-inter transform hover:scale-101 transition-transform ${
                darkMode ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
              }`}
              title="Back to Home"
            >
              <Home className="w-4 h-4 inline-block mr-1" />
              Home
            </button>
            <button
              onClick={() => setCurrentPage('assumptions')}
              className={`p-2 rounded-lg text-[14px] font-inter transform hover:scale-101 transition-transform ${
                darkMode ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
              }`}
              title="Back to Assumptions"
            >
              <Sliders className="w-4 h-4 inline-block mr-1" />
              Assumptions
            </button>
            <h1 className={`text-[28px] font-semibold tracking-tight font-inter-tight ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              Term Sheet Drill-Down
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 bg-emerald-500 rounded-full"></span>
              <span className={`text-[12px] font-inter ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                Snapshot: #{results?.snapshot_id || 'N/A'}
              </span>
            </div>
            <button
              onClick={() => setIsDocModalOpen(true)}
              className={`px-3 py-2 rounded-lg text-[14px] font-inter transform hover:scale-101 transition-transform ${
                darkMode ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
              }`}
            >
              <Info className="w-4 h-4 inline-block mr-1" />
              Learn More
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transform hover:scale-101 transition-transform ${
                darkMode ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Term Sheet Summary (2/3 width) */}
        <div className="lg:col-span-2">
          <div
            className={`p-4 rounded-2xl border shadow-md transform hover:scale-101 transition-transform bg-gradient-to-b ${
              darkMode ? 'bg-slate-800 border-slate-700 from-slate-800 to-slate-900' : 'bg-white border-slate-200 from-white to-slate-100'
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-[22px] font-semibold tracking-tight font-inter-tight ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                Term Sheet Summary
              </h2>
              <span className={`text-[12px] font-inter rounded-full px-2 py-1 bg-gray-400 text-slate-900`}>
                {termSheet.structure || 'N/A'}
              </span>
            </div>

            {/* Deal Economics */}
            <div className="mb-6">
              <h3 className={`text-[18px] font-semibold font-inter-tight mb-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                Deal Economics
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MetricCard
                  title="Principal"
                  value={termSheet.amount || assumptions.LoanPrincipal}
                  description="Loan or note principal amount"
                  tooltip="Total principal amount of the financial instrument"
                  icon={DollarSign}
                  format="currency"
                  darkMode={darkMode}
                  numberClassName="text-[26px] font-bold font-roboto-mono"
                />
                <MetricCard
                  title="Interest Rate"
                  value={termSheet.rate || assumptions.cost_of_debt}
                  description="Annual interest rate"
                  tooltip="Annualized interest rate for the loan or convertible note"
                  icon={DollarSign}
                  format="percentage"
                  darkMode={darkMode}
                  numberClassName="text-[26px] font-bold font-roboto-mono"
                />
                <MetricCard
                  title="Term"
                  value={termSheet.term || assumptions.t}
                  description="Duration in months"
                  tooltip="Duration of the loan or note in months"
                  icon={Briefcase}
                  format="number"
                  darkMode={darkMode}
                  numberClassName="text-[26px] font-bold font-roboto-mono"
                />
                <MetricCard
                  title="LTV Cap"
                  value={termSheet.ltv_cap || assumptions.LTV_Cap}
                  description="Maximum loan-to-value ratio"
                  tooltip="Maximum allowed loan-to-value ratio"
                  icon={Shield}
                  format="percentage"
                  darkMode={darkMode}
                  numberClassName="text-[26px] font-bold font-roboto-mono"
                />
              </div>
            </div>

            {/* Risk & Return */}
            <div className="mb-6">
              <h3 className={`text-[18px] font-semibold font-inter-tight mb-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                Risk & Return
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MetricCard
                  title="ROE Uplift"
                  value={businessImpact.roe_uplift || 0}
                  description="Improvement in ROE"
                  tooltip="Increase in Return on Equity due to the deal structure"
                  icon={Target}
                  format="percentage"
                  darkMode={darkMode}
                  numberClassName="text-[26px] font-bold font-roboto-mono"
                />
                <MetricCard
                  title="NAV Erosion Prob"
                  value={navMetrics.erosion_prob || 0}
                  description="NAV erosion risk"
                  tooltip="Likelihood that NAV drops below 90% of its average value"
                  icon={AlertTriangle}
                  format="percentage"
                  darkMode={darkMode}
                  numberClassName="text-[26px] font-bold font-roboto-mono"
                  highlight={navMetrics.erosion_prob > 0.2 ? 'red' : null}
                />
                <MetricCard
                  title="LTV Breach Prob"
                  value={ltvMetrics.exceed_prob || 0}
                  description="LTV breach probability"
                  tooltip="Probability of exceeding the LTV cap"
                  icon={Shield}
                  format="percentage"
                  darkMode={darkMode}
                  numberClassName="text-[26px] font-bold font-roboto-mono"
                  highlight={ltvMetrics.exceed_prob > 0.1 ? 'red' : null}
                />
                <MetricCard
                  title="Average Dilution"
                  value={dilutionMetrics.avg_dilution || 0}
                  description="Expected dilution"
                  tooltip="Average expected dilution from the deal"
                  icon={TrendingDown}
                  format="percentage"
                  darkMode={darkMode}
                  numberClassName="text-[26px] font-bold font-roboto-mono"
                />
              </div>
            </div>

            {/* Business Impact */}
            <div>
              <h3 className={`text-[18px] font-semibold font-inter-tight mb-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                Business Impact
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MetricCard
                  title="BTC Bought"
                  value={termSheet.btc_bought || 0}
                  description="Additional BTC acquired"
                  tooltip="Amount of Bitcoin purchased through the deal"
                  icon={DollarSign}
                  format="number"
                  darkMode={darkMode}
                  numberClassName="text-[26px] font-bold font-roboto-mono"
                />
                <MetricCard
                  title="Total BTC Treasury"
                  value={btcHoldings.total_btc || assumptions.BTC_treasury}
                  description="Total BTC holdings"
                  tooltip="Total Bitcoin held in treasury after the deal"
                  icon={DollarSign}
                  format="number"
                  darkMode={darkMode}
                  numberClassName="text-[26px] font-bold font-roboto-mono"
                />
                <MetricCard
                  title="Savings"
                  value={businessImpact.savings || 0}
                  description="Cost savings"
                  tooltip="Cost savings compared to alternative financing options"
                  icon={DollarSign}
                  format="currency"
                  darkMode={darkMode}
                  numberClassName="text-[26px] font-bold font-roboto-mono"
                />
              </div>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="mt-6 flex gap-4">
            <button
              onClick={() => handleExport('csv')}
              disabled={isExportLoading}
              className={`flex-1 px-6 py-3 rounded-lg text-[16px] font-inter font-medium flex items-center justify-center transform hover:scale-101 transition-transform ${
                isExportLoading && exportType === 'csv'
                  ? 'bg-gray-500 text-white cursor-not-allowed'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700'
              }`}
            >
              {isExportLoading && exportType === 'csv' ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                  Downloading CSV...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </>
              )}
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={isExportLoading}
              className={`flex-1 px-6 py-3 rounded-lg text-[16px] font-inter font-medium flex items-center justify-center transform hover:scale-101 transition-transform ${
                isExportLoading && exportType === 'pdf'
                  ? 'bg-gray-500 text-white cursor-not-allowed'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700'
              }`}
            >
              {isExportLoading && exportType === 'pdf' ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                  Downloading PDF...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Export PDF
                </>
              )}
            </button>
          </div>

          {/* PDF Watermark (Visible in PDF Export Only) */}
          <div className="hidden pdf-only text-center text-[12px] font-inter text-red-500 mt-4">
            Confidential – Draft
          </div>
        </div>

        {/* Charts Panel (1/3 width) */}
        <div className="lg:col-span-1">
          {/* Dilution Distribution */}
          <div
            className={`p-4 rounded-2xl border shadow-md transform hover:scale-101 transition-transform bg-gradient-to-b ${
              darkMode ? 'bg-slate-800 border-slate-700 from-slate-800 to-slate-900' : 'bg-white border-slate-200 from-white to-slate-100'
            } mb-6`}
          >
            <h3 className={`text-[18px] font-semibold font-inter-tight mb-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              Dilution Distribution
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dilutionDistributionData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                  <XAxis
                    dataKey="dilution"
                    label={{
                      value: 'Dilution (%)',
                      position: 'bottom',
                      offset: 0,
                      fill: darkMode ? '#D1D5DB' : '#334155',
                      fontFamily: 'Inter',
                      fontSize: 14,
                    }}
                    stroke={darkMode ? '#D1D5DB' : '#334155'}
                  />
                  <YAxis
                    label={{
                      value: 'Frequency',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 10,
                      fill: darkMode ? '#D1D5DB' : '#334155',
                      fontFamily: 'Inter',
                      fontSize: 14,
                    }}
                    stroke={darkMode ? '#D1D5DB' : '#334155'}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                      border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                      borderRadius: '8px',
                      fontFamily: 'Inter',
                      fontSize: 14,
                    }}
                  />
                  <Bar dataKey="frequency" fill={darkMode ? '#10b981' : '#047857'} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Runway Distribution */}
          <div
            className={`p-4 rounded-2xl border shadow-md transform hover:scale-101 transition-transform bg-gradient-to-b ${
              darkMode ? 'bg-slate-800 border-slate-700 from-slate-800 to-slate-900' : 'bg-white border-slate-200 from-white to-slate-100'
            }`}
          >
            <h3 className={`text-[18px] font-semibold font-inter-tight mb-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              Runway Distribution
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[]} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                  <XAxis
                    label={{
                      value: 'Months',
                      position: 'bottom',
                      offset: 0,
                      fill: darkMode ? '#D1D5DB' : '#334155',
                      fontFamily: 'Inter',
                      fontSize: 14,
                    }}
                    stroke={darkMode ? '#D1D5DB' : '#334155'}
                  />
                  <YAxis
                    label={{
                      value: 'Probability',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 10,
                      fill: darkMode ? '#D1D5DB' : '#334155',
                      fontFamily: 'Inter',
                      fontSize: 14,
                    }}
                    stroke={darkMode ? '#D1D5DB' : '#334155'}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                      border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                      borderRadius: '8px',
                      fontFamily: 'Inter',
                      fontSize: 14,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="probability"
                    stroke={darkMode ? '#10b981' : '#047857'}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className={`text-center mt-4 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Runway: {runwayMetrics.dist_mean?.toFixed(1) || 'N/A'} months (avg)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className={`p-4 rounded-2xl bg-red-100 border border-red-300 text-red-500 text-[14px] font-inter mt-4 max-w-7xl mx-auto`}>
          {error}
        </div>
      )}

      <DocumentationModal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} darkMode={darkMode} />
    </div>
  );
};

export default TermSheetPage;