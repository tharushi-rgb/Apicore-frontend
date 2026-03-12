import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/auth';
import { t } from '../i18n';

type Language = 'en' | 'si' | 'ta';

interface Props {
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onBack: () => void;
  onSuccess: () => void;
  initialRole?: string;
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

const districtsByProvince: Record<string, string[]> = {
  'Central': ['Kandy', 'Matale', 'Nuwara Eliya'],
  'Eastern': ['Ampara', 'Batticaloa', 'Trincomalee'],
  'North Central': ['Anuradhapura', 'Polonnaruwa'],
  'Northern': ['Jaffna', 'Kilinochchi', 'Mannar', 'Mullaitivu', 'Vavuniya'],
  'North Western': ['Kurunegala', 'Puttalam'],
  'Sabaragamuwa': ['Kegalle', 'Ratnapura'],
  'Southern': ['Galle', 'Hambantota', 'Matara'],
  'Uva': ['Badulla', 'Monaragala'],
  'Western': ['Colombo', 'Gampaha', 'Kalutara']
};

const dsDivisionsByDistrict: Record<string, string[]> = {
  'Colombo': ['Colombo', 'Dehiwala', 'Homagama', 'Kaduwela', 'Kesbewa', 'Kolonnawa', 'Maharagama', 'Moratuwa', 'Padukka', 'Ratmalana', 'Seethawaka', 'Sri Jayawardenepura Kotte', 'Thimbirigasyaya'],
  'Gampaha': ['Attanagalla', 'Biyagama', 'Divulapitiya', 'Dompe', 'Gampaha', 'Ja-Ela', 'Katana', 'Kelaniya', 'Mahara', 'Minuwangoda', 'Mirigama', 'Negombo', 'Wattala'],
  'Kalutara': ['Agalawatta', 'Bandaragama', 'Beruwala', 'Bulathsinhala', 'Dodangoda', 'Horana', 'Ingiriya', 'Kalutara', 'Madurawela', 'Mathugama', 'Palindanuwara', 'Panadura', 'Walallavita'],
  'Kandy': ['Akurana', 'Delthota', 'Doluwa', 'Ganga Ihala Korale', 'Harispattuwa', 'Hatharaliyadda', 'Kandy Four Gravets', 'Kundasale', 'Medadumbara', 'Minipe', 'Panavila', 'Pasbage Korale', 'Pathadumbara', 'Pathahewaheta', 'Poojapitiya', 'Pyagala', 'Udapalatha', 'Ududumbara', 'Udunuwara', 'Yatinuwara'],
  'Matale': ['Ambanganga Korale', 'Dambulla', 'Galewela', 'Laggala-Pallegama', 'Madawala Ulpotha', 'Matale', 'Naula', 'Pallepola', 'Rattota', 'Ukuwela', 'Wilgamuwa'],
  'Nuwara Eliya': ['Ambagamuwa', 'Hanguranketha', 'Kothmale', 'Nuwara Eliya', 'Walapane'],
  'Galle': ['Akmeemana', 'Ambalangoda', 'Baddegama', 'Balapitiya', 'Benthota', 'Bope-Poddala', 'Elpitiya', 'Galle', 'Gonapinuwala', 'Habaraduwa', 'Hikkaduwa', 'Imaduwa', 'Karandeniya', 'Nagoda', 'Neluwa', 'Niyagama', 'Thawalama', 'Welivitiya-Divithura'],
  'Matara': ['Akuressa', 'Athuraliya', 'Devinuwara', 'Dickwella', 'Hakmana', 'Kamburupitiya', 'Kirinda Puhulwella', 'Kotapola', 'Malimbada', 'Matara Four Gravets', 'Mulatiyana', 'Pasgoda', 'Pitabeddara', 'Thihagoda', 'Weligama', 'Welipitiya'],
  'Hambantota': ['Ambalantota', 'Angunakolapelessa', 'Beliatta', 'Hambantota', 'Katuwana', 'Lunugamvehera', 'Okewela', 'Sooriyawewa', 'Tangalle', 'Tissamaharama', 'Walasmulla', 'Weeraketiya'],
  'Jaffna': ['Delft', 'Island North', 'Island South', 'Jaffna', 'Karainagar', 'Nallur', 'Thenmaradchi', 'Vadamaradchi East', 'Vadamaradchi North', 'Vadamaradchi South-West', 'Valikamam East', 'Valikamam North', 'Valikamam South', 'Valikamam South-West', 'Valikamam West'],
  'Kilinochchi': ['Kandavalai', 'Karachchi', 'Pachchilaipalli', 'Poonakary'],
  'Mannar': ['Madhu', 'Mannar', 'Nanattan', 'Musali', 'Mantal West'],
  'Vavuniya': ['Vavuniya', 'Vavuniya North', 'Vavuniya South', 'Vengalacheddikulam'],
  'Mullaitivu': ['Maritimepattu', 'Oddusuddan', 'Puthukudiyiruppu', 'Thunukkai', 'Welioya', 'Manthai East'],
  'Batticaloa': ['Batticaloa', 'Eravur Pattu', 'Eravur Town', 'Kattankudy', 'Koralai Pattu', 'Koralai Pattu Central', 'Koralai Pattu North', 'Koralai Pattu South', 'Koralai Pattu West', 'Manmunai North', 'Manmunai Pattu', 'Manmunai S. and Eruvil Pattu', 'Manmunai South West', 'Manmunai West', 'Porativu Pattu'],
  'Ampara': ['Addalaichenai', 'Akkayarapattu', 'Alayadiwembu', 'Ampara', 'Damana', 'Dehiattakandiya', 'Irakkamam', 'Kalmunai', 'Karaitivu', 'Lahugala', 'Mahaoya', 'Navithanveli', 'Nintavur', 'Padiyathalawa', 'Pottuvil', 'Sainthamaruthu', 'Sammanthurai', 'Thirukkovil', 'Uhana'],
  'Trincomalee': ['Gomarankadawala', 'Kantale', 'Kinniya', 'Kuchchaveli', 'Morawewa', 'Muttur', 'Padavi Sri Pura', 'Seruvila', 'Thampalagamuwa', 'Trincomalee Town and Gravets', 'Verugal'],
  'Kurunegala': ['Alawwa', 'Bingiriya', 'Ehetuwewa', 'Galgamuwa', 'Ganewatta', 'Giribawa', 'Ibbagamuwa', 'Katuwana', 'Kuliyapitiya East', 'Kuliyapitiya West', 'Kurunegala', 'Mahawa', 'Mallawapitiya', 'Maspotha', 'Mawathagama', 'Narammala', 'Nikaweratiya', 'Panduwasnuwara East', 'Panduwasnuwara West', 'Pannala', 'Polgahawela', 'Polpithigama', 'Ridigama', 'Udubaddawa', 'Wariyapola', 'Weerambugedara'],
  'Puttalam': ['Anamaduwa', 'Arachchikattuwa', 'Chilaw', 'Dankotuwa', 'Kalpitiya', 'Madampe', 'Mahakumbukkadawala', 'Mahawewa', 'Mundalama', 'Nattandiya', 'Nawagattegama', 'Pallama', 'Puttalam', 'Vanathavilluwa', 'Wennappuwa'],
  'Anuradhapura': ['Anuradhapura', 'Galenbindunuwewa', 'Galnewa', 'Horowpothana', 'Ipalogama', 'Kahatagasdigiliya', 'Kebithigollewa', 'Kekirawa', 'Mahavilachchiya', 'Medawachchiya', 'Mihintale', 'Nachchaduwa', 'Nochchiyagama', 'Nuwaragam Palatha Central', 'Nuwaragam Palatha East', 'Padaviya', 'Palagala', 'Palugaswewa', 'Rajanganaya', 'Rambewa', 'Thalawa', 'Thambuttegama', 'Thirappane'],
  'Polonnaruwa': ['Dimbulagala', 'Elahera', 'Hingurakgoda', 'Lankapura', 'Medirigiriya', 'Polonnaruwa', 'Thamankaduwa', 'Welikanda'],
  'Badulla': ['Badulla', 'Bandarawela', 'Ella', 'Haldummulla', 'Hali-Ela', 'Haputale', 'Kandaketiya', 'Lunugala', 'Mahiyanganaya', 'Meegahakivula', 'Passara', 'Rideemaliyadda', 'Soranathota', 'Uva-Paranagama', 'Welimada'],
  'Monaragala': ['Badalkumbura', 'Bibile', 'Buttala', 'Katharagama', 'Madulla', 'Medagama', 'Monaragala', 'Sevanagala', 'Siyambalanduwa', 'Thanamalwila', 'Wellawaya'],
  'Ratnapura': ['Ayagama', 'Balangoda', 'Eheliyagoda', 'Elapatha', 'Embilipitiya', 'Godakawela', 'Imbulpe', 'Kahawatta', 'Kuruwita', 'Kiriella', 'Kolonne', 'Nivithigala', 'Opanayaka', 'Pelmadulla', 'Ratnapura', 'Weligepola'],
  'Kegalle': ['Aranayaka', 'Bulathkohupitiya', 'Dehiovita', 'Deraniyagala', 'Galigamuwa', 'Kegalle', 'Mawanella', 'Rambukkana', 'Ruwanwella', 'Warakapola', 'Yatiyanthota']
};

interface FormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  nicNumber: string;
  password: string;
  confirmPassword: string;
  province: string;
  district: string;
  dsDivision: string;
  preferredLanguage: string;
  ageGroup: string;
  knownBeeAllergy: string;
  bloodGroup: string;
  beekeepingNature: string;
  businessRegNo: string;
  primaryBeeSpecies: string;
  nvqLevel: string;
}

const TOTAL_STEPS = 3;

export function BeekeeperRegistration({ selectedLanguage, onLanguageChange, onBack, onSuccess, initialRole }: Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, watch, formState: { errors }, trigger, setValue } = useForm<FormData>({ 
    mode: 'onBlur',
    defaultValues: {
      knownBeeAllergy: 'no'
    }
  });

  const role = initialRole || 'beekeeper';

  const password = watch('password');
  const selectedProvince = watch('province');
  const selectedDistrict = watch('district');

  const districts = selectedProvince ? districtsByProvince[selectedProvince] : [];
  const dsDivisions = selectedDistrict ? dsDivisionsByDistrict[selectedDistrict] : [];

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

  const stepLabels = [t('personalDetails', selectedLanguage), t('beekeepingProfile', selectedLanguage), t('locationReview', selectedLanguage)];

  const handleNext = async () => {
    if (currentStep === 1) {
      const valid = await trigger(['fullName', 'email', 'phoneNumber', 'password', 'confirmPassword', 'nicNumber']);
      if (valid) setCurrentStep(2);
    } else if (currentStep === 2) {
      const valid = await trigger(['preferredLanguage', 'ageGroup', 'primaryBeeSpecies', 'beekeepingNature']);
      if (valid) setCurrentStep(3);
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
        district: data.district,
        preferred_language: data.preferredLanguage || 'en',
        age_group: data.ageGroup,
        beekeeping_nature: data.beekeepingNature,
        business_reg_no: data.businessRegNo || undefined,
        primary_bee_species: data.primaryBeeSpecies,
        nvq_level: data.nvqLevel || undefined,
        role: role,
        // Optional fields removed from registration for profile later
        known_bee_allergy: 'no',
        blood_group: undefined,
      });
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      onSuccess();
    } catch (e: any) { setError(e.message === 'Failed to fetch' ? 'Cannot connect to server. Please make sure the backend is running.' : (e.message || 'Registration failed')); }
    setIsSubmitting(false);
  };

  const LangSelector = () => (
    <div className="w-full px-[5%] pt-[1rem] flex justify-end shrink-0">
      {(['en','si','ta'] as const).map(l=>(
        <button key={l} onClick={()=>onLanguageChange(l)}
          className={`px-3 py-2 rounded-lg transition-all min-w-[48px] min-h-[44px] ${selectedLanguage===l?'bg-amber-500 text-white shadow-md':'bg-white/70 text-stone-700 hover:bg-white'}`}>
          {l==='en'?'EN':l==='si'?'සිං':'த'}
        </button>
      ))}
    </div>
  );

  const inputClass = "w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none text-[1rem]";
  const selectClass = "w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none text-[1rem]";
  const labelClass = "block text-stone-700 mb-1.5 text-[0.875rem] font-medium";

  return (
    <div className="h-screen bg-stone-900 flex justify-center overflow-hidden">
      <div className="w-[min(92vw,22rem)] h-full bg-stone-50 shadow-2xl relative flex flex-col">
        <LangSelector />
        <div className="px-[6%] pt-[0.75rem] pb-[1rem] shrink-0">
          <h1 className="text-[1.875rem] font-bold text-stone-800 text-center mb-4 italic capitalize leading-tight">{role === 'beekeeper' ? t('beekeeperRegistration', selectedLanguage) : t('landownerRegistration', selectedLanguage)}</h1>
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[0.875rem] text-stone-600 font-medium">{t('step', selectedLanguage)} {currentStep} {t('stepOf', selectedLanguage)} {TOTAL_STEPS}</span>
              <span className="text-[0.875rem] text-stone-600 font-medium">{stepLabels[currentStep - 1]}</span>
            </div>
            <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }} />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-[6%] pb-[1rem]">
          <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto space-y-3">

            {currentStep === 1 && (
              <>
                <div>
                  <label className={labelClass}>{t('fullName', selectedLanguage)} <span className="text-red-500">*</span></label>
                  <input {...register('fullName',{required:t('nameRequired', selectedLanguage)})} className={inputClass} placeholder={t('enterFullName', selectedLanguage)} />
                  {errors.fullName && <p className="text-red-500 text-[0.75rem] mt-1">{errors.fullName.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>{t('nic', selectedLanguage)} <span className="text-red-500">*</span></label>
                  <input {...register('nicNumber', {required: t('nicRequired', selectedLanguage), pattern: {value: /^\d{12}$/, message: t('must12Digits', selectedLanguage)}})} className={inputClass} placeholder="200012345678" maxLength={12} />
                  {errors.nicNumber && <p className="text-red-500 text-[0.75rem] mt-1">{errors.nicNumber.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>{t('emailPhone', selectedLanguage)} <span className="text-red-500">*</span></label>
                  <input {...register('email',{required:t('emailRequired', selectedLanguage)})} className={inputClass} placeholder={t('emailPhonePlaceholder', selectedLanguage)} />
                  {errors.email && <p className="text-red-500 text-[0.75rem] mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>{t('phone', selectedLanguage)} <span className="text-red-500">*</span></label>
                  <input {...register('phoneNumber', {required: t('phoneRequired', selectedLanguage), pattern: {value: /^\d{12}$/, message: t('must12DigitsPhone', selectedLanguage)}})} className={inputClass} placeholder="94774567890" maxLength={12} />
                  {errors.phoneNumber && <p className="text-red-500 text-[0.75rem] mt-1">{errors.phoneNumber.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>{t('password', selectedLanguage)} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type={showPwd?'text':'password'} {...register('password',{required:t('passwordRequired', selectedLanguage),minLength:{value:8,message:t('minChars', selectedLanguage)}, maxLength:{value:16, message: t('maxChars', selectedLanguage)}, pattern:{value:/^[a-zA-Z0-9]+$/, message: t('alphanumericOnly', selectedLanguage)}})} className={`${inputClass} pr-12`} placeholder={t('alphanumericPwd', selectedLanguage)} />
                    <button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500">
                      {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-[0.75rem] mt-1">{errors.password.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>{t('confirmPassword', selectedLanguage)} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type={showConfirm?'text':'password'} {...register('confirmPassword',{required:t('confirmPwdReq', selectedLanguage),validate:v=>v===password||t('passwordsNoMatch', selectedLanguage)})} className={`${inputClass} pr-12`} placeholder={t('confirmPwdPlaceholder', selectedLanguage)} />
                    <button type="button" onClick={()=>setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500">
                      {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-[0.75rem] mt-1">{errors.confirmPassword.message}</p>}
                </div>
              </>
            )}

            {currentStep === 2 && (
              <>
                <div>
                  <label className={labelClass}>{t('preferredLanguage', selectedLanguage)} <span className="text-red-500">*</span></label>
                  <select {...register('preferredLanguage', {required: t('prefLangRequired', selectedLanguage)})} defaultValue="en" className={selectClass}>
                    <option value="">{t('selectLanguage', selectedLanguage)}</option>
                    <option value="en">{t('englishLang', selectedLanguage)}</option>
                    <option value="si">{t('sinhalaLang', selectedLanguage)}</option>
                    <option value="ta">{t('tamilLang', selectedLanguage)}</option>
                  </select>
                  {errors.preferredLanguage && <p className="text-red-500 text-[0.75rem] mt-1">{errors.preferredLanguage.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>{t('ageGroup', selectedLanguage)} <span className="text-red-500">*</span></label>
                  <select {...register('ageGroup', {required: t('ageRequired', selectedLanguage)})} className={selectClass}>
                    <option value="">{t('selectAgeGroup', selectedLanguage)}</option>
                    <option value="18-30">18 – 30</option>
                    <option value="31-50">31 – 50</option>
                    <option value="51-65">51 – 65</option>
                    <option value="65+">65+</option>
                  </select>
                  {errors.ageGroup && <p className="text-red-500 text-[0.75rem] mt-1">{errors.ageGroup.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>{t('beekeepingNature', selectedLanguage)} <span className="text-red-500">*</span></label>
                  <select {...register('beekeepingNature', {required: t('natureRequired', selectedLanguage)})} className={selectClass}>
                    <option value="">{t('selectNature', selectedLanguage)}</option>
                    <option value="hobbyist">{t('hobbyist', selectedLanguage)}</option>
                    <option value="commercial">{t('commercial', selectedLanguage)}</option>
                  </select>
                  {errors.beekeepingNature && <p className="text-red-500 text-[0.75rem] mt-1">{errors.beekeepingNature.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>{t('primaryBeeSpecies', selectedLanguage)} <span className="text-red-500">*</span></label>
                  <select {...register('primaryBeeSpecies', {required: t('speciesRequired', selectedLanguage)})} className={selectClass}>
                    <option value="">{t('selectSpecies', selectedLanguage)}</option>
                    <option value="apis_cerana">{t('apisCerana', selectedLanguage)}</option>
                    <option value="tetragonula">{t('tetragonula', selectedLanguage)}</option>
                  </select>
                  {errors.primaryBeeSpecies && <p className="text-red-500 text-[0.75rem] mt-1">{errors.primaryBeeSpecies.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>{t('businessRegNo', selectedLanguage)}</label>
                  <input {...register('businessRegNo')} className={inputClass} placeholder={t('brPlaceholder', selectedLanguage)} />
                </div>
                <div>
                  <label className={labelClass}>{t('nvqLevel', selectedLanguage)}</label>
                  <select {...register('nvqLevel')} className={selectClass}>
                    <option value="">{t('selectTrainingLevel', selectedLanguage)}</option>
                    <option value="academic_degree">{t('academicDegree', selectedLanguage)}</option>
                    <option value="dept_agriculture">{t('deptAgriculture', selectedLanguage)}</option>
                    <option value="nvq3">{t('nvq3', selectedLanguage)}</option>
                    <option value="nvq4">{t('nvq4', selectedLanguage)}</option>
                    <option value="none">{t('noneOption', selectedLanguage)}</option>
                  </select>
                </div>
              </>
            )}

            {currentStep === 3 && (
              <>
                <div>
                  <label className={labelClass}>{t('province', selectedLanguage)} <span className="text-red-500">*</span></label>
                  <select {...register('province', {required: t('provinceRequired', selectedLanguage)})} 
                    onChange={(e) => {
                      register('province').onChange(e);
                      setValue('district', '');
                      setValue('dsDivision', '');
                    }}
                    className={selectClass}>
                    <option value="">{t('selectProvince', selectedLanguage)}</option>
                    {Object.keys(districtsByProvince).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {errors.province && <p className="text-red-500 text-[0.75rem] mt-1">{errors.province.message}</p>}
                </div>

                <div>
                  <label className={labelClass}>{t('district', selectedLanguage)} <span className="text-red-500">*</span></label>
                  <select {...register('district', {required: t('districtRequired', selectedLanguage)})} 
                    disabled={!selectedProvince}
                    onChange={(e) => {
                      register('district').onChange(e);
                      setValue('dsDivision', '');
                    }}
                    className={selectClass}>
                    <option value="">{t('selectDistrictReg', selectedLanguage)}</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.district && <p className="text-red-500 text-[0.75rem] mt-1">{errors.district.message}</p>}
                </div>

                <div>
                  <label className={labelClass}>{t('dsLabel', selectedLanguage)} <span className="text-red-500">*</span></label>
                  <select {...register('dsDivision', {required: t('dsRequired', selectedLanguage)})} 
                    disabled={!selectedDistrict}
                    className={selectClass}>
                    <option value="">{t('selectDSDivision', selectedLanguage)}</option>
                    {dsDivisions.map(ds => <option key={ds} value={ds}>{ds}</option>)}
                  </select>
                  {errors.dsDivision && <p className="text-red-500 text-[0.75rem] mt-1">{errors.dsDivision.message}</p>}
                </div>

                <div className="bg-white/80 rounded-xl p-4 border border-stone-200 space-y-2 mt-4">
                  <h3 className="font-bold text-stone-800 text-sm border-b border-stone-100 pb-1">{t('registrationSummary', selectedLanguage)}</h3>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
                    <span className="text-stone-500">Name:</span><span className="text-stone-800 font-semibold truncate">{watch('fullName') || '—'}</span>
                    <span className="text-stone-500">NIC:</span><span className="text-stone-800 font-semibold">{watch('nicNumber') || '—'}</span>
                    <span className="text-stone-500">Email/Phone:</span><span className="text-stone-800 font-semibold truncate">{watch('email') || '—'}</span>
                    <span className="text-stone-500">Contact:</span><span className="text-stone-800 font-semibold">{watch('phoneNumber') || '—'}</span>
                    <span className="text-stone-500">Language:</span><span className="text-stone-800 font-semibold capitalize">{watch('preferredLanguage') || '—'}</span>
                    <span className="text-stone-500">Age:</span><span className="text-stone-800 font-semibold">{watch('ageGroup') || '—'}</span>
                    <span className="text-stone-500">Nature:</span><span className="text-stone-800 font-semibold capitalize">{watch('beekeepingNature') || '—'}</span>
                    <span className="text-stone-500">Species:</span><span className="text-stone-800 font-semibold capitalize">{watch('primaryBeeSpecies')?.replace('_',' ') || '—'}</span>
                    <span className="text-stone-500">BR No:</span><span className="text-stone-800 font-semibold">{watch('businessRegNo') || '—'}</span>
                    <span className="text-stone-500">Training:</span><span className="text-stone-800 font-semibold capitalize">{watch('nvqLevel')?.replace('_',' ') || '—'}</span>
                    <span className="text-stone-500">Province:</span><span className="text-stone-800 font-semibold">{watch('province') || '—'}</span>
                    <span className="text-stone-500">District:</span><span className="text-stone-800 font-semibold">{watch('district') || '—'}</span>
                    <span className="text-stone-500">DS Division:</span><span className="text-stone-800 font-semibold truncate">{watch('dsDivision') || '—'}</span>
                  </div>
                </div>

                {error && <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4"><p className="text-red-700 text-sm font-medium">{error}</p></div>}
              </>
            )}
          </form>
        </div>

        <div className="px-[6%] pb-[2rem] space-y-3 shrink-0">
          {currentStep < TOTAL_STEPS ? (
            <button onClick={handleNext} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl shadow-lg min-h-[3.5rem] font-medium text-[1.125rem] flex items-center justify-center gap-2">
              {t('next', selectedLanguage)} <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl shadow-lg min-h-[3.5rem] font-medium text-[1.125rem] flex items-center justify-center gap-2 disabled:opacity-50">
              {isSubmitting ? t('registering', selectedLanguage) : <><Check className="w-5 h-5" /> {t('registerBtn', selectedLanguage)}</>}
            </button>
          )}
          <button onClick={currentStep===1?onBack:()=>setCurrentStep(currentStep - 1)} className="w-full bg-white hover:bg-stone-50 text-stone-700 py-4 rounded-xl border-2 border-stone-300 min-h-[3.5rem] font-medium text-[1.125rem] flex items-center justify-center gap-2">
            <ArrowLeft className="w-5 h-5" /> {t('back', selectedLanguage)}
          </button>
        </div>
      </div>
    </div>
  );
}
