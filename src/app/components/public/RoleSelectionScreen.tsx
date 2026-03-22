import { useState } from 'react';
import { Hexagon, Crown, ClipboardCheck, ArrowLeft } from 'lucide-react';
import { t } from '../../i18n';

type Language = 'en' | 'si' | 'ta';

interface RoleSelectionScreenProps {
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onBack: () => void;
  onContinue: (role: 'beekeeper' | 'landowner') => void;
}

export function RoleSelectionScreen({ selectedLanguage, onLanguageChange, onBack, onContinue }: RoleSelectionScreenProps) {
  const [selectedRole, setSelectedRole] = useState<'beekeeper' | 'landowner' | null>(null);

  return (
    <div className="h-[100dvh] bg-stone-900 flex justify-center overflow-hidden">
      <div className="w-[min(92vw,22rem)] h-full bg-stone-50 shadow-2xl relative flex flex-col">
        <div className="w-full px-4 pt-3 pb-2 flex justify-end shrink-0 gap-1">
          {(['en', 'si', 'ta'] as const).map((l) => (
            <button key={l} onClick={() => onLanguageChange(l)}
              className={`px-2.5 py-1.5 rounded-lg transition-all min-w-[36px] text-xs ${selectedLanguage === l ? 'bg-amber-500 text-white shadow-md' : 'bg-white/70 text-stone-700 hover:bg-white'}`}>
              {l === 'en' ? 'EN' : l === 'si' ? 'සිං' : 'த'}
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-0 flex flex-col px-4 pt-3 pb-4 overflow-y-auto">
          <h1 className="text-[clamp(1.3rem,5vw,1.65rem)] font-bold text-stone-800 text-center mb-4 leading-tight">{t('chooseRole', selectedLanguage)}</h1>
          <div className="flex-1 flex flex-col items-center justify-center gap-3.5 max-w-md mx-auto w-full">
            <button onClick={() => setSelectedRole('beekeeper')}
              className={`w-full bg-white rounded-xl p-4 transition-all flex flex-col items-center justify-center ${selectedRole === 'beekeeper' ? 'border-2 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'border border-stone-200 hover:border-amber-300 hover:shadow-md'}`}>
              <div className="flex items-center justify-center mb-2.5">
                <div className="relative">
                  <Hexagon className="w-[clamp(2.6rem,11vw,3.4rem)] h-[clamp(2.6rem,11vw,3.4rem)] text-amber-500 fill-amber-500/20 stroke-[2]" />
                  <Crown className="w-[clamp(1.3rem,5vw,1.75rem)] h-[clamp(1.3rem,5vw,1.75rem)] text-amber-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
              </div>
              <h2 className="text-[clamp(1rem,4vw,1.1rem)] font-bold text-stone-800 mb-1">{t('beekeeper', selectedLanguage)}</h2>
              <p className="text-stone-600 text-center text-[clamp(0.78rem,2.7vw,0.86rem)] leading-relaxed">{t('beekeeperDescFull', selectedLanguage)}</p>
            </button>
            <button onClick={() => setSelectedRole('landowner')}
              className={`w-full bg-white rounded-xl p-4 transition-all flex flex-col items-center justify-center ${selectedRole === 'landowner' ? 'border-2 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'border border-stone-200 hover:border-emerald-300 hover:shadow-md'}`}>
              <div className="flex items-center justify-center mb-2.5">
                <ClipboardCheck className="w-[clamp(2.6rem,11vw,3.4rem)] h-[clamp(2.6rem,11vw,3.4rem)] text-emerald-600 stroke-[1.5]" />
              </div>
              <h2 className="text-[clamp(1rem,4vw,1.1rem)] font-bold text-stone-800 mb-1">{t('landowner', selectedLanguage)}</h2>
              <p className="text-stone-600 text-center text-[clamp(0.78rem,2.7vw,0.86rem)] leading-relaxed">{t('landownerDescFull', selectedLanguage)}</p>
            </button>
          </div>
        </div>
        <div className="px-4 pb-4 space-y-2.5 shrink-0">
          <button onClick={() => selectedRole && onContinue(selectedRole)} disabled={!selectedRole}
            className={`w-full py-3 rounded-lg shadow-sm transition-all font-semibold text-[0.92rem] ${selectedRole ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}>
            {t('continueBtn', selectedLanguage)}
          </button>
          <button onClick={onBack} className="w-full bg-white hover:bg-stone-50 text-stone-700 py-3 rounded-lg border border-stone-300 transition-all font-semibold text-[0.92rem] flex items-center justify-center gap-1.5">
            <ArrowLeft className="w-4 h-4" /> {t('back', selectedLanguage)}
          </button>
        </div>
      </div>
    </div>
  );
}
