import { Sun, Moon, Play } from 'lucide-react';

const LandingPage = ({ darkMode, setDarkMode, setCurrentPage }) => {
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#111827]' : 'bg-[#F9FAFB]'} font-inter`}>
      <header className={`px-4 sm:px-8 py-4 border-b ${darkMode ? 'border-[#374151]' : 'border-[#E5E7EB]'}`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
            Block Three Capital
          </h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg ${darkMode ? 'bg-[#374151] text-white' : 'bg-[#E5E7EB] text-[#0A1F44]'}`}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 sm:px-8">
        <div className="text-center max-w-2xl">
          <h1 className={`text-3xl sm:text-4xl font-semibold ${darkMode ? 'text-white' : 'text-[#0A1F44]'}`}>
            Precision Treasury Structuring for Bitcoin Institutions
          </h1>
          <p className={`text-lg mt-4 ${darkMode ? 'text-[#9CA3AF]' : 'text-[#334155]'}`}>
            Optimize BTC treasuries with elite models for NAV audit, dilution mitigation, convertibles, LTV loans, and ROE optimization.
          </p>
          <button
            onClick={() => setCurrentPage('assumptions')}
            className="mt-6 bg-[#0A1F44] text-white px-6 py-3 rounded-lg text-base font-medium hover:bg-[#1e3a8a] transition-colors flex items-center mx-auto"
          >
            <Play className="w-4 h-4 mr-2" />
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;