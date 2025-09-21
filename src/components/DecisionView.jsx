import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Helper function to calculate median
const median = (arr) => {
  if (!arr || arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

// Simple CSS spinner component
const Spinner = () => (
  <svg
    className="animate-spin h-5 w-5 text-white inline-block mr-2"
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
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

const DecisionView = ({ darkMode, setCurrentPage, results, assumptions, handleExport, isExportLoading, exportType }) => {
  if (!results || !results.metrics) {
    return (
      <div className={`min-h-screen p-6 ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-black'}`}>
        <p className="text-lg">No decision data available. Please run the models first.</p>
        <button
          onClick={() => setCurrentPage('assumptions')}
          className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
        >
          Back to Assumptions
        </button>
      </div>
    );
  }

  const { metrics, candidates, mode } = results;

  // Prepare data for NAV distribution chart
  const navPaths = metrics.nav.nav_paths || [];
  const labels = Array.from({ length: navPaths.length }, (_, i) => i + 1);
  const chartData = {
    labels,
    datasets: [
      {
        label: 'NAV Paths ($)',
        data: navPaths,
        borderColor: darkMode ? 'rgba(34, 211, 238, 0.8)' : 'rgba(16, 185, 129, 0.8)',
        backgroundColor: darkMode ? 'rgba(34, 211, 238, 0.2)' : 'rgba(16, 185, 129, 0.2)',
        fill: false,
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { color: darkMode ? '#fff' : '#000' } },
      title: { display: true, text: 'NAV Distribution Across Paths', color: darkMode ? '#fff' : '#000' },
    },
    scales: {
      x: { title: { display: true, text: 'Path Index', color: darkMode ? '#fff' : '#000' } },
      y: { title: { display: true, text: 'NAV ($)', color: darkMode ? '#fff' : '#000' } },
    },
  };

  // Format numbers for display
  const formatNumber = (num, decimals = 2) => {
    return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const formatPercent = (num, decimals = 2) => {
    return `${(num * 100).toFixed(decimals)}%`;
  };

  // Metric cards data
  const metricsData = [
    { label: 'Average NAV', value: `$${formatNumber(metrics.nav.avg_nav)}`, sub: `±$${formatNumber(metrics.nav.ci_upper - metrics.nav.avg_nav)}` },
    { label: 'NAV Erosion Prob', value: formatPercent(metrics.nav.erosion_prob), sub: `CI: ${formatPercent(metrics.nav.ci_erosion_lower)} - ${formatPercent(metrics.nav.ci_erosion_upper)}` },
    { label: 'LTV Breach Prob', value: formatPercent(metrics.ltv.exceed_prob), sub: `Avg LTV: ${formatPercent(metrics.ltv.avg_ltv)}` },
    { label: 'Runway (Months)', value: formatNumber(metrics.runway.dist_mean, 1), sub: `P95: ${formatNumber(metrics.runway.p95, 1)}` },
    { label: 'Average Dilution', value: formatPercent(metrics.dilution.avg_dilution), sub: `P50: ${formatPercent(median(metrics.dilution.dilution_paths))}` },
    { label: 'ROE', value: formatPercent(metrics.roe.avg_roe), sub: `Sharpe: ${formatNumber(metrics.roe.sharpe, 2)}` },
  ];

  return (
    <div className={`min-h-screen p-6 ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-black'}`}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Decision Analysis Dashboard</h1>
        {metrics.mc_warning && (
          <div className="mb-4 p-4 bg-yellow-500 text-black rounded-lg">
            Warning: {metrics.mc_warning}
          </div>
        )}
        
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {metricsData.map((metric, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg shadow-lg ${darkMode ? 'bg-slate-800' : 'bg-white'}`}
            >
              <h3 className="text-lg font-semibold">{metric.label}</h3>
              <p className="text-2xl font-bold">{metric.value}</p>
              <p className="text-sm text-gray-400">{metric.sub}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className={`p-4 rounded-lg shadow-lg mb-8 ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
          <Line data={chartData} options={chartOptions} />
        </div>

        {/* Scenario Metrics */}
        <div className={`p-4 rounded-lg shadow-lg mt-8 ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
          <h2 className="text-xl font-semibold mb-4">Scenario Analysis</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(metrics.scenario_metrics).map(([scenario, data]) => (
              <div key={scenario} className="p-4 border rounded-lg">
                <h3 className="font-semibold">{scenario}</h3>
                <p>BTC Price: ${formatNumber(data.btc_price)}</p>
                <p>LTV Ratio: {formatPercent(data.ltv_ratio)}</p>
                <p>Probability: {formatPercent(data.probability)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation and Export Buttons */}
        <div className="mt-8 flex space-x-4">
          <button
            onClick={() => setCurrentPage('assumptions')}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            ← Back to Assumptions
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={isExportLoading}
            className={`px-4 py-2 flex items-center ${
              isExportLoading && exportType === 'CSV'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white rounded-lg`}
            aria-label={isExportLoading && exportType === 'CSV' ? 'Exporting CSV, please wait' : 'Export to CSV'}
            aria-busy={isExportLoading && exportType === 'CSV'}
          >
            {isExportLoading && exportType === 'CSV' && <Spinner />}
            {isExportLoading && exportType === 'CSV' ? 'Exporting CSV...' : 'Export to CSV'}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={isExportLoading}
            className={`px-4 py-2 flex items-center ${
              isExportLoading && exportType === 'PDF'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white rounded-lg`}
            aria-label={isExportLoading && exportType === 'PDF' ? 'Exporting PDF, please wait' : 'Export to PDF'}
            aria-busy={isExportLoading && exportType === 'PDF'}
          >
            {isExportLoading && exportType === 'PDF' && <Spinner />}
            {isExportLoading && exportType === 'PDF' ? 'Exporting PDF...' : 'Export to PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DecisionView;