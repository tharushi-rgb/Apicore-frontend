import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Eye, EyeOff, Check } from 'lucide-react';
import { helpersService } from '../services/helpers';

type Language = 'en' | 'si' | 'ta';

interface Props {
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onBack: () => void;
  onSuccess: () => void;
  token: string;
  email: string;
  invitedBy: string;
}

interface FormData { name: string; password: string; confirmPassword: string; phone: string; district: string; }

const districts = [
  'Ampara','Anuradhapura','Badulla','Batticaloa','Colombo','Galle','Gampaha','Hambantota','Jaffna','Kalutara',
  'Kandy','Kegalle','Kilinochchi','Kurunegala','Mannar','Matale','Matara','Monaragala','Mullaitivu',
  'Nuwara Eliya','Polonnaruwa','Puttalam','Ratnapura','Trincomalee','Vavuniya',
];

export function HelperRegistrationScreen({ selectedLanguage, onLanguageChange, onBack, onSuccess, token, email, invitedBy }: Props) {
  const [showPwd, setShowPwd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({ mode: 'onBlur' });
  const password = watch('password');

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError('');
    try {
      await helpersService.registerHelper({ token, name: data.name, password: data.password, phone: data.phone, district: data.district });
      onSuccess();
    } catch (e: any) { setError(e.message || 'Registration failed'); }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 flex flex-col">
      <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
        {(['en','si','ta'] as const).map(l=>(
          <button key={l} onClick={()=>onLanguageChange(l)}
            className={`px-3 py-2 rounded-lg transition-all min-w-[48px] min-h-[44px] ${selectedLanguage===l?'bg-amber-500 text-white shadow-md':'bg-white/70 text-stone-700 hover:bg-white'}`}>
            {l==='en'?'EN':l==='si'?'සිං':'த'}
          </button>
        ))}
      </div>
      <div className="px-6 pt-20 pb-4">
        <h1 className="text-3xl font-bold text-stone-800 text-center mb-2">Complete Registration</h1>
        <p className="text-stone-600 text-center text-sm">Invited by: <span className="font-medium">{invitedBy}</span></p>
        <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
          <p className="text-emerald-800 text-sm">Email: <span className="font-medium">{email}</span></p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto space-y-4">
          <div>
            <label className="block text-stone-700 mb-2">Full Name <span className="text-red-500">*</span></label>
            <input {...register('name',{required:'Name is required'})} className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-emerald-500 focus:outline-none" placeholder="Your full name" />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-stone-700 mb-2">Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <input type={showPwd?'text':'password'} {...register('password',{required:'Password is required',minLength:{value:6,message:'Min 6 characters'}})} className="w-full px-4 py-3 pr-12 bg-white border-2 border-stone-200 rounded-xl focus:border-emerald-500 focus:outline-none" placeholder="Create a password" />
              <button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500">{showPwd?<EyeOff className="w-5 h-5"/>:<Eye className="w-5 h-5"/>}</button>
            </div>
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-stone-700 mb-2">Confirm Password <span className="text-red-500">*</span></label>
            <input type="password" {...register('confirmPassword',{required:'Confirm password',validate:v=>v===password||'Passwords do not match'})} className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-emerald-500 focus:outline-none" placeholder="Confirm password" />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
          </div>
          <div>
            <label className="block text-stone-700 mb-2">Phone Number</label>
            <input {...register('phone')} className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-emerald-500 focus:outline-none" placeholder="+94 77 456 7890" />
          </div>
          <div>
            <label className="block text-stone-700 mb-2">District</label>
            <select {...register('district')} className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-emerald-500 focus:outline-none">
              <option value="">Select district</option>
              {districts.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          {error && <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4"><p className="text-red-700 text-sm">{error}</p></div>}
        </form>
      </div>
      <div className="px-6 pb-8 space-y-3">
        <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl shadow-lg min-h-[56px] font-medium text-lg flex items-center justify-center gap-2 disabled:opacity-50">
          {isSubmitting ? 'Registering...' : <><Check className="w-5 h-5" /> Complete Registration</>}
        </button>
        <button onClick={onBack} className="w-full bg-white hover:bg-stone-50 text-stone-700 py-4 rounded-xl border-2 border-stone-300 min-h-[56px] font-medium text-lg flex items-center justify-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
      </div>
    </div>
  );
}
