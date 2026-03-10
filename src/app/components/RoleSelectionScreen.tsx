import { useState } from 'react';
import { Hexagon, Crown, ClipboardCheck, ArrowLeft } from 'lucide-react';

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
    <div className="min-h-screen bg-stone-900 flex justify-center overflow-hidden">
      <div className="w-[min(92vw,22rem)] h-full bg-stone-50 shadow-2xl relative flex flex-col">
        <div className="w-full px-[5%] pt-[1rem] flex justify-end shrink-0">
          {(['en', 'si', 'ta'] as const).map((l) => (
            <button key={l} onClick={() => onLanguageChange(l)}
              className={`px-3 py-2 rounded-lg transition-all min-w-[48px] min-h-[44px] ${selectedLanguage === l ? 'bg-amber-500 text-white shadow-md' : 'bg-white/70 text-stone-700 hover:bg-white'}`}>
              {l === 'en' ? 'EN' : l === 'si' ? 'සිං' : 'த'}
            </button>
          ))}
        </div>
        <div className="flex-1 flex flex-col px-[6%] pt-[0.75rem] pb-[2rem] overflow-y-auto">
          <h1 className="text-3xl font-bold text-stone-800 text-center mb-8 italic">Choose your role</h1>
          <div className="flex-1 flex flex-col items-center justify-center space-y-4 max-w-md mx-auto w-full">
            <button onClick={() => setSelectedRole('beekeeper')}
              className={`w-full bg-white rounded-2xl p-6 transition-all min-h-[160px] flex flex-col items-center justify-center ${selectedRole === 'beekeeper' ? 'border-4 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'border-2 border-stone-200 hover:border-amber-300 hover:shadow-lg'}`}>
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <Hexagon className="w-16 h-16 text-amber-500 fill-amber-500/20 stroke-[2]" />
                  <Crown className="w-8 h-8 text-amber-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-stone-800 mb-2">Beekeeper</h2>
              <p className="text-stone-600 text-center text-sm">Manage apiaries, hives, finances, helpers, and client services.</p>
            </button>
            <button onClick={() => setSelectedRole('landowner')}
              className={`w-full bg-white rounded-2xl p-6 transition-all min-h-[160px] flex flex-col items-center justify-center ${selectedRole === 'landowner' ? 'border-4 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'border-2 border-stone-200 hover:border-emerald-300 hover:shadow-lg'}`}>
              <div className="flex items-center justify-center mb-4">
                <ClipboardCheck className="w-16 h-16 text-emerald-600 stroke-[1.5]" />
              </div>
              <h2 className="text-xl font-bold text-stone-800 mb-2">Landowner</h2>
              <p className="text-stone-600 text-center text-sm">Offer your land for beekeeping activities and earn shared benefits.</p>
            </button>
          </div>
        </div>
        <div className="px-[6%] pb-[2rem] space-y-3 shrink-0">
          <button onClick={() => selectedRole && onContinue(selectedRole)} disabled={!selectedRole}
            className={`w-full py-4 rounded-xl shadow-lg transition-all min-h-[56px] font-medium text-lg ${selectedRole ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}>
            Continue
          </button>
          <button onClick={onBack} className="w-full bg-white hover:bg-stone-50 text-stone-700 py-4 rounded-xl border-2 border-stone-300 transition-all min-h-[56px] font-medium text-lg flex items-center justify-center gap-2">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
        </div>
      </div>
    </div>
  );
}
