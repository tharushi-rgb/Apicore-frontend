import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/auth';
import { t } from '../../i18n';
import { formatSriLankanPhoneNumber, isValidSriLankanPhoneNumber, PHONE_NUMBER_MAX_LENGTH } from '../../utils/phone';
import { PROVINCES, getDistrictsByProvince, getDsDivisionsByDistrict } from '../../constants/sriLankaLocations';

type Language = 'en' | 'si' | 'ta';

interface LandownerRegistrationProps {
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onBack: () => void;
  onSuccess: () => void;
}

interface FormData {
  fullName: string;
  phoneNumber: string;
  nicNumber: string;
  email: string;
  preferredLanguage: string;
  ageGroup: string;
  businessRegNo: string;
  province: string;
  district: string;
  dsDivision: string;
  password: string;
  confirmPassword: string;
}

const TOTAL_STEPS = 4;

export function LandownerRegistration({ selectedLanguage, onLanguageChange, onBack, onSuccess }: LandownerRegistrationProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, watch, setValue, formState: { errors }, trigger } = useForm<FormData>({ mode: 'onBlur' });

  const password = watch('password');
  const selectedProvince = watch('province');
  const selectedDistrict = watch('district');
  const districts = getDistrictsByProvince(selectedProvince);
  const dsDivisions = getDsDivisionsByDistrict(selectedDistrict);

  const stepLabels = [t('personalDetailsStep', selectedLanguage), t('profileStep', selectedLanguage), t('locationPasswordStep', selectedLanguage), t('summaryStep', selectedLanguage)];

  const handleNext = async () => {
    if (currentStep === 1) {
      const valid = await trigger(['fullName', 'phoneNumber', 'nicNumber', 'email']);
      if (valid) {
        setIsCheckingEmail(true);
        setError('');
        try {
          const exists = await authService.checkEmailExists(watch('email'));
          if (exists) {
            setError(t('emailAlreadyRegistered', selectedLanguage));
            setIsCheckingEmail(false);
            return;
          }
        } catch { /* ignore, let backend catch it */ }
        setIsCheckingEmail(false);
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      const valid = await trigger(['preferredLanguage', 'ageGroup']);
      if (valid) setCurrentStep(3);
    } else if (currentStep === 3) {
      const valid = await trigger(['province', 'district', 'dsDivision', 'password', 'confirmPassword']);
      if (valid) setCurrentStep(4);
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
        nic_number: data.nicNumber,
        province: data.province,
        district: data.district,
        ds_division: data.dsDivision,
        preferred_language: data.preferredLanguage || 'en',
        age_group: data.ageGroup,
        business_reg_no: data.businessRegNo || undefined,
        role: 'landowner',
        known_bee_allergy: 'no',
      });
      onSuccess();
    } catch (e: any) {
      setError(
        e.message === 'Failed to fetch'
          ? 'Cannot connect to server. Please make sure the backend is running.'
          : e.message || 'Registration failed'
      );
    }
    setIsSubmitting(false);
  };

  const ic = 'w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg focus:border-emerald-500 focus:outline-none text-[0.92rem]';
  const sc = 'w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg focus:border-emerald-500 focus:outline-none text-[0.92rem]';
  const lc = 'block text-stone-700 mb-1 text-[0.84rem] font-medium';
  const ec = 'text-red-500 text-[0.7rem] mt-0.5';

  return (
    <div className="h-screen bg-stone-900 flex justify-center overflow-hidden">
      <div className="w-[min(92vw,22rem)] h-full bg-stone-50 shadow-2xl flex flex-col">

        {/* Language Selector */}
        <div className="w-full px-4 pt-3 pb-2.5 flex justify-end shrink-0 gap-1">
          {(['en', 'si', 'ta'] as const).map(l => (
            <button key={l} onClick={() => onLanguageChange(l)}
              className={`px-2.5 py-1.5 rounded-lg text-xs transition-all min-w-[36px] ${selectedLanguage === l ? 'bg-amber-500 text-white shadow' : 'bg-white/70 text-stone-700 hover:bg-white'}`}>
              {l === 'en' ? 'EN' : l === 'si' ? 'සිං' : 'த'}
            </button>
          ))}
        </div>

        {/* Header + Progress */}
        <div className="px-4 pt-2.5 pb-2.5 shrink-0">
          <h1 className="text-lg font-bold text-stone-800 text-center mb-2 leading-tight">
            {t('landownerRegistration', selectedLanguage)}
          </h1>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-stone-500">{t('step', selectedLanguage)} {currentStep}/{TOTAL_STEPS}</span>
            <span className="text-xs text-stone-500">{stepLabels[currentStep - 1]}</span>
          </div>
          <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }} />
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto px-4 pb-3">
          <div className="min-h-full flex flex-col justify-start py-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

            {/* ── Step 1: Personal Details ── */}
            {currentStep === 1 && (
              <>
                <div>
                  <label className={lc}>{t('fullName', selectedLanguage)} <span className="text-red-500">*</span></label>
                  <input {...register('fullName', { required: t('nameRequired', selectedLanguage) })}
                    className={ic} placeholder={t('enterFullName', selectedLanguage)} />
                  {errors.fullName && <p className={ec}>{errors.fullName.message}</p>}
                </div>
                <div>
                  <label className={lc}>{t('phone', selectedLanguage)} <span className="text-red-500">*</span></label>
                  <input {...register('phoneNumber', {
                    required: t('phoneRequired', selectedLanguage),
                    validate: (value) => {
                      return isValidSriLankanPhoneNumber(value) || t('must10DigitsPhone', selectedLanguage);
                    },
                    onChange: (e) => {
                      const formatted = formatSriLankanPhoneNumber(e.target.value);
                      setValue('phoneNumber', formatted);
                    }
                  })} className={ic} placeholder={t('enterPhone', selectedLanguage)} maxLength={PHONE_NUMBER_MAX_LENGTH} inputMode="numeric" />
                  {errors.phoneNumber && <p className={ec}>{errors.phoneNumber.message}</p>}
                </div>
                <div>
                  <label className={lc}>{t('nic', selectedLanguage)} <span className="text-red-500">*</span></label>
                  <input {...register('nicNumber', {
                    required: t('nicRequired', selectedLanguage),
                    pattern: { value: /^\d{12}$/, message: t('must12Digits', selectedLanguage) }
                  })} className={ic} placeholder="200012345678" maxLength={12} inputMode="numeric" />
                  {errors.nicNumber && <p className={ec}>{errors.nicNumber.message}</p>}
                </div>
                <div>
                  <label className={lc}>{t('email', selectedLanguage)} <span className="text-red-500">*</span></label>
                  <input {...register('email', { 
                    required: t('emailRequired', selectedLanguage),
                    validate: (value) => {
                      if (!value) return t('emailRequired', selectedLanguage);
                      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      return emailPattern.test(value) || t('enterValidEmail', selectedLanguage);
                    }
                  })}
                    className={ic} placeholder="your@email.com" />
                  {errors.email && <p className={ec}>{errors.email.message}</p>}
                  {error && <div className="bg-red-50 border border-red-200 rounded-lg p-2.5"><p className="text-red-700 text-[0.8rem] font-medium">{error}</p></div>}
                </div>
              </>
            )}

            {/* ── Step 2: Profile ── */}
            {currentStep === 2 && (
              <>
                <div>
                  <label className={lc}>{t('preferredLanguage', selectedLanguage)} <span className="text-red-500">*</span></label>
                  <select {...register('preferredLanguage', { required: t('prefLangRequired', selectedLanguage) })}
                    defaultValue="en" className={sc}>
                    <option value="">{t('selectLanguage', selectedLanguage)}</option>
                    <option value="en">{t('englishLang', selectedLanguage)}</option>
                    <option value="si">{t('sinhalaLang', selectedLanguage)}</option>
                    <option value="ta">{t('tamilLang', selectedLanguage)}</option>
                  </select>
                  {errors.preferredLanguage && <p className={ec}>{errors.preferredLanguage.message}</p>}
                </div>
                <div>
                  <label className={lc}>{t('ageGroup', selectedLanguage)} <span className="text-red-500">*</span></label>
                  <select {...register('ageGroup', { required: t('ageRequired', selectedLanguage) })} className={sc}>
                    <option value="">{t('selectAgeGroup', selectedLanguage)}</option>
                    <option value="18-30">18 – 30</option>
                    <option value="31-50">31 – 50</option>
                    <option value="51-65">51 – 65</option>
                    <option value="65+">65+</option>
                  </select>
                  {errors.ageGroup && <p className={ec}>{errors.ageGroup.message}</p>}
                </div>
                <div>
                  <label className={lc}>{t('businessRegNo', selectedLanguage)} <span className="text-stone-400 text-[0.7rem]">{t('optionalText', selectedLanguage)}</span></label>
                  <input {...register('businessRegNo')}
                    className={ic} placeholder="BR number if available" />
                </div>
              </>
            )}

            {/* ── Step 3: Location & Password ── */}
            {currentStep === 3 && (
              <>
                <div>
                  <label className={lc}>{t('province', selectedLanguage)} <span className="text-red-500">*</span></label>
                  <select {...register('province', { required: t('provinceRequired', selectedLanguage) })}
                    onChange={e => { register('province').onChange(e); setValue('district', ''); setValue('dsDivision', ''); }}
                    className={sc}>
                    <option value="">{t('selectProvince', selectedLanguage)}</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {errors.province && <p className={ec}>{errors.province.message}</p>}
                </div>
                <div>
                  <label className={lc}>{t('district', selectedLanguage)} <span className="text-red-500">*</span></label>
                  <select {...register('district', { required: t('districtRequired', selectedLanguage) })}
                    disabled={!selectedProvince}
                    onChange={e => { register('district').onChange(e); setValue('dsDivision', ''); }}
                    className={sc}>
                    <option value="">{t('selectDistrictReg', selectedLanguage)}</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.district && <p className={ec}>{errors.district.message}</p>}
                </div>
                <div>
                  <label className={lc}>{t('dsLabel', selectedLanguage)} <span className="text-red-500">*</span></label>
                  <select {...register('dsDivision', { required: t('dsRequired', selectedLanguage) })}
                    disabled={!selectedDistrict}
                    className={sc}>
                    <option value="">{t('selectDSDivision', selectedLanguage)}</option>
                    {dsDivisions.map(ds => <option key={ds} value={ds}>{ds}</option>)}
                  </select>
                  {errors.dsDivision && <p className={ec}>{errors.dsDivision.message}</p>}
                </div>
                <div>
                  <label className={lc}>{t('password', selectedLanguage)} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'}
                      {...register('password', {
                        required: t('passwordRequired', selectedLanguage),
                        minLength: { value: 8, message: t('minChars', selectedLanguage) },
                        maxLength: { value: 16, message: t('maxChars', selectedLanguage) },
                        pattern: { value: /^[a-zA-Z0-9]+$/, message: t('alphanumericOnly', selectedLanguage) }
                      })}
                      className={`${ic} pr-10`} placeholder={t('alphanumericPwd', selectedLanguage)} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className={ec}>{errors.password.message}</p>}
                </div>
                <div>
                  <label className={lc}>{t('confirmPassword', selectedLanguage)} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type={showConfirm ? 'text' : 'password'}
                      {...register('confirmPassword', {
                        required: t('confirmPwdReq', selectedLanguage),
                        validate: v => v === password || t('passwordsNoMatch', selectedLanguage)
                      })}
                      className={`${ic} pr-10`} placeholder={t('confirmPwdPlaceholder', selectedLanguage)} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className={ec}>{errors.confirmPassword.message}</p>}
                </div>
              </>
            )}

            {/* ── Step 4: Summary ── */}
            {currentStep === 4 && (
              <>
                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                  <div className="bg-emerald-50 px-3 py-2.5 border-b border-stone-200">
                    <h3 className="font-bold text-stone-800 text-[0.9rem]">{t('registrationSummary', selectedLanguage)}</h3>
                  </div>
                  <div className="p-3.5 grid grid-cols-2 gap-x-3 gap-y-2 text-[0.82rem]">
                    <span className="text-stone-500">Name</span>
                    <span className="text-stone-800 font-medium truncate">{watch('fullName') || '—'}</span>
                    <span className="text-stone-500">Phone</span>
                    <span className="text-stone-800 font-medium">{watch('phoneNumber') || '—'}</span>
                    <span className="text-stone-500">NIC</span>
                    <span className="text-stone-800 font-medium">{watch('nicNumber') || '—'}</span>
                    <span className="text-stone-500">Email</span>
                    <span className="text-stone-800 font-medium truncate">{watch('email') || '—'}</span>
                    <span className="text-stone-500">Language</span>
                    <span className="text-stone-800 font-medium capitalize">{watch('preferredLanguage') || '—'}</span>
                    <span className="text-stone-500">Age Group</span>
                    <span className="text-stone-800 font-medium">{watch('ageGroup') || '—'}</span>
                    <span className="text-stone-500">{t('businessReg', selectedLanguage)}</span>
                    <span className="text-stone-800 font-medium">{watch('businessRegNo') || '—'}</span>
                    <span className="text-stone-500">{t('province', selectedLanguage)}</span>
                    <span className="text-stone-800 font-medium">{watch('province') || '—'}</span>
                    <span className="text-stone-500">{t('district', selectedLanguage)}</span>
                    <span className="text-stone-800 font-medium">{watch('district') || '—'}</span>
                    <span className="text-stone-500">{t('dsDivision', selectedLanguage)}</span>
                    <span className="text-stone-800 font-medium truncate">{watch('dsDivision') || '—'}</span>
                    <span className="text-stone-500">{t('role', selectedLanguage)}</span>
                    <span className="text-stone-800 font-medium">{t('landowner', selectedLanguage)}</span>
                  </div>
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-[0.84rem] font-medium">{error}</p>
                  </div>
                )}
              </>
            )}
          </form>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="px-4 pb-4 pt-2.5 space-y-2.5 shrink-0">
          {currentStep < TOTAL_STEPS ? (
            <button onClick={handleNext} disabled={isCheckingEmail}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg shadow font-medium text-[0.95rem] flex items-center justify-center gap-1.5 disabled:opacity-60">
              {isCheckingEmail ? t('loading', selectedLanguage) : <>{t('next', selectedLanguage)} <ArrowRight className="w-4 h-4" /></>}
            </button>
          ) : (
            <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg shadow font-medium text-[0.95rem] flex items-center justify-center gap-1.5 disabled:opacity-50">
              {isSubmitting ? t('creatingAccount', selectedLanguage) : <><Check className="w-4 h-4" /> {t('createAccount', selectedLanguage)}</>}
            </button>
          )}
          <button onClick={currentStep === 1 ? onBack : () => setCurrentStep(currentStep - 1)}
            className="w-full bg-white hover:bg-stone-50 text-stone-700 py-3 rounded-lg border border-stone-300 font-medium text-[0.95rem] flex items-center justify-center gap-1.5">
            <ArrowLeft className="w-4 h-4" /> {t('back', selectedLanguage)}
          </button>
        </div>
      </div>
    </div>
  );
}
