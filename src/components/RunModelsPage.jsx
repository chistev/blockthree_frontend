import {
    Home,
    Sliders,
    Sun,
    Moon,
    DollarSign,
    AlertTriangle,
    TrendingDown,
    Info,
} from 'lucide-react';
import DocumentationModal from './DocumentationModal';
import MetricCard from './MetricCard'; // Import MetricCard from separate file

const RunModelsPage = ({
    darkMode,
    setDarkMode,
    setCurrentPage,
    results,
    assumptions,
    isCalculating,
    calculationProgress,
    setIsDocModalOpen,
    isDocModalOpen,
    error,
}) => {
    // Placeholder assumptions for missing data
    const cashReserves = assumptions.new_equity_raised || 10000000; // Default to $10M if not provided
    const annualBurnRate = 12000000; // Assume $1M/month burn rate
    const runwayMonths = cashReserves / (annualBurnRate / 12); // Calculate runway
    const totalDebt = assumptions.LoanPrincipal;
    const equityValue = assumptions.initial_equity_value + assumptions.new_equity_raised;

    // Thresholds for highlighting pain points
    const runwayThreshold = 12; // Highlight if < 12 months
    const ltvBreachThreshold = 0.5; // Highlight if > 50%
    const dilutionThreshold = 0.1; // Highlight if > 10%

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-[#111827]' : 'bg-[#F9FAFB]'} font-inter`}>
            {/* Header */}
            <nav className={`px-4 sm:px-8 py-3 border-b ${darkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E5E7EB]'}`}>
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center">
                    <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                        <button
                            onClick={() => setCurrentPage('landing')}
                            className={`p-2 rounded-lg text-sm ${darkMode ? 'bg-[#374151] text-white' : 'bg-[#E5E7EB] text-[#0A1F44]'}`}
                            title="Back to Home"
                        >
                            <Home className="w-4 h-4 inline-block mr-1" />
                            Home
                        </button>
                        <button
                            onClick={() => setCurrentPage('assumptions')}
                            className={`p-2 rounded-lg text-sm ${darkMode ? 'bg-[#374151] text-white' : 'bg-[#E5E7EB] text-[#0A1F44]'}`}
                            title="Back to Assumptions"
                        >
                            <Sliders className="w-4 h-4 inline-block mr-1" />
                            Assumptions
                        </button>
                        <h1 className={`text-[28px] font-semibold ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
                            Run Models
                        </h1>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setIsDocModalOpen(true)}
                            className={`px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-[#374151] text-white' : 'bg-[#E5E7EB] text-[#0A1F44]'}`}
                        >
                            <Info className="w-4 h-4 inline-block mr-1" />
                            Learn More
                        </button>
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className={`p-2 rounded-lg ${darkMode ? 'bg-[#374151] text-white' : 'bg-[#E5E7EB] text-[#0A1F44]'}`}
                        >
                            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="p-4 sm:p-6 max-w-7xl mx-auto">
                {/* Progress Loader */}
                {isCalculating && (
                    <div className="mb-6">
                        <div className="text-center mb-2">
                            <p className={`text-[16px] ${darkMode ? 'text-[#D1D5DB]' : 'text-[#334155]'}`}>
                                Running Models ({calculationProgress}%)
                            </p>
                        </div>
                        <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-[#374151]' : 'bg-[#E5E7EB]'}`}>
                            <div
                                className="bg-[#CDA349] h-2 rounded-full transition-all duration-300"
                                style={{ width: `${calculationProgress}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <p className="text-red-500 text-[14px] mb-4 text-center">{error}</p>
                )}

                {/* Snapshot Panel */}
                <div className={`p-4 rounded-[12px] border ${darkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E5E7EB]'} shadow-[0_1px_4px_rgba(0,0,0,0.08)] mb-6`}>
                    <h2 className={`text-[20px] font-semibold mb-4 ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
                        Portfolio Snapshot
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="text-center">
                            <p className={`text-[24px] font-bold ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
                                ${(results?.btc_portfolio_value / 1000000).toFixed(1)}M
                            </p>
                            <p className={`text-[14px] ${darkMode ? 'text-[#9CA3AF]' : 'text-[#334155]'}`}>
                                Projected BTC Holdings Value
                            </p>
                        </div>
                        <div className="text-center">
                            <p className={`text-[16px] font-medium ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
                                ${(cashReserves / 1000000).toFixed(1)}M
                            </p>
                            <p className={`text-[14px] ${darkMode ? 'text-[#9CA3AF]' : 'text-[#334155]'}`}>
                                Cash Reserves
                            </p>
                        </div>
                        <div className="text-center">
                            <p className={`text-[16px] font-medium ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
                                ${(totalDebt / 1000000).toFixed(1)}M
                            </p>
                            <p className={`text-[14px] ${darkMode ? 'text-[#9CA3AF]' : 'text-[#334155]'}`}>
                                Total Debt
                            </p>
                        </div>
                        <div className="text-center">
                            <p className={`text-[16px] font-medium ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
                                ${(equityValue / 1000000).toFixed(1)}M
                            </p>
                            <p className={`text-[14px] ${darkMode ? 'text-[#9CA3AF]' : 'text-[#334155]'}`}>
                                Equity Value
                            </p>
                        </div>
                    </div>
                </div>

                {/* Pain Points Panel */}
                <div className={`p-4 rounded-[12px] border ${darkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E5E7EB]'} shadow-[0_1px_4px_rgba(0,0,0,0.08)] mb-6`}>
                    <h2 className={`text-[20px] font-semibold mb-4 ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
                        Key Risk Indicators
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <MetricCard
                            title="Runway"
                            value={runwayMonths}
                            description="Months of cash reserves"
                            tooltip="Calculated as Cash Reserves ÷ Monthly Burn Rate"
                            icon={DollarSign}
                            format="number"
                            darkMode={darkMode}
                            highlight={runwayMonths < runwayThreshold ? 'red' : null}
                        />
                        <MetricCard
                            title="LTV Breach Risk"
                            value={results?.ltv.exceed_prob}
                            description="Probability LTV exceeds cap"
                            tooltip="Likelihood that the Loan-to-Value ratio exceeds the LTV Cap"
                            icon={AlertTriangle}
                            format="percentage"
                            darkMode={darkMode}
                            highlight={results?.ltv.exceed_prob > ltvBreachThreshold ? 'red' : null}
                        />
                        <MetricCard
                            title="Dilution Risk"
                            value={results?.dilution.base_dilution}
                            description="Equity dilution impact"
                            tooltip="Dilution from new equity, adjusted by NAV paths"
                            icon={TrendingDown}
                            format="percentage"
                            darkMode={darkMode}
                            highlight={results?.dilution.base_dilution > dilutionThreshold ? 'red' : null}
                        />
                    </div>
                </div>

                {/* CTA Button */}
                <div className="mt-6">
                    <button
                        onClick={() => setCurrentPage('decision')} // Changed from 'dashboard' to 'decision'
                        className={`w-full px-6 py-3 bg-[#0A1F44] text-white rounded-[12px] text-[16px] font-medium hover:bg-[#1e3a8a] transition-colors flex items-center justify-center`}
                    >
                        View Decision Options
                    </button>
                </div>
            </div>

            {/* Documentation Modal */}
            <DocumentationModal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} darkMode={darkMode} />
        </div>
    );
};

export default RunModelsPage;