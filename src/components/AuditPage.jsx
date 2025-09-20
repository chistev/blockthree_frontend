import { useState } from 'react';
import {
  Home,
  Sliders,
  Sun,
  Moon,
  Info,
  Clock,
  User,
  FileCode,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import DocumentationModal from './DocumentationModal';

const AuditPage = ({
  darkMode,
  setDarkMode,
  setCurrentPage,
  assumptions,
  setAssumptions,
  savedConfigs,
  setIsDocModalOpen,
  isDocModalOpen,
}) => {
  // State for expanded snapshot
  const [expandedSnapshot, setExpandedSnapshot] = useState(null);

  // Sample snapshots data (replace with actual savedConfigs or API data)
  const snapshots = Object.entries(savedConfigs).map(([name, config], index) => ({
    id: index,
    name,
    timestamp: config.timestamp,
    user: 'User ' + (index + 1), // Placeholder; replace with actual user data
    mode: config.assumptions.mode || 'Manual', // Default to Manual if undefined
    hash: config.hash || `ABC${123 + index}`, // Placeholder hash
    assumptions: config.assumptions,
  }));

  // Function to reproduce a snapshot
  const handleReproduceRun = (snapshotAssumptions) => {
    setAssumptions(snapshotAssumptions);
    setCurrentPage('assumptions');
  };

  // Function to compute assumption differences
  const getAssumptionDiffs = (current, previous) => {
    const diffs = [];
    const allKeys = new Set([...Object.keys(current || {}), ...Object.keys(previous || {})]);

    allKeys.forEach((key) => {
      const currentValue = current ? current[key] : null;
      const previousValue = previous ? previous[key] : null;

      if (currentValue !== previousValue) {
        diffs.push({
          key,
          current: currentValue,
          previous: previousValue,
          status: !currentValue ? 'removed' : !previousValue ? 'added' : 'changed',
        });
      }
    });

    return diffs;
  };

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
            <h1
              className={`text-[28px] font-semibold tracking-tight font-inter-tight ${
                darkMode ? 'text-slate-100' : 'text-slate-900'
              }`}
            >
              Audit Trail
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 bg-emerald-500 rounded-full"></span>
              <span className={`text-[12px] font-inter ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                Snapshot: #ABC123
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
      <div className="max-w-7xl mx-auto mt-6">
        <div
          className={`p-4 rounded-2xl border shadow-md transform hover:scale-101 transition-transform bg-gradient-to-b ${
            darkMode ? 'bg-slate-800 border-slate-700 from-slate-800 to-slate-900' : 'bg-white border-slate-200 from-white to-slate-100'
          }`}
        >
          <h2
            className={`text-[22px] font-semibold tracking-tight font-inter-tight mb-4 ${
              darkMode ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            Snapshot Timeline
          </h2>

          {/* Vertical Timeline */}
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-1 bg-emerald-500"></div>
            {snapshots.map((snapshot, index) => {
              const isExpanded = expandedSnapshot === snapshot.id;
              const previousAssumptions = index < snapshots.length - 1 ? snapshots[index + 1].assumptions : null;
              const diffs = getAssumptionDiffs(snapshot.assumptions, previousAssumptions);

              return (
                <div key={snapshot.id} className="relative mb-8 ml-12">
                  {/* Timeline Dot */}
                  <div className="absolute -left-8 top-2 w-4 h-4 bg-emerald-500 rounded-full"></div>

                  {/* Snapshot Card */}
                  <div
                    className={`p-4 rounded-2xl border shadow-md ${
                      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <span
                          className={`text-[12px] font-inter rounded-full px-2 py-1 bg-gray-400 text-slate-900`}
                        >
                          {snapshot.mode}
                        </span>
                        <span
                          className={`text-[14px] font-inter ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}
                        >
                          {new Date(snapshot.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <button
                        onClick={() => setExpandedSnapshot(isExpanded ? null : snapshot.id)}
                        className={`text-[14px] font-inter ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}
                      >
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </button>
                    </div>

                    {/* Snapshot Metadata */}
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <User className={`w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
                        <span
                          className={`text-[14px] font-inter ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}
                        >
                          {snapshot.user}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FileCode className={`w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
                        <span
                          className={`text-[14px] font-inter ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}
                        >
                          Hash: {snapshot.hash}
                        </span>
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <span
                          className={`text-[14px] font-inter ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}
                        >
                          BTC Treasury
                        </span>
                        <p
                          className={`text-[26px] font-bold font-roboto-mono ${
                            darkMode ? 'text-slate-100' : 'text-slate-900'
                          }`}
                        >
                          {snapshot.assumptions.BTC_treasury?.toFixed(2) || 'N/A'} BTC
                        </p>
                      </div>
                      <div>
                        <span
                          className={`text-[14px] font-inter ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}
                        >
                          Initial Equity
                        </span>
                        <p
                          className={`text-[26px] font-bold font-roboto-mono ${
                            darkMode ? 'text-slate-100' : 'text-slate-900'
                          }`}
                        >
                          ${snapshot.assumptions.initial_equity_value?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span
                          className={`text-[14px] font-inter ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}
                        >
                          LTV Cap
                        </span>
                        <p
                          className={`text-[26px] font-bold font-roboto-mono ${
                            darkMode ? 'text-slate-100' : 'text-slate-900'
                          }`}
                        >
                          {(snapshot.assumptions.LTV_Cap * 100)?.toFixed(1) || 'N/A'}%
                        </p>
                      </div>
                      <div>
                        <span
                          className={`text-[14px] font-inter ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}
                        >
                          Runway
                        </span>
                        <p
                          className={`text-[26px] font-bold font-roboto-mono ${
                            darkMode ? 'text-slate-100' : 'text-slate-900'
                          }`}
                        >
                          {snapshot.assumptions.annual_burn_rate
                            ? (
                                snapshot.assumptions.initial_equity_value /
                                snapshot.assumptions.annual_burn_rate
                              ).toFixed(2)
                            : 'N/A'}{' '}
                          months
                        </p>
                      </div>
                    </div>

                    {/* Expanded Diffs */}
                    {isExpanded && (
                      <div className="mt-4">
                        <h3
                          className={`text-[18px] font-semibold font-inter-tight mb-2 ${
                            darkMode ? 'text-slate-100' : 'text-slate-900'
                          }`}
                        >
                          Assumption Changes
                        </h3>
                        {diffs.length > 0 ? (
                          <ul className="space-y-2">
                            {diffs.map((diff, idx) => (
                              <li
                                key={idx}
                                className={`text-[14px] font-roboto-mono p-2 rounded-lg ${
                                  diff.status === 'added' || diff.status === 'changed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-red-100 text-red-500'
                                }`}
                              >
                                <strong>{diff.key}:</strong>{' '}
                                {diff.status === 'added' ? (
                                  <span>Added: {diff.current}</span>
                                ) : diff.status === 'removed' ? (
                                  <span>Removed: {diff.previous}</span>
                                ) : (
                                  <span>
                                    Changed from {diff.previous} to {diff.current}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p
                            className={`text-[14px] font-inter ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}
                          >
                            No changes from previous snapshot.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Reproduce Run Button */}
                    <button
                      onClick={() => handleReproduceRun(snapshot.assumptions)}
                      className={`mt-4 w-full px-6 py-3 bg-emerald-500 text-white rounded-lg text-[16px] font-inter font-medium hover:bg-emerald-600 active:bg-emerald-700 transform hover:scale-101 transition-transform`}
                    >
                      Reproduce Run
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <DocumentationModal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} darkMode={darkMode} />
    </div>
  );
};

export default AuditPage;