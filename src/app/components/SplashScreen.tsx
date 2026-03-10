import { Hexagon } from 'lucide-react';

type Language = 'en' | 'si' | 'ta';

interface SplashScreenProps {
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onGetStarted: () => void;
  onLogin: () => void;
}

export function SplashScreen({ selectedLanguage, onLanguageChange, onGetStarted, onLogin }: SplashScreenProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-stone-50">
      <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
        {(['en', 'si', 'ta'] as const).map((l) => (
          <button key={l} onClick={() => onLanguageChange(l)}
            className={`px-3 py-2 rounded-lg transition-all min-w-[48px] min-h-[44px] ${selectedLanguage === l ? 'bg-amber-500 text-white shadow-md' : 'bg-white/70 text-stone-700 hover:bg-white'}`}>
            {l === 'en' ? 'EN' : l === 'si' ? 'සිං' : 'த'}
          </button>
        ))}
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-6">
            <div className="flex items-center justify-center">
              <Hexagon className="w-24 h-24 text-amber-500 fill-amber-500/20 stroke-[2]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Hexagon className="w-12 h-12 text-emerald-600 fill-emerald-600/30 stroke-[2]" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-stone-800 mb-3 tracking-tight">ApiCore</h1>
          <p className="text-stone-600 text-center mb-6 max-w-xs">Smart Beekeeping Management System</p>
          <div className="flex items-center gap-2 text-emerald-700">
            <span className="w-8 h-[2px] bg-emerald-700" />
            <p className="font-medium">Plan. Monitor. Protect. Grow.</p>
            <span className="w-8 h-[2px] bg-emerald-700" />
          </div>
        </div>
      </div>
      <div className="px-6 pb-8 space-y-6">
        <div className="space-y-3">
          <button onClick={onGetStarted} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl shadow-lg hover:shadow-xl transition-all min-h-[56px] font-medium text-lg">
            Get Started
          </button>
          <button onClick={onLogin} className="w-full bg-white hover:bg-stone-50 text-stone-700 py-4 rounded-xl border-2 border-stone-300 hover:border-stone-400 transition-all min-h-[56px] font-medium text-lg">
            Login
          </button>
        </div>
        <p className="text-stone-600 text-sm text-center">Designed for Sri Lankan Beekeepers</p>
      </div>
    </div>
  );
}
