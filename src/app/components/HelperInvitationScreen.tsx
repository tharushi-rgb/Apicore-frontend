import { useState } from 'react';
import { ArrowLeft, KeyRound, AlertCircle } from 'lucide-react';
import { helpersService } from '../services/helpers';

type Language = 'en' | 'si' | 'ta';

interface Props {
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onBackToHome: () => void;
  onValidToken: (token: string, email: string, invitedBy: string) => void;
}

export function HelperInvitationScreen({ selectedLanguage, onLanguageChange, onBackToHome, onValidToken }: Props) {
  const [token, setToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!token.trim()) { setError('Please enter your invitation token'); return; }
    setIsVerifying(true);
    setError('');
    try {
      const res = await helpersService.verifyToken(token.trim());
      const inv = (res as any).data?.invitation || (res as any).invitation;
      onValidToken(token.trim(), inv?.email || '', inv?.invited_by_name || '');
    } catch (e: any) { setError(e.message || 'Invalid or expired token'); }
    setIsVerifying(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 flex flex-col">
      <div className="w-full px-[5%] pt-[1rem] flex justify-end shrink-0">
        {(['en','si','ta'] as const).map(l=>(
          <button key={l} onClick={()=>onLanguageChange(l)}
            className={`px-3 py-2 rounded-lg transition-all min-w-[48px] min-h-[44px] ${selectedLanguage===l?'bg-amber-500 text-white shadow-md':'bg-white/70 text-stone-700 hover:bg-white'}`}>
            {l==='en'?'EN':l==='si'?'සිං':'த'}
          </button>
        ))}
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-[6%] pb-[2rem]">
        <div className="max-w-md w-full">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-emerald-100 p-4 rounded-2xl mb-4"><KeyRound className="w-12 h-12 text-emerald-600" /></div>
            <h1 className="text-3xl font-bold text-stone-800 text-center mb-2">Helper Invitation</h1>
            <p className="text-stone-600 text-center">Enter the invitation token provided by your Beekeeper admin.</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-stone-700 mb-2">Invitation Token <span className="text-red-500">*</span></label>
              <input value={token} onChange={e=>setToken(e.target.value.toUpperCase())} maxLength={8}
                className="w-full px-4 py-4 bg-white border-2 border-stone-200 rounded-xl focus:border-emerald-500 focus:outline-none text-center text-2xl tracking-[0.3em] font-mono" placeholder="XXXXXXXX" />
            </div>
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            <button onClick={handleVerify} disabled={isVerifying || !token.trim()}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl shadow-lg min-h-[56px] font-medium text-lg disabled:opacity-50">
              {isVerifying ? 'Verifying...' : 'Verify Token'}
            </button>
          </div>
        </div>
      </div>
      <div className="px-[6%] pb-[2rem]">
        <button onClick={onBackToHome} className="w-full bg-white hover:bg-stone-50 text-stone-700 py-4 rounded-xl border-2 border-stone-300 min-h-[56px] font-medium text-lg flex items-center justify-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </button>
      </div>
    </div>
  );
}
