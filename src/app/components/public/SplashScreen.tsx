import { Hexagon } from 'lucide-react';
import { t } from '../../i18n';

type Language = 'en' | 'si' | 'ta';

interface SplashScreenProps {
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onGetStarted: () => void;
  onLogin: () => void;
}

export function SplashScreen({ selectedLanguage, onLanguageChange, onGetStarted, onLogin }: SplashScreenProps) {
  return (
    <div className="h-screen bg-stone-900 flex justify-center overflow-hidden">
      <div className="w-[min(92vw,22rem)] h-full bg-stone-50 shadow-2xl relative flex flex-col">
        <div className="w-full px-[5%] pt-[1rem] pb-1 flex justify-end shrink-0">
          {(['en', 'si', 'ta'] as const).map((l) => (
            <button key={l} onClick={() => onLanguageChange(l)}
              className={`px-2.5 py-1.5 rounded-lg transition-all min-w-[38px] text-[0.76rem] font-semibold ${selectedLanguage === l ? 'bg-amber-500 text-white shadow-sm' : 'bg-white/70 text-stone-700 hover:bg-white'}`}>
              {l === 'en' ? 'EN' : l === 'si' ? 'සිං' : 'த'}
            </button>
          ))}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-[6%] pb-[2rem] overflow-y-auto">
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-6">
              <div className="flex items-center justify-center">
                <Hexagon className="w-24 h-24 text-amber-500 fill-amber-500/20 stroke-[2]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Hexagon className="w-12 h-12 text-emerald-600 fill-emerald-600/30 stroke-[2]" />
                </div>
              </div>
            </div>
            <h1 className="text-[2rem] font-bold text-stone-800 mb-2 tracking-tight italic leading-tight">ApiCore</h1>
            <p className="text-stone-600 text-center mb-5 max-w-xs text-[0.9rem] leading-relaxed">{t('splashSubtitle', selectedLanguage)}</p>
            <div className="flex items-center gap-2 text-emerald-700">
              <span className="w-8 h-[2px] bg-emerald-700" />
              <p className="font-medium text-[0.9rem]">{t('splashTagline', selectedLanguage)}</p>
              <span className="w-8 h-[2px] bg-emerald-700" />
            </div>
          </div>
        </div>
        <div className="px-[6%] pb-[2rem] space-y-6 shrink-0">
          <div className="space-y-3">
            <button onClick={onGetStarted} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl shadow-sm hover:shadow transition-all font-semibold text-[0.95rem]">
              {t('getStarted', selectedLanguage)}
            </button>
            <button onClick={onLogin} className="w-full bg-white hover:bg-stone-50 text-stone-700 py-3 rounded-xl border border-stone-300 hover:border-stone-400 transition-all font-semibold text-[0.95rem]">
              {t('login', selectedLanguage)}
            </button>
          </div>
          <p className="text-stone-600 text-[0.78rem] text-center">{t('splashFooter', selectedLanguage)}</p>
        </div>
      </div>
    </div>
  );
}
