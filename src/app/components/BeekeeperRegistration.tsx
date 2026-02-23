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
  nicNumber: string;
  password: string;
  confirmPassword: string;
  district: string;
  preferredLanguage: string;
  ageGroup: string;
  knownBeeAllergy: string;
  bloodGroup: string;
  beekeepingNature: string;
  businessRegNo: string;
  primaryBeeSpecies: string;
  nvqLevel: string;
}

const districts = [
  'Ampara','Anuradhapura','Badulla','Batticaloa','Colombo','Galle','Gampaha','Hambantota','Jaffna','Kalutara',
  'Kandy','Kegalle','Kilinochchi','Kurunegala','Mannar','Matale','Matara','Monaragala','Mullaitivu',
  'Nuwara Eliya','Polonnaruwa','Puttalam','Ratnapura','Trincomalee','Vavuniya',
];

const TOTAL_STEPS = 3;

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

  const stepLabels = ['Personal Details', 'Beekeeping Profile', 'Location & Review'];

  const handleNext = async () => {
    if (currentStep === 1) {
      const valid = await trigger(['fullName', 'email', 'phoneNumber', 'password', 'confirmPassword']);
      if (valid) setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError('');
    try {
      await authService.register({
        name: data.fullName,
        email: data.email,
        password: data.password,
        phone: data.phoneNumber,
        nic_number: data.nicNumber || undefined,
        district: data.district,
        preferred_language: data.preferredLanguage || 'en',
        age_group: data.ageGroup || undefined,
        known_bee_allergy: data.knownBeeAllergy || 'no',
        blood_group: data.bloodGroup || undefined,
        beekeeping_nature: data.beekeepingNature || undefined,
        business_reg_no: data.businessRegNo || undefined,
        primary_bee_species: data.primaryBeeSpecies || undefined,
        nvq_level: data.nvqLevel || undefined,
        role: 'beekeeper',
      });
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

  const inputClass = "w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none";
  const selectClass = "w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none";
  const labelClass = "block text-stone-700 mb-1.5 text-sm font-medium";

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 flex flex-col">
      <LangSelector />
      <div className="px-6 pt-20 pb-4">
        <h1 className="text-3xl font-bold text-stone-800 text-center mb-4">Beekeeper Registration</h1>
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-stone-600">Step {currentStep} of {TOTAL_STEPS}</span>
            <span className="text-sm text-stone-600">{stepLabels[currentStep - 1]}</span>
          </div>
          <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto space-y-3">

          {currentStep === 1 && (
            <>
              <div>
                <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
                <input {...register('fullName',{required:'Full name is required'})} className={inputClass} placeholder="Enter your full name" />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
              </div>
              <div>
                <label className={labelClass}>NIC Number</label>
                <input {...register('nicNumber')} className={inputClass} placeholder="200012345678" maxLength={12} />
                <p className="text-stone-400 text-xs mt-0.5">12-digit NIC for accountability</p>
              </div>
              <div>
                <label className={labelClass}>Email <span className="text-red-500">*</span></label>
                <input type="email" {...register('email',{required:'Email is required',pattern:{value:/^[^\s@]+@[^\s@]+\.[^\s@]+$/,message:'Invalid email'}})} className={inputClass} placeholder="your@email.com" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className={labelClass}>Phone Number</label>
                <input {...register('phoneNumber')} className={inputClass} placeholder="+94 77 456 7890" />
              </div>
              <div>
                <label className={labelClass}>Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type={showPwd?'text':'password'} {...register('password',{required:'Password is required',minLength:{value:8,message:'Min 8 characters'}})} className={`${inputClass} pr-12`} placeholder="Create a password (8-16 chars)" />
                  <button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500">
                    {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {password && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden"><div className={`h-full ${pwdStr.c} transition-all`} style={{width:`${(pwdStr.s/5)*100}%`}}/></div>
                    <span className="text-xs text-stone-600">{pwdStr.l}</span>
                  </div>
                )}
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>
              <div>
                <label className={labelClass}>Confirm Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type={showConfirm?'text':'password'} {...register('confirmPassword',{required:'Confirm password',validate:v=>v===password||'Passwords do not match'})} className={`${inputClass} pr-12`} placeholder="Confirm your password" />
                  <button type="button" onClick={()=>setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500">
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div>
                <label className={labelClass}>Preferred Language <span className="text-red-500">*</span></label>
                <select {...register('preferredLanguage')} defaultValue="en" className={selectClass}>
                  <option value="en">English</option>
                  <option value="si">Sinhala (සිංහල)</option>
                  <option value="ta">Tamil (தமிழ்)</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Age Group <span className="text-red-500">*</span></label>
                <select {...register('ageGroup')} className={selectClass}>
                  <option value="">Select age group</option>
                  <option value="18-30">18 – 30</option>
                  <option value="31-50">31 – 50</option>
                  <option value="51-65">51 – 65</option>
                  <option value="65+">65+</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Known Bee Allergy <span className="text-red-500">*</span></label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-stone-200 rounded-xl cursor-pointer flex-1 justify-center">
                    <input type="radio" {...register('knownBeeAllergy')} value="yes" className="accent-amber-500" />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-stone-200 rounded-xl cursor-pointer flex-1 justify-center">
                    <input type="radio" {...register('knownBeeAllergy')} value="no" className="accent-amber-500" defaultChecked />
                    <span>No</span>
                  </label>
                </div>
              </div>
              <div>
                <label className={labelClass}>Blood Group</label>
                <select {...register('bloodGroup')} className={selectClass}>
                  <option value="">Select blood group (optional)</option>
                  <option value="A+">A+</option><option value="A-">A-</option>
                  <option value="B+">B+</option><option value="B-">B-</option>
                  <option value="AB+">AB+</option><option value="AB-">AB-</option>
                  <option value="O+">O+</option><option value="O-">O-</option>
                </select>
                <p className="text-stone-400 text-xs mt-0.5">For emergency medical response in remote areas</p>
              </div>
              <div>
                <label className={labelClass}>Beekeeping Nature <span className="text-red-500">*</span></label>
                <select {...register('beekeepingNature')} className={selectClass}>
                  <option value="">Select nature</option>
                  <option value="hobbyist">Hobbyist</option>
                  <option value="commercial">Commercial</option>
                  <option value="research">Research</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Primary Bee Species <span className="text-red-500">*</span></label>
                <select {...register('primaryBeeSpecies')} className={selectClass}>
                  <option value="">Select species</option>
                  <option value="apis_cerana">Apis cerana (Mee Bee)</option>
                  <option value="tetragonula">Tetragonula (Kaneyawa)</option>
                  <option value="apis_mellifera">Apis mellifera</option>
                  <option value="apis_dorsata">Apis dorsata</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Business Reg. No</label>
                <input {...register('businessRegNo')} className={inputClass} placeholder="Optional for professionals" />
              </div>
              <div>
                <label className={labelClass}>NVQ Level / Training</label>
                <select {...register('nvqLevel')} className={selectClass}>
                  <option value="">Select training level (optional)</option>
                  <option value="none">None</option>
                  <option value="dept_agriculture">Dept. of Agriculture Trained</option>
                  <option value="nvq3">NVQ Level 3</option>
                  <option value="nvq4">NVQ Level 4</option>
                </select>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <div>
                <label className={labelClass}>District <span className="text-red-500">*</span></label>
                <select {...register('district',{required:'District is required'})} className={selectClass}>
                  <option value="">Select district</option>
                  {districts.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
                {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district.message}</p>}
              </div>

              <div className="bg-white/80 rounded-xl p-4 border border-stone-200 space-y-2 mt-2">
                <h3 className="font-semibold text-stone-700 text-sm">Registration Summary</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <span className="text-stone-500">Name:</span><span className="text-stone-800 font-medium">{watch('fullName') || '—'}</span>
                  <span className="text-stone-500">Email:</span><span className="text-stone-800 font-medium truncate">{watch('email') || '—'}</span>
                  <span className="text-stone-500">Phone:</span><span className="text-stone-800 font-medium">{watch('phoneNumber') || '—'}</span>
                  <span className="text-stone-500">Bee Allergy:</span><span className="text-stone-800 font-medium">{watch('knownBeeAllergy') === 'yes' ? '⚠️ Yes' : 'No'}</span>
                  <span className="text-stone-500">Nature:</span><span className="text-stone-800 font-medium capitalize">{watch('beekeepingNature') || '—'}</span>
                  <span className="text-stone-500">Species:</span><span className="text-stone-800 font-medium">{watch('primaryBeeSpecies')?.replace('_',' ') || '—'}</span>
                </div>
              </div>

              {error && <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4"><p className="text-red-700 text-sm">{error}</p></div>}
            </>
          )}
        </form>
      </div>

      <div className="px-6 pb-8 space-y-3">
        {currentStep < TOTAL_STEPS ? (
          <button onClick={handleNext} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl shadow-lg min-h-[56px] font-medium text-lg flex items-center justify-center gap-2">
            Next <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl shadow-lg min-h-[56px] font-medium text-lg flex items-center justify-center gap-2 disabled:opacity-50">
            {isSubmitting ? 'Registering...' : <><Check className="w-5 h-5" /> Register</>}
          </button>
        )}
        <button onClick={currentStep===1?onBack:()=>setCurrentStep(currentStep - 1)} className="w-full bg-white hover:bg-stone-50 text-stone-700 py-4 rounded-xl border-2 border-stone-300 min-h-[56px] font-medium text-lg flex items-center justify-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
      </div>
    </div>
  );
}
