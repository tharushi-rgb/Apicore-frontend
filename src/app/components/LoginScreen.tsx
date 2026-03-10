import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Eye, EyeOff, AlertCircle, Hexagon } from 'lucide-react';
import { authService } from '../services/auth';

type Language = 'en' | 'si' | 'ta';

interface Props {
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onBackToHome: () => void;
  onLoginSuccess: (type: 'beekeeper' | 'helper') => void;
  onForgotPassword: () => void;
}

interface FormData { emailOrUsername: string; password: string; }

export function LoginScreen({ selectedLanguage, onLanguageChange, onBackToHome, onLoginSuccess, onForgotPassword }: Props) {
  const [showPwd, setShowPwd] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const res = await authService.login(data.emailOrUsername, data.password);
      const role = res.user.role?.toLowerCase().includes('helper') ? 'helper' : 'beekeeper';
      onLoginSuccess(role);
    } catch (e: any) { setLoginError(e.message || 'Invalid credentials'); }
    setIsLoggingIn(false);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-stone-50">
      <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
        {(['en','si','ta'] as const).map(l=>(
          <button key={l} onClick={()=>onLanguageChange(l)}
            className={`px-3 py-2 rounded-lg transition-all min-w-[48px] min-h-[44px] ${selectedLanguage===l?'bg-amber-500 text-white shadow-md':'bg-white/70 text-stone-700 hover:bg-white'}`}>
            {l==='en'?'EN':l==='si'?'සිං':'த'}
          </button>
        ))}
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <div className="max-w-md w-full">
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <Hexagon className="w-16 h-16 text-amber-500 fill-amber-500/20 stroke-[2]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Hexagon className="w-8 h-8 text-emerald-600 fill-emerald-600/30 stroke-[2]" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-stone-800 text-center">Login to ApiCore</h1>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-stone-700 mb-2">Email <span className="text-red-500">*</span></label>
              <input type="text" {...register('emailOrUsername',{required:'Email is required'})} className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none" placeholder="Enter your email" disabled={isLoggingIn} />
              {errors.emailOrUsername && <p className="text-red-500 text-sm mt-1">{errors.emailOrUsername.message}</p>}
            </div>
            <div>
              <label className="block text-stone-700 mb-2">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type={showPwd?'text':'password'} {...register('password',{required:'Password is required'})} className="w-full px-4 py-3 pr-12 bg-white border-2 border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none" placeholder="Enter your password" disabled={isLoggingIn} />
                <button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500">{showPwd?<EyeOff className="w-5 h-5"/>:<Eye className="w-5 h-5"/>}</button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={onForgotPassword} className="text-amber-600 hover:text-amber-700 text-sm font-medium">Forgot Password?</button>
            </div>
            {loginError && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-700 text-sm">{loginError}</p>
              </div>
            )}
            <button type="submit" disabled={isLoggingIn}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl shadow-lg min-h-[56px] font-medium text-lg disabled:opacity-50">
              {isLoggingIn ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-stone-600 text-sm">Don't have an account? <button onClick={onBackToHome} className="text-amber-600 hover:text-amber-700 font-medium">Create Account</button></p>
          </div>
        </div>
      </div>
      <div className="px-6 pb-8 shrink-0">
        <button onClick={onBackToHome} className="w-full bg-white hover:bg-stone-50 text-stone-700 py-4 rounded-xl border-2 border-stone-300 min-h-[56px] font-medium text-lg flex items-center justify-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </button>
      </div>
    </div>
  );
}
