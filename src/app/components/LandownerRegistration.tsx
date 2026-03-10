import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Check, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/auth';

type Language = 'en' | 'si' | 'ta';

interface LandownerRegistrationProps {
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onBack: () => void;
  onSuccess: () => void;
}

interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function LandownerRegistration({
  selectedLanguage,
  onLanguageChange,
  onBack,
  onSuccess,
}: LandownerRegistrationProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ mode: 'onBlur' });

  const password = watch('password');

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError('');
    try {
      await authService.register({
        name: data.fullName,
        email: data.email,
        password: data.password,
        role: 'landowner',
        preferred_language: 'en',
        known_bee_allergy: 'no',
      });
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
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

  const inputClass =
    'w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-emerald-500 focus:outline-none text-[1rem]';
  const labelClass = 'block text-stone-700 mb-1.5 text-[0.875rem] font-medium';

  return (
    <div className="h-screen bg-stone-900 flex justify-center overflow-hidden">
      <div className="w-[min(92vw,22rem)] h-full bg-stone-50 shadow-2xl relative flex flex-col">
        {/* Language selector */}
        <div className="w-full px-[5%] pt-[1rem] flex justify-end shrink-0">
          {(['en', 'si', 'ta'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => onLanguageChange(lang)}
              className={`px-3 py-2 rounded-lg transition-all min-w-[48px] min-h-[44px] ${
                selectedLanguage === lang
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-white/70 text-stone-700 hover:bg-white'
              }`}
            >
              {lang === 'en' ? 'EN' : lang === 'si' ? 'සිං' : 'த'}
            </button>
          ))}
        </div>

        {/* Scrollable form body */}
        <div className="flex-1 flex flex-col items-center justify-center px-[6%] pb-[2rem] overflow-y-auto">
          <div className="w-full max-w-md">
            <h1 className="text-[1.875rem] font-bold text-stone-800 text-center mb-8 italic leading-tight">
              Landowner Registration
            </h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className={labelClass}>
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('fullName', { required: 'Full name is required' })}
                  className={inputClass}
                  placeholder="Enter your full name"
                  disabled={isSubmitting}
                />
                {errors.fullName && (
                  <p className="text-red-500 text-[0.75rem] mt-1">{errors.fullName.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className={labelClass}>
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  className={inputClass}
                  placeholder="your.email@example.com"
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-red-500 text-[0.75rem] mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className={labelClass}>
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Min 8 characters' },
                      maxLength: { value: 16, message: 'Max 16 characters' },
                      pattern: {
                        value: /^[a-zA-Z0-9]+$/,
                        message: 'Alphanumeric only',
                      },
                    })}
                    className={`${inputClass} pr-12`}
                    placeholder="8-16 alphanumeric"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-[0.75rem] mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className={labelClass}>
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (v) => v === password || 'Passwords do not match',
                    })}
                    className={`${inputClass} pr-12`}
                    placeholder="Re-enter password"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500"
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-[0.75rem] mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <p className="text-red-700 text-[0.875rem] font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl shadow-lg min-h-[3.5rem] font-medium text-[1.125rem] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  'Creating account...'
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Create Account
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Back button */}
        <div className="px-[6%] pb-[2rem] shrink-0">
          <button
            onClick={onBack}
            className="w-full bg-white hover:bg-stone-50 text-stone-700 py-4 rounded-xl border-2 border-stone-300 min-h-[3.5rem] font-medium text-[1.125rem] flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
