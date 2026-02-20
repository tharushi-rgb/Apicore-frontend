import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/auth';

type Language = 'en' | 'si' | 'ta';

interface Props {
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onBack: () => void;
  onSuccess: () => void;
}

interface FormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  district: string;
}

const districts = [
  'Ampara','Anuradhapura','Badulla','Batticaloa','Colombo','Galle','Gampaha','Hambantota','Jaffna','Kalutara',
  'Kandy','Kegalle','Kilinochchi','Kurunegala','Mannar','Matale','Matara','Monaragala','Mullaitivu',
  'Nuwara Eliya','Polonnaruwa','Puttalam','Ratnapura','Trincomalee','Vavuniya',
];

export function BeekeeperRegistration({ selectedLanguage, onLanguageChange, onBack, onSuccess }: Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, watch, formState: { errors }, trigger } = useForm<FormData>({ mode: 'onBlur' });
  const password = watch('password');

  const getPwdStrength = (p: string) => {
    if (!p) return { s: 0, l: '', c: '' };
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^a-zA-Z0-9]/.test(p)) s++;
    if (s <= 2) return { s, l: 'Weak', c: 'bg-red-500' };
    if (s <= 3) return { s, l: 'Medium', c: 'bg-amber-500' };
    return { s, l: 'Strong', c: 'bg-emerald-500' };
  };
  const pwdStr = getPwdStrength(password);

  const handleNext = async () => {
    const valid = await trigger(['fullName', 'email', 'phoneNumber', 'password', 'confirmPassword']);
    if (valid) setCurrentStep(2);
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError('');
    try {
      await authService.register({
        name: data.fullName, email: data.email, password: data.password,
        phone: data.phoneNumber, district: data.district, role: 'beekeeper',
      });
      // Clear the token so they go to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      onSuccess();
    } catch (e: any) { setError(e.message === 'Failed to fetch' ? 'Cannot connect to server. Please make sure the backend is running.' : (e.message || 'Registration failed')); }
    setIsSubmitting(false);
  };

  const LangSelector = () => (
    <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
      {(['en','si','ta'] as const).map(l=>(
        <button key={l} onClick={()=>onLanguageChange(l)}
          className={`px-3 py-2 rounded-lg transition-all min-w-[48px] min-h-[44px] ${selectedLanguage===l?'bg-amber-500 text-white shadow-md':'bg-white/70 text-stone-700 hover:bg-white'}`}>
          {l==='en'?'EN':l==='si'?'සිං':'த'}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 flex flex-col">
      <LangSelector />
      <div className="px-6 pt-20 pb-4">
        <h1 className="text-3xl font-bold text-stone-800 text-center mb-4">Beekeeper Registration</h1>
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-stone-600">Step {currentStep} of 2</span>
            <span className="text-sm text-stone-600">{currentStep === 1 ? 'Personal Details' : 'Location & Profile'}</span>
          </div>
          <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${(currentStep/2)*100}%` }} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto space-y-4">
          {currentStep === 1 && (
            <>
              <div>
                <label className="block text-stone-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                <input {...register('fullName',{required:'Full name is required'})} className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none" placeholder="Enter your full name" />
                {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>}
              </div>
              <div>
                <label className="block text-stone-700 mb-2">Email <span className="text-red-500">*</span></label>
                <input type="email" {...register('email',{required:'Email is required',pattern:{value:/^[^\s@]+@[^\s@]+\.[^\s@]+$/,message:'Invalid email'}})} className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none" placeholder="your@email.com" />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-stone-700 mb-2">Phone Number</label>
                <input {...register('phoneNumber')} className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none" placeholder="+94 77 456 7890" />
              </div>
              <div>
                <label className="block text-stone-700 mb-2">Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type={showPwd?'text':'password'} {...register('password',{required:'Password is required',minLength:{value:6,message:'Min 6 characters'}})} className="w-full px-4 py-3 pr-12 bg-white border-2 border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none" placeholder="Create a password" />
                  <button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500">
                    {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden"><div className={`h-full ${pwdStr.c} transition-all`} style={{width:`${(pwdStr.s/5)*100}%`}}/></div>
                    <span className="text-xs text-stone-600">{pwdStr.l}</span>
                  </div>
                )}
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-stone-700 mb-2">Confirm Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type={showConfirm?'text':'password'} {...register('confirmPassword',{required:'Confirm password',validate:v=>v===password||'Passwords do not match'})} className="w-full px-4 py-3 pr-12 bg-white border-2 border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none" placeholder="Confirm your password" />
                  <button type="button" onClick={()=>setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500">
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
              </div>
            </>
          )}
          {currentStep === 2 && (
            <>
              <div>
                <label className="block text-stone-700 mb-2">District <span className="text-red-500">*</span></label>
                <select {...register('district',{required:'District is required'})} className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none">
                  <option value="">Select district</option>
                  {districts.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
                {errors.district && <p className="text-red-500 text-sm mt-1">{errors.district.message}</p>}
              </div>
              {error && <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4"><p className="text-red-700 text-sm">{error}</p></div>}
            </>
          )}
        </form>
      </div>

      <div className="px-6 pb-8 space-y-3">
        {currentStep === 1 ? (
          <button onClick={handleNext} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl shadow-lg min-h-[56px] font-medium text-lg flex items-center justify-center gap-2">
            Next <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl shadow-lg min-h-[56px] font-medium text-lg flex items-center justify-center gap-2 disabled:opacity-50">
            {isSubmitting ? 'Registering...' : <><Check className="w-5 h-5" /> Register</>}
          </button>
        )}
        <button onClick={currentStep===1?onBack:()=>setCurrentStep(1)} className="w-full bg-white hover:bg-stone-50 text-stone-700 py-4 rounded-xl border-2 border-stone-300 min-h-[56px] font-medium text-lg flex items-center justify-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
      </div>
    </div>
  );
}
