import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { potHiveInspectionsService, type PotHiveInspectionPayload } from '@/app/services/potHiveInspections';
import { hivesService } from '@/app/services/hives';
import { ChevronLeft, Loader, CheckCircle, AlertCircle } from 'lucide-react';

type Language = 'en' | 'si' | 'ta';

interface Translations {
  [key: string]: {
    [key in Language]: string;
  };
}

const translations: Translations = {
  potHiveInspection: { en: 'Pot Hive Inspection', si: 'බඩ මී ගල් පරීක්ෂა', ta: 'குடம் தேனீ பரிசோதனை' },
  recordInspection: { en: 'Record Inspection', si: 'පරීක්ෂා පටිගත කරන්න', ta: 'பரிசோதனை பதிவுசெய்க' },
  inspectionDate: { en: 'Inspection Date', si: 'පරීක්ෂා දිනය', ta: 'பரிசோதனை தேதி' },
  entranceActivity: { en: 'Entrance Activity', si: 'ප්‍රවේශ ක්‍රියාකාරිත්වය', ta: 'நுழைவு செயல்பாடு' },
  queenPresence: { en: 'Queen Presence', si: 'රැජින ඉనුවත්කම', ta: 'ராணி இருப்பு' },
  honeyPollenStores: { en: 'Honey/Pollen Stores', si: 'පෙති/පරාග ගබඩා', ta: 'தேன்/மகரந்த சேமிப்பு' },
  pestDiseasePresence: { en: 'Pest/Disease Presence', si: 'පිළිබඩ/රෝග ඉනුවත්කම', ta: 'தீமை/நோய் இருப்பு' },
  pestNames: { en: 'Pest Names (if detected)', si: 'පිළිබඩ නම් (සනාក්ත කළේ නම්)', ta: 'தீமை பெயர்கள் (கண்டறியப்பட்டால்)' },
  treatmentStatus: { en: 'Treatment Status', si: 'ප්‍රතිකාර තත්ත්වය', ta: 'சிகிச்சை நிலை' },
  treatmentUsed: { en: 'Treatment Used', si: 'භාවිතා කරන ලද ප්‍රතිකාරය', ta: 'பயன்படுத்திய சிகிச்சை' },
  generalRemarks: { en: 'General Remarks', si: 'සාමාන්‍ය ප්‍රකාශන', ta: 'பொதுவான கருத்துக்கள்' },
  low: { en: 'Low', si: 'අඩු', ta: 'குறைந்த' },
  medium: { en: 'Medium', si: 'මධ්‍යම', ta: 'மধ్య' },
  high: { en: 'High', si: 'ඉතා', ta: 'உயர்' },
  seen: { en: 'Seen', si: 'දැකිණි', ta: 'கண்ட' },
  freshEggs: { en: 'Fresh Eggs', si: 'නැවතින බිත්තර', ta: 'புதிய முட்டைகள்' },
  notSeen: { en: 'Not Seen', si: 'දැකිය යුතු නැත', ta: 'பார்க்கவில்லை' },
  sufficient: { en: 'Sufficient', si: 'ප්‍රමාණවත්', ta: 'போதுமான' },
  clear: { en: 'Clear', si: 'පැහැදිලි', ta: 'தெளிவு' },
  pestDetected: { en: 'Pest Detected', si: 'පිළිබඩ හඳුනාගෙන ඇත', ta: 'தீமை கண்டறியப்பட்டது' },
  underTreatment: { en: 'Under Treatment', si: 'ප්‍රතිකාරයට යටින්', ta: 'சிகிச்சைக்குட்பட்டுள்ளது' },
  selectOption: { en: 'Select...', si: 'තෝරන්න...', ta: 'தேர්ந்தெடுக்க...' },
  submit: { en: 'Submit Inspection', si: 'පරීක්ෂා ඉදිරිපත් කරන්න', ta: 'பரிசோதனை சமர්పிக்கவும்' },
  cancel: { en: 'Cancel', si: 'අවලංගු කරන්න', ta: 'ரத்த செய்யவும்' },
  loading: { en: 'Loading...', si: 'පූරණයවේ...',ta: 'ஏற்றுகிறது...' },
  success: { en: 'Inspection recorded successfully!', si: 'පරීක්ෂා සফලව පටිගත කරන ලදි!', ta: 'பரிசோதனை வெற்றிகரமாக பதிவுசெய়யப்பட்டது!' },
  error: { en: 'Error recording inspection', si: 'පරීක්ෂා පටිගතකරණ දෝෂය', ta: 'பரிசோதனை பதிவுசெய்யப்பட்ட பிழை' },
  hiveNotFound: { en: 'Hive not found', si: 'මී ගල සොයා ගත නොහැක', ta: 'களம் கண்டறியப்படவில்லை' },
  varroa: { en: 'Varroa', si: 'වාරෝවා', ta: 'வரோவா' },
  nosema: { en: 'Nosema', si: 'නෝසේමා', ta: 'நோசેமா' },
  foulbrood: { en: 'Foulbrood', si: 'විෂ සිටුවුම', ta: 'பழுப்பு அமுக்க' },
  waxMoth: { en: 'Wax Moth', si: 'පඩි කුඩයා', ta: 'மெழுகு பூச்சி' },
};

function t(key: string, lang: Language): string {
  return translations[key]?.[lang] ?? translations[key]?.['en'] ?? key;
}

export function PotHiveInspectionForm() {
  const navigate = useNavigate();
  const { hiveId } = useParams();
  const selectedLanguage = (localStorage.getItem('language') ?? 'en') as Language;

  const [loading, setLoading] = useState(false);
  const [hiveName, setHiveName] = useState('');
  const [formData, setFormData] = useState<PotHiveInspectionPayload>({
    hive_id: parseInt(hiveId || '0', 10),
    inspection_date: new Date().toISOString().split('T')[0],
    entrance_activity: 'medium',
    queen_presence: 'seen',
    honey_pollen_stores: 'sufficient',
    pest_disease_presence: [],
    pest_names: '',
    treatment_status: 'clear',
    treatment_used: '',
    general_remarks: '',
  });

  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Load hive details
  useEffect(() => {
    const loadHive = async () => {
      try {
        if (parseInt(hiveId || '0', 10) > 0) {
          const hive = await hivesService.getById(parseInt(hiveId || '', 10));
          setHiveName(hive.name || `Hive ${hiveId}`);
        }
      } catch (error) {
        console.error('Error loading hive:', error);
        setStatus({
          type: 'error',
          message: t('hiveNotFound', selectedLanguage),
        });
      }
    };
    loadHive();
  }, [hiveId]);

  const handleInputChange = (
    field: keyof typeof formData,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePestCheckboxChange = (pestName: string) => {
    setFormData((prev) => {
      const current = prev.pest_disease_presence || [];
      const updated = current.includes(pestName)
        ? current.filter((p) => p !== pestName)
        : [...current, pestName];
      return {
        ...prev,
        pest_disease_presence: updated,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      await potHiveInspectionsService.create(formData);
      setStatus({
        type: 'success',
        message: t('success', selectedLanguage),
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate(`/hives/${hiveId}`);
      }, 2000);
    } catch (error) {
      console.error('Error submitting inspection:', error);
      setStatus({
        type: 'error',
        message: `${t('error', selectedLanguage)}: ${(error as Error).message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const pestOptions = ['varroa', 'nosema', 'foulbrood', 'waxMoth'];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-stone-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-stone-800">
              {t('potHiveInspection', selectedLanguage)}
            </h1>
            <p className="text-sm text-stone-600">{hiveName}</p>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {status.type && (
        <div
          className={`mx-4 mt-4 p-4 rounded-lg flex items-center gap-3 ${
            status.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {status.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="text-sm">{status.message}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Inspection Date */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2">
            {t('inspectionDate', selectedLanguage)} *
          </label>
          <input
            type="date"
            value={formData.inspection_date}
            onChange={(e) => handleInputChange('inspection_date', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
            required
          />
        </div>

        {/* Entrance Activity */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2">
            {t('entranceActivity', selectedLanguage)} *
          </label>
          <select
            value={formData.entrance_activity}
            onChange={(e) => handleInputChange('entrance_activity', e.target.value as 'low' | 'medium' | 'high')}
            className="w-full px-4 py-3 rounded-lg border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
            required
          >
            <option value="low">{t('low', selectedLanguage)}</option>
            <option value="medium">{t('medium', selectedLanguage)}</option>
            <option value="high">{t('high', selectedLanguage)}</option>
          </select>
          <p className="text-xs text-stone-500 mt-1">
            Low = minimal activity | Medium = normal activity | High = high nectar flow
          </p>
        </div>

        {/* Queen Presence */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2">
            {t('queenPresence', selectedLanguage)} *
          </label>
          <div className="space-y-2">
            {['seen', 'freshEggs', 'notSeen'].map((option) => (
              <label key={option} className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 hover:border-amber-300 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="queen_presence"
                  value={option === 'freshEggs' ? 'fresh_eggs' : option}
                  checked={
                    formData.queen_presence === (option === 'freshEggs' ? 'fresh_eggs' : option)
                  }
                  onChange={(e) => handleInputChange('queen_presence', e.target.value as 'seen' | 'fresh_eggs' | 'not_seen')}
                  className="w-4 h-4 cursor-pointer"
                  required
                />
                <span className="text-sm text-stone-700">
                  {t(option, selectedLanguage)}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Honey/Pollen Stores */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2">
            {t('honeyPollenStores', selectedLanguage)} *
          </label>
          <select
            value={formData.honey_pollen_stores}
            onChange={(e) => handleInputChange('honey_pollen_stores', e.target.value as 'low' | 'sufficient' | 'high')}
            className="w-full px-4 py-3 rounded-lg border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
            required
          >
            <option value="low">{t('low', selectedLanguage)}</option>
            <option value="sufficient">{t('sufficient', selectedLanguage)}</option>
            <option value="high">{t('high', selectedLanguage)}</option>
          </select>
        </div>

        {/* Pest/Disease Presence - Checkboxes */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2">
            {t('pestDiseasePresence', selectedLanguage)}
          </label>
          <div className="space-y-2">
            {pestOptions.map((pest) => (
              <label key={pest} className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 hover:border-amber-300 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={formData.pest_disease_presence?.includes(pest) || false}
                  onChange={() => handlePestCheckboxChange(pest)}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-sm text-stone-700">
                  {t(pest, selectedLanguage)}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Pest Names */}
        {formData.pest_disease_presence && formData.pest_disease_presence.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              {t('pestNames', selectedLanguage)}
            </label>
            <input
              type="text"
              value={formData.pest_names || ''}
              onChange={(e) => handleInputChange('pest_names', e.target.value)}
              placeholder="e.g., Varroa mites found, treatment started..."
              className="w-full px-4 py-3 rounded-lg border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
            />
          </div>
        )}

        {/* Treatment Status */}
        {formData.pest_disease_presence && formData.pest_disease_presence.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              {t('treatmentStatus', selectedLanguage)}
            </label>
            <select
              value={formData.treatment_status || 'clear'}
              onChange={(e) => handleInputChange('treatment_status', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
            >
              <option value="clear">{t('clear', selectedLanguage)}</option>
              <option value="pest_detected">{t('pestDetected', selectedLanguage)}</option>
              <option value="under_treatment">{t('underTreatment', selectedLanguage)}</option>
            </select>
          </div>
        )}

        {/* Treatment Used */}
        {formData.treatment_status === 'under_treatment' && (
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              {t('treatmentUsed', selectedLanguage)}
            </label>
            <input
              type="text"
              value={formData.treatment_used || ''}
              onChange={(e) => handleInputChange('treatment_used', e.target.value)}
              placeholder="e.g., Oxalic acid, Formic acid, etc."
              className="w-full px-4 py-3 rounded-lg border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
            />
          </div>
        )}

        {/* General Remarks */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2">
            {t('generalRemarks', selectedLanguage)}
          </label>
          <textarea
            value={formData.general_remarks || ''}
            onChange={(e) => handleInputChange('general_remarks', e.target.value)}
            placeholder="Additional observations or notes..."
            rows={4}
            className="w-full px-4 py-3 rounded-lg border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all resize-none"
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4 pb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 px-4 py-3 rounded-lg border border-stone-300 text-stone-700 font-semibold hover:bg-stone-50 transition-colors"
          >
            {t('cancel', selectedLanguage)}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 disabled:bg-stone-300 transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            {loading ? t('loading', selectedLanguage) : t('submit', selectedLanguage)}
          </button>
        </div>
      </form>
    </div>
  );
}
