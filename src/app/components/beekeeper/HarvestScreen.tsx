import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Plus,
  X,
  MapPin,
  Calendar,
  Package,
  Camera,
  Upload,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Edit,
  Eye,
  Info,
} from 'lucide-react';
import { MobileHeader } from '../shared/MobileHeader';
import { authService } from '../../services/auth';
import { hivesService } from '../../services/hives';
import { apiariesService } from '../../services/apiaries';
import { harvestsService, type Harvest } from '../../services/harvests';
import { t } from '../../i18n';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'harvest' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onNavigate: (tab: NavTab) => void;
  onLogout: () => void;
}

interface FormData {
  harvestDate: string;
  harvestType: string;
  otherHarvestType?: string;
  quantity: number;
  customUnit?: string;
  showToBuyers: boolean;
  linkType: 'hive' | 'apiary' | 'none';
  hiveId?: string;
  apiaryId?: string;
  harvestMethod: string;
  notes: string;
}

export function HarvestScreen({ selectedLanguage, onLanguageChange, onNavigate, onLogout }: Props) {
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [harvestType, setHarvestType] = useState('');
  const [linkType, setLinkType] = useState<'hive' | 'apiary' | 'none'>('hive');
  const [showToBuyers, setShowToBuyers] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [hives, setHives] = useState<{ id: number; name: string; apiary?: string }[]>([]);
  const [apiaries, setApiaries] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingHarvest, setEditingHarvest] = useState<Harvest | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('');
  const user = authService.getLocalUser();
  const activeTab: NavTab = 'dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      showToBuyers: false,
      linkType: 'hive',
    },
  });

  const loadData = async () => {
    try {
      const [harvestData, hiveData, apiaryData] = await Promise.all([
        harvestsService.getAll(),
        hivesService.getAll(),
        apiariesService.getAll(),
      ]);
      setHarvests(harvestData);
      setHives(hiveData.map((h: any) => ({ id: h.id, name: h.name, apiary: h.apiary_name || '-' })));
      setApiaries(apiaryData.map((a: any) => ({ id: a.id, name: a.name })));
    } catch (error) {
      console.error('Failed to load harvest data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reset form when editing harvest changes
  useEffect(() => {
    if (editingHarvest) {
      const isOtherType = !['honey', 'wax'].includes(editingHarvest.harvest_type.toLowerCase());
      const formLinkType = editingHarvest.hive_id ? 'hive' : editingHarvest.apiary_id ? 'apiary' : 'none';
      reset({
        harvestDate: editingHarvest.harvest_date,
        harvestType: isOtherType ? 'other' : editingHarvest.harvest_type.toLowerCase(),
        otherHarvestType: isOtherType ? editingHarvest.harvest_type : undefined,
        quantity: editingHarvest.quantity,
        customUnit: editingHarvest.unit !== 'kg' ? editingHarvest.unit : undefined,
        showToBuyers: false,
        linkType: formLinkType,
        hiveId: editingHarvest.hive_id?.toString() || undefined,
        apiaryId: editingHarvest.apiary_id?.toString() || undefined,
        harvestMethod: editingHarvest.harvest_method || '',
        notes: editingHarvest.notes || '',
      });
      setHarvestType(isOtherType ? 'other' : editingHarvest.harvest_type.toLowerCase());
      setLinkType(formLinkType);
    } else {
      reset({ showToBuyers: false, linkType: 'hive' });
      setHarvestType('');
      setLinkType('hive');
    }
  }, [editingHarvest, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload: any = {
        harvest_date: data.harvestDate,
        harvest_type: data.harvestType === 'other' ? data.otherHarvestType || 'other' : data.harvestType,
        quantity: data.quantity,
        unit: data.customUnit || 'kg',
        harvest_method: data.harvestMethod || null,
        surplus_listed: showToBuyers ? data.quantity : 0,
        hive_id: linkType === 'hive' && data.hiveId ? Number(data.hiveId) : null,
        apiary_id: linkType === 'apiary' && data.apiaryId ? Number(data.apiaryId) : null,
        notes: data.notes || null,
      };

      if (editingHarvest) {
        await harvestsService.update(editingHarvest.id, payload);
      } else {
        await harvestsService.create(payload);
      }

      setShowRecordForm(false);
      setEditingHarvest(null);
      reset();
      setUploadedImages([]);
      loadData();
    } catch (error) {
      console.error('Failed to save harvest:', error);
      alert('Failed to save harvest');
    }
  };

  const handleImageUpload = () => {
    setUploadedImages([...uploadedImages, `image-${Date.now()}.jpg`]);
  };

  // Summary stats
  const totalHarvest = harvests.reduce((sum, h) => sum + (h.quantity || 0), 0);
  const honeyHarvested = harvests.filter((h) => h.harvest_type?.toLowerCase().includes('honey')).reduce((sum, h) => sum + (h.quantity || 0), 0);
  const waxHarvested = harvests.filter((h) => h.harvest_type?.toLowerCase().includes('wax')).reduce((sum, h) => sum + (h.quantity || 0), 0);
  const harvestSessions = harvests.length;

  // Filter records
  const filteredHarvests = harvests.filter((h) => {
    if (searchText && !h.harvest_type?.toLowerCase().includes(searchText.toLowerCase()) && !h.hive_name?.toLowerCase().includes(searchText.toLowerCase()) && !h.apiary_name?.toLowerCase().includes(searchText.toLowerCase())) return false;
    if (filterType && h.harvest_type?.toLowerCase() !== filterType) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 relative">
      <div className="h-full overflow-y-auto pb-8">
        {/* Header */}
        <div className="bg-white shadow-sm sticky top-0 z-30">
          <MobileHeader
            userName={user?.name}
            roleLabel={user?.role}
            selectedLanguage={selectedLanguage}
            onLanguageChange={onLanguageChange}
            activeTab={activeTab}
            onNavigate={onNavigate}
            onLogout={onLogout}
            onViewAllNotifications={() => onNavigate('notifications')}
          />

          {/* Harvest Title Section */}
          <div className="px-6 pb-4 border-t border-stone-100">
            <h1 className="text-2xl font-bold text-stone-800">{t('harvest', selectedLanguage)}</h1>
            <p className="text-stone-500 text-sm mt-1">{t('recordTrackHarvest', selectedLanguage)}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 py-6 space-y-6">
          {/* Section 1: Harvest Summary */}
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard
              label={t('totalHarvestMonth', selectedLanguage)}
              value={`${totalHarvest.toFixed(2)} kg`}
              bgColor="bg-amber-50"
              textColor="text-amber-700"
            />
            <SummaryCard
              label={t('honeyHarvested', selectedLanguage)}
              value={`${honeyHarvested.toFixed(2)} kg`}
              bgColor="bg-emerald-50"
              textColor="text-emerald-700"
            />
            <SummaryCard
              label={t('waxHarvested', selectedLanguage)}
              value={`${waxHarvested.toFixed(2)} kg`}
              bgColor="bg-blue-50"
              textColor="text-blue-700"
            />
            <SummaryCard
              label={t('harvestSessions', selectedLanguage)}
              value={harvestSessions.toString()}
              bgColor="bg-purple-50"
              textColor="text-purple-700"
            />
          </div>

          {/* Section 2: Primary Action */}
          {!showRecordForm && (
            <button
              onClick={() => setShowRecordForm(true)}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span>{t('recordNewHarvest', selectedLanguage)}</span>
            </button>
          )}

          {/* Section 3: Record Harvest Form */}
          {showRecordForm && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-stone-800">
                  {editingHarvest ? t('editHarvest', selectedLanguage) : t('recordNewHarvest', selectedLanguage)}
                </h2>
                <button
                  onClick={() => {
                    setShowRecordForm(false);
                    setEditingHarvest(null);
                    reset();
                  }}
                  className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-stone-600" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Harvest Details */}
                <div className="space-y-4">
                  <h3 className="font-bold text-stone-800 pb-2 border-b-2 border-amber-200">
                    {t('harvestDetails', selectedLanguage)}
                  </h3>

                  <div>
                    <label className="block text-stone-700 font-medium mb-2">
                      {t('harvestDate', selectedLanguage)} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      {...register('harvestDate', { required: t('dateRequired', selectedLanguage) })}
                      className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none transition-colors"
                    />
                    {errors.harvestDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.harvestDate.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-stone-700 font-medium mb-2">
                      {t('harvestType', selectedLanguage)} <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('harvestType', { required: t('typeRequired', selectedLanguage) })}
                      onChange={(e) => setHarvestType(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none transition-colors"
                    >
                      {!editingHarvest && <option value="">{t('selectType', selectedLanguage)}</option>}
                      <option value="honey">{t('honey', selectedLanguage)}</option>
                      <option value="wax">{t('wax', selectedLanguage)}</option>
                      <option value="other">{t('other', selectedLanguage)}</option>
                    </select>
                    {errors.harvestType && (
                      <p className="text-red-500 text-sm mt-1">{errors.harvestType.message}</p>
                    )}
                  </div>

                  {harvestType === 'other' && (
                    <div>
                      <label className="block text-stone-700 font-medium mb-2">
                        {t('otherHarvestType', selectedLanguage)} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register('otherHarvestType', { required: t('typeRequired', selectedLanguage) })}
                        className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none transition-colors"
                        placeholder={t('enterType', selectedLanguage)}
                      />
                      {errors.otherHarvestType && (
                        <p className="text-red-500 text-sm mt-1">{errors.otherHarvestType.message}</p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-stone-700 font-medium mb-2">
                        {t('quantity', selectedLanguage)} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        {...register('quantity', { required: t('quantityRequired', selectedLanguage), min: 0.1 })}
                        className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none transition-colors"
                        placeholder="0.0"
                      />
                      {errors.quantity && (
                        <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-stone-700 font-medium mb-2">{t('unit', selectedLanguage)}</label>
                      {harvestType === 'other' ? (
                        <input
                          type="text"
                          {...register('customUnit')}
                          className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none transition-colors"
                          placeholder={t('enterUnit', selectedLanguage)}
                        />
                      ) : (
                        <input
                          type="text"
                          value="kg"
                          disabled
                          className="w-full px-4 py-3 bg-stone-100 border-2 border-stone-200 rounded-xl text-stone-600 cursor-not-allowed"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Surplus Listing */}
                <div className="space-y-4">
                  <h3 className="font-bold text-stone-800 pb-2 border-b-2 border-amber-200">
                    {t('surplusListing', selectedLanguage)}
                  </h3>

                  <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <p className="font-medium text-stone-800 mb-1">{t('showToBuyers', selectedLanguage)}</p>
                        <p className="text-sm text-stone-600">
                          {t('showToBuyersDesc', selectedLanguage)}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showToBuyers}
                          onChange={(e) => setShowToBuyers(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-stone-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800 flex items-start gap-2">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>Step 1:</strong> Record harvest → enter quantity → enable 'Show to
                          Buyers' if surplus.
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hive/Apiary Association */}
                <div className="space-y-4">
                  <h3 className="font-bold text-stone-800 pb-2 border-b-2 border-amber-200">
                    {t('hiveApiaryAssociation', selectedLanguage)}
                  </h3>

                  <div>
                    <label className="block text-stone-700 font-medium mb-3">
                      {t('linkHarvestTo', selectedLanguage)}
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <label className="cursor-pointer">
                        <input
                          type="radio"
                          value="hive"
                          checked={linkType === 'hive'}
                          onChange={() => setLinkType('hive')}
                          className="sr-only peer"
                        />
                        <div className="p-3 bg-white border-2 border-stone-200 rounded-xl peer-checked:border-amber-500 peer-checked:bg-amber-50 transition-all text-center text-sm">
                          {t('specificHive', selectedLanguage)}
                        </div>
                      </label>
                      <label className="cursor-pointer">
                        <input
                          type="radio"
                          value="apiary"
                          checked={linkType === 'apiary'}
                          onChange={() => setLinkType('apiary')}
                          className="sr-only peer"
                        />
                        <div className="p-3 bg-white border-2 border-stone-200 rounded-xl peer-checked:border-amber-500 peer-checked:bg-amber-50 transition-all text-center text-sm">
                          {t('apiary', selectedLanguage)}
                        </div>
                      </label>
                      <label className="cursor-pointer">
                        <input
                          type="radio"
                          value="none"
                          checked={linkType === 'none'}
                          onChange={() => setLinkType('none')}
                          className="sr-only peer"
                        />
                        <div className="p-3 bg-white border-2 border-stone-200 rounded-xl peer-checked:border-amber-500 peer-checked:bg-amber-50 transition-all text-center text-sm">
                          {t('notLinkedLabel', selectedLanguage)}
                        </div>
                      </label>
                    </div>
                  </div>

                  {linkType === 'hive' && (
                    <div>
                      <label className="block text-stone-700 font-medium mb-2">{t('selectHive', selectedLanguage)}</label>
                      <select
                        {...register('hiveId')}
                        className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none transition-colors"
                      >
                        {!editingHarvest && <option value="">{t('selectHive', selectedLanguage)}</option>}
                        {hives.map((hive) => (
                          <option key={hive.id} value={hive.id}>
                            {hive.name} ({hive.apiary})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {linkType === 'apiary' && (
                    <div>
                      <label className="block text-stone-700 font-medium mb-2">{t('selectApiary', selectedLanguage)}</label>
                      <select
                        {...register('apiaryId')}
                        className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none transition-colors"
                      >
                        {!editingHarvest && <option value="">{t('selectApiary', selectedLanguage)}</option>}
                        {apiaries.map((apiary) => (
                          <option key={apiary.id} value={apiary.id}>
                            {apiary.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Harvest Method & Notes */}
                <div className="space-y-4">
                  <h3 className="font-bold text-stone-800 pb-2 border-b-2 border-amber-200">
                    {t('harvestMethodNotes', selectedLanguage)}
                  </h3>

                  <div>
                    <label className="block text-stone-700 font-medium mb-2">{t('harvestMethod', selectedLanguage)}</label>
                    <select
                      {...register('harvestMethod')}
                      className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none transition-colors"
                    >
                      <option value="">{t('selectMethod', selectedLanguage)}</option>
                      <option value="frame">{t('frameExtraction', selectedLanguage)}</option>
                      <option value="crush">{t('crushStrain', selectedLanguage)}</option>
                      <option value="pot">{t('potHarvest', selectedLanguage)}</option>
                      <option value="other">{t('other', selectedLanguage)}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-700 font-medium mb-2">{t('notes', selectedLanguage)}</label>
                    <textarea
                      {...register('notes')}
                      rows={4}
                      className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none transition-colors resize-none"
                      placeholder={t('harvestNotesPlaceholder', selectedLanguage)}
                    />
                  </div>
                </div>

                {/* Media Upload */}
                <div className="space-y-4">
                  <h3 className="font-bold text-stone-800 pb-2 border-b-2 border-amber-200">
                    {t('mediaUpload', selectedLanguage)}
                  </h3>

                  <div>
                    <label className="block text-stone-700 font-medium mb-3">{t('harvestImages', selectedLanguage)}</label>
                    <div className="space-y-3">
                      {uploadedImages.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {uploadedImages.map((img, idx) => (
                            <div
                              key={idx}
                              className="w-20 h-20 bg-stone-200 rounded-lg flex items-center justify-center"
                            >
                              <Camera className="w-6 h-6 text-stone-500" />
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={handleImageUpload}
                          className="flex-1 bg-white border-2 border-stone-200 hover:border-amber-500 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                          <Camera className="w-5 h-5 text-stone-600" />
                          <span className="text-stone-700 font-medium">{t('cameraBtn', selectedLanguage)}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleImageUpload}
                          className="flex-1 bg-white border-2 border-stone-200 hover:border-amber-500 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                          <Upload className="w-5 h-5 text-stone-600" />
                          <span className="text-stone-700 font-medium">{t('galleryBtn', selectedLanguage)}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRecordForm(false);
                      setEditingHarvest(null);
                      reset();
                    }}
                    className="flex-1 bg-stone-200 hover:bg-stone-300 text-stone-700 py-3 rounded-xl font-medium transition-colors"
                  >
                    {t('cancel', selectedLanguage)}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-medium transition-colors"
                  >
                    {editingHarvest ? t('updateHarvest', selectedLanguage) : t('saveHarvest', selectedLanguage)}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filter & Search */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between p-4 hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-stone-600" />
                <span className="font-medium text-stone-800">{t('filterSearch', selectedLanguage)}</span>
              </div>
              {showFilters ? (
                <ChevronUp className="w-5 h-5 text-stone-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-stone-600" />
              )}
            </button>

            {showFilters && (
              <div className="p-4 border-t border-stone-200 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder={t('searchHarvestRecords', selectedLanguage)}
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
                  >
                    <option value="">{t('allTypes', selectedLanguage)}</option>
                    <option value="honey">{t('honey', selectedLanguage)}</option>
                    <option value="wax">{t('wax', selectedLanguage)}</option>
                    <option value="other">{t('other', selectedLanguage)}</option>
                  </select>

                  <select className="px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors">
                    <option value="">{t('surplusStatus', selectedLanguage)}</option>
                    <option value="listed">{t('listedForBuyers', selectedLanguage)}</option>
                    <option value="internal">{t('internalUse', selectedLanguage)}</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Harvest Records List */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-stone-800">{t('harvestRecords', selectedLanguage)}</h2>

            {filteredHarvests.length > 0 ? (
              <div className="space-y-3">
                {filteredHarvests.map((record) => (
                  <div
                    key={record.id}
                    className="bg-white rounded-2xl shadow-sm p-4 border-l-4 border-amber-400"
                  >
                    {/* Top Row */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-lg font-bold text-stone-800">{record.harvest_type}</p>
                        <p className="text-2xl font-bold text-amber-600">
                          {record.quantity} {record.unit}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-stone-100 text-stone-600 text-xs font-medium rounded-full">
                        {record.harvest_date}
                      </span>
                    </div>

                    {/* Second Row */}
                    <div className="flex items-center gap-4 text-sm text-stone-600 mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{record.harvest_date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{record.hive_name || record.apiary_name || t('notLinkedTxt', selectedLanguage)}</span>
                      </div>
                    </div>

                    {/* Third Row */}
                    {record.notes && (
                      <div className="text-sm text-stone-600 mb-3">
                        <p className="truncate">
                          <span className="font-medium">Notes:</span> {record.notes}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button className="flex-1 flex items-center justify-center gap-1 py-2 bg-stone-100 hover:bg-stone-200 rounded-full transition-colors text-sm font-medium text-stone-700 min-h-9">
                        <Eye className="w-4 h-4" />
                        <span>{t('viewDetails', selectedLanguage)}</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingHarvest(record);
                          setShowRecordForm(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-amber-100 hover:bg-amber-200 rounded-full transition-colors text-sm font-medium text-amber-700 min-h-9"
                      >
                        <Edit className="w-4 h-4" />
                        <span>{t('edit', selectedLanguage)}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-10 h-10 text-amber-600" />
                </div>
                <p className="text-lg font-bold text-stone-800 mb-2">{t('noHarvestRecords', selectedLanguage)}</p>
                <p className="text-stone-600 mb-6">
                  {t('recordFirstHarvestDesc', selectedLanguage)}
                </p>
                <button
                  onClick={() => setShowRecordForm(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  {t('recordHarvestBtn', selectedLanguage)}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: string;
  bgColor: string;
  textColor: string;
}

function SummaryCard({ label, value, bgColor, textColor }: SummaryCardProps) {
  return (
    <div className={`${bgColor} rounded-xl p-4`}>
      <p className="text-stone-600 text-xs mb-1.5">{label}</p>
      <p className={`text-xl font-bold ${textColor} break-words`}>{value}</p>
    </div>
  );
}
