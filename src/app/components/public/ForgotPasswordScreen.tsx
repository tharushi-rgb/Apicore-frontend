import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, AlertCircle, CheckCircle, Hexagon, Mail } from 'lucide-react';
import { authService } from '../../services/auth';

type Language = 'en' | 'si' | 'ta';

interface Props {
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onBackToLogin: () => void;
}

interface FormData {
  email: string;
}

export function ForgotPasswordScreen({ selectedLanguage, onLanguageChange, onBackToLogin }: Props) {
  const [stage, setStage] = useState<'email' | 'sent' | 'reset'>('email');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [successEmail, setSuccessEmail] = useState('');
  const [resetForm, setResetForm] = useState({ code: '', newPassword: '', confirmPassword: '' });
  const [isResetting, setIsResetting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmitEmail = async (data: FormData) => {
    setError('');
    setIsSending(true);
    try {
      await authService.resetPasswordForEmail(data.email);
      setSuccessEmail(data.email);
      setStage('sent');
    } catch (e: any) {
      setError(e.message || 'Failed to send reset email');
    }
    setIsSending(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!resetForm.code.trim()) {
      setError('Please enter the code from your email');
      return;
    }

    if (!resetForm.newPassword) {
      setError('Please enter a new password');
      return;
    }

    if (resetForm.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsResetting(true);
    try {
      await authService.confirmPasswordReset(resetForm.code, resetForm.newPassword);
      setStage('reset');
    } catch (e: any) {
      setError(e.message || 'Failed to reset password');
    }
    setIsResetting(false);
  };

  const labels: Record<Language, Record<string, string>> = {
    en: {
      title: 'Reset Password',
      enterEmail: 'Enter your email address',
      sendLink: 'Send Reset Link',
      checkEmail: 'Check Your Email',
      emailSent: `We've sent a password reset link to ${successEmail}`,
      enterCode: 'Enter Code',
      newPassword: 'New Password',
      confirmPassword: 'Confirm Password',
      resetPassword: 'Reset Password',
      codeHelp: 'Check your email for the reset code',
      passwordReset: 'Password Reset Successful',
      passwordResetMsg: 'Your password has been reset. You can now login with your new password.',
      backToLogin: 'Back to Login',
      required: 'This field is required',
      minChars: 'Must be at least 8 characters',
      passwordMismatch: 'Passwords do not match',
    },
    si: {
      title: 'මුරපදය යළි සකසන්න',
      enterEmail: 'ඔබගේ ඉ-තැපෙල් ලිපිනය ඇතුළු කරන්න',
      sendLink: 'පුනරුිසකසන සම්බන්ධතාවය යවන්න',
      checkEmail: 'ඔබගේ ඉ-තැපෙල් පරීක්ෂා කරන්න',
      emailSent: `අපි ${successEmail}එ මුරපදය යළි සකසන බැවුම් එක යවා ඇත්තෙමු`,
      enterCode: 'කේතය ඇතුළු කරන්න',
      newPassword: 'නව මුරපදය',
      confirmPassword: 'මුරපදය තහවුරු කරන්න',
      resetPassword: 'මුරපදය යළි සකසන්න',
      codeHelp: 'ඔබගේ ඉ-තැපෙල්ලో යළි සකසන කේතය සොයන්න',
      passwordReset: 'මුරපදය යළි සකසනලදි සාර්ථක විය',
      passwordResetMsg: 'ඔබගේ මුරපදය යළි සකසනලදි ඇත. ඔබට දැන් ඔබගේ නව මුරපදයෙන් ඉඩවිය හැකිය.',
      backToLogin: 'ලොගින් වෙත ආපසු යන්න',
      required: 'මෙම ක්ෂේත්‍රය අවශ්‍ය ය',
      minChars: 'අවම වශයෙන් අක්ෂර 8 ක් විය යුතුය',
      passwordMismatch: 'මුරපදයන් ගැලපෙන්නේ නැත',
    },
    ta: {
      title: 'கடவுச்சொல்லை மீட்டமை',
      enterEmail: 'உங்கள் மின்னஞ்சல் முகவரியை உள்ளிடவும்',
      sendLink: 'மீட்டமை இணைப்பை அனுப்பவும்',
      checkEmail: 'உங்கள் மின்னஞ்சலைச் சரிபார்க்கவும்',
      emailSent: `நாங்கள் ${successEmail}க்கு கடவுச்சொல் மீட்டமை இணைப்பை அனுப்பியுள்ளோம்`,
      enterCode: 'குறியீட்டை உள்ளிடவும்',
      newPassword: 'புதிய கடவுச்சொல்',
      confirmPassword: 'கடவுச்சொல்லை உறுதிப்படுத்தவும்',
      resetPassword: 'கடவுச்சொல்லை மீட்டமை',
      codeHelp: 'உங்கள் மின்னஞ்சலில் மீட்டமை குறியீட்டைத் தேடுங்கள்',
      passwordReset: 'கடவுச்சொல் மீட்டமை வெற்றியுடன் முடிந்தது',
      passwordResetMsg: 'உங்கள் கடவுச்சொல் மீட்டமைக்கப்பட்டுவிட்டது. இப்போது உங்கள் புதிய கடவுச்சொல்லை உபயோகித்து உள்நுழையலாம்.',
      backToLogin: 'உள்நுழைய திரும்பவும்',
      required: 'இந்த புலம் தேவைப்படுகிறது',
      minChars: 'குறைந்தது 8 எழுத்துக்கள் இருக்க வேண்டும்',
      passwordMismatch: 'கடவுச்சொல்கள் பொருந்தவில்லை',
    },
  };

  const t = labels[selectedLanguage];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 flex flex-col">
      <div className="w-full px-[5%] pt-[1rem] pb-1 flex justify-end shrink-0">
        {(['en', 'si', 'ta'] as const).map((l) => (
          <button
            key={l}
            onClick={() => onLanguageChange(l)}
            className={`px-3 py-2 rounded-lg transition-all min-w-[48px] min-h-[44px] ${
              selectedLanguage === l
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-white/70 text-stone-700 hover:bg-white'
            }`}
          >
            {l === 'en' ? 'EN' : l === 'si' ? 'සිං' : 'த'}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-[6%] pb-[2rem]">
        <div className="max-w-md w-full">
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <Hexagon className="w-16 h-16 text-amber-500 fill-amber-500/20 stroke-[2]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Hexagon className="w-8 h-8 text-emerald-600 fill-emerald-600/30 stroke-[2]" />
              </div>
            </div>
            <h1 className="text-[1.85rem] font-bold text-stone-800 text-center">{t.title}</h1>
          </div>

          {/* Stage: Email Input */}
          {stage === 'email' && (
            <form onSubmit={handleSubmit(onSubmitEmail)} className="space-y-4">
              <div>
                <label className="block text-stone-700 mb-2 text-[0.9rem] font-medium">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  {...register('email', { required: t.required })}
                  className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none text-[0.92rem]"
                  placeholder={t.enterEmail}
                  disabled={isSending}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSending}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl shadow-lg min-h-[52px] font-medium text-[0.85rem] disabled:opacity-50"
              >
                {isSending ? 'Sending...' : t.sendLink}
              </button>
            </form>
          )}

          {/* Stage: Email Sent */}
          {stage === 'sent' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 flex flex-col items-center text-center">
                <Mail className="w-12 h-12 text-emerald-600 mb-3" />
                <h2 className="text-emerald-900 font-bold text-[0.95rem] mb-2">{t.checkEmail}</h2>
                <p className="text-emerald-700 text-[0.92rem]">{t.emailSent}</p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-stone-700 mb-2 text-[0.9rem] font-medium">
                    {t.enterCode} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={resetForm.code}
                    onChange={(e) => setResetForm({ ...resetForm, code: e.target.value })}
                    placeholder={t.codeHelp}
                    className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none text-[0.92rem]"
                    disabled={isResetting}
                  />
                </div>

                <div>
                  <label className="block text-stone-700 mb-2 text-[0.9rem] font-medium">
                    {t.newPassword} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={resetForm.newPassword}
                    onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                    placeholder={t.newPassword}
                    className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none text-[0.92rem]"
                    disabled={isResetting}
                  />
                </div>

                <div>
                  <label className="block text-stone-700 mb-2 text-[0.9rem] font-medium">
                    {t.confirmPassword} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={resetForm.confirmPassword}
                    onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                    placeholder={t.confirmPassword}
                    className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none text-[0.92rem]"
                    disabled={isResetting}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isResetting}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl shadow-lg min-h-[56px] font-medium text-lg disabled:opacity-50"
                >
                  {isResetting ? 'Resetting...' : t.resetPassword}
                </button>
              </form>

              <button
                onClick={() => {
                  setStage('email');
                  setResetForm({ code: '', newPassword: '', confirmPassword: '' });
                  setError('');
                }}
                className="w-full text-amber-600 hover:text-amber-700 text-sm font-medium py-2"
              >
                {selectedLanguage === 'en' ? 'Resend Code?' : selectedLanguage === 'si' ? 'කේතය යළි යවන්නද?' : 'குறியீட்டை மீண்டும் அனுப்புவதா?'}
              </button>
            </div>
          )}

          {/* Stage: Success */}
          {stage === 'reset' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 flex flex-col items-center text-center">
                <CheckCircle className="w-12 h-12 text-emerald-600 mb-3" />
                <h2 className="text-emerald-900 font-bold text-lg mb-2">{t.passwordReset}</h2>
                <p className="text-emerald-700 text-sm">{t.passwordResetMsg}</p>
              </div>

              <button
                onClick={onBackToLogin}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl shadow-lg min-h-[56px] font-medium text-lg"
              >
                {t.backToLogin}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-8">
        {stage !== 'reset' && (
          <button
            onClick={onBackToLogin}
            className="w-full bg-white hover:bg-stone-50 text-stone-700 py-4 rounded-xl border-2 border-stone-300 min-h-[56px] font-medium text-lg flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" /> {t.backToLogin}
          </button>
        )}
      </div>
    </div>
  );
}
