import { Sun, Moon, Play } from 'lucide-react';

const LandingPage = ({ darkMode, setDarkMode, setCurrentPage }) => {
  const navLinks = [''];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-slate-100'} font-inter`}>
      <header className={`px-4 sm:px-8 py-4 border-b ${darkMode ? 'border-slate-900' : 'border-slate-100'}`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo */}
          <h1
            className={`text-[28px] font-semibold tracking-tight font-inter-tight ${
              darkMode ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            Block Three Capital
          </h1>
          <div className="flex items-center space-x-4">
            {/* Global Navigation */}
            <nav className="hidden sm:flex space-x-4">
              {navLinks.map((link) => (
                <button
                  key={link}
                  onClick={() => setCurrentPage(link.toLowerCase())}
                  className={`text-[14px] ${
                    darkMode ? 'text-slate-100 hover:text-emerald-500' : 'text-slate-900 hover:text-emerald-500'
                  }`}
                >
                  {link}
                </button>
              ))}
            </nav>
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-slate-200 text-slate-900'}`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 sm:px-8">
        <div className="text-center max-w-2xl">
          <h1
            className={`text-[28px] font-semibold tracking-tight font-inter-tight ${
              darkMode ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            Precision Treasury Structuring for Bitcoin Institutions
          </h1>
          <p
            className={`text-[16px] mt-4 ${
              darkMode ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            Optimize BTC treasuries with elite models for NAV audit, dilution mitigation, convertibles, LTV loans, and ROE optimization.
          </p>
          <button
            onClick={() => setCurrentPage('assumptions')}
            className="mt-6 bg-emerald-500 text-white px-6 py-3 rounded-lg text-[14px] font-medium hover:bg-emerald-600 active:bg-emerald-700 transition-colors flex items-center mx-auto"
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