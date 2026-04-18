import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  Check,
  Eye,
  FilePlus2,
  HandCoins,
  Loader2,
  MapPin,
  Pencil,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { MobileHeader } from '../shared/MobileHeader';
import { authService } from '../../services/auth';
import {
  landownerMarketplaceService,
  type Bid,
  type Contract,
  type FinancialTerms,
  type LandPlot,
  type Listing,
  type ListingStatus,
} from '../../services/landownerMarketplace';
import { t } from '../../i18n';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';
type EditorMode = 'create' | 'edit' | 'view';

interface Props {
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onNavigate: (tab: NavTab) => void;
  onLogout: () => void;
  pendingFilterOnly?: boolean;
}

interface FormState {
  listingId?: number;
  plotId: number;
  financialTerms: FinancialTerms;
  cashRentLkr: string;
  honeyShareKg: string;
  sprayingClauseAgreed: boolean;
  availabilityEndDate: string;
}

const EMPTY_FORM: FormState = {
  plotId: 0,
  financialTerms: 'cash_rent',
  cashRentLkr: '',
  honeyShareKg: '',
  sprayingClauseAgreed: false,
  availabilityEndDate: '',
};

export function LandownerListingsScreen({
  selectedLanguage,
  onLanguageChange,
  onNavigate,
  onLogout,
  pendingFilterOnly = false,
}: Props) {
  const user = authService.getLocalUser();

  const [loading, setLoading] = useState(true);
  const [plots, setPlots] = useState<LandPlot[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [bidsCache, setBidsCache] = useState<Record<number, Bid[]>>({});

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('create');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isBidsOpen, setIsBidsOpen] = useState(false);
  const [activeListingForBids, setActiveListingForBids] = useState<Listing | null>(null);
  const [activeBids, setActiveBids] = useState<Bid[]>([]);
  const [listingSearch, setListingSearch] = useState('');
  const [listingStatusFilter, setListingStatusFilter] = useState<'all' | ListingStatus>('all');
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [plotsData, listingsData, contractsData] = await Promise.all([
        landownerMarketplaceService.getPlots(),
        landownerMarketplaceService.getListings(),
        landownerMarketplaceService.getContracts(),
      ]);

      setPlots(plotsData);
      setContracts(contractsData);

      // Filter listings if needed and load bids
      let filteredListings = listingsData;
      const bidsCacheTemp: Record<number, Bid[]> = {};

      for (const listing of listingsData) {
        const bids = await landownerMarketplaceService.getBidsForListing(listing.id);
        bidsCacheTemp[listing.id] = bids;
      }

      if (pendingFilterOnly) {
        filteredListings = listingsData.filter((listing) =>
          bidsCacheTemp[listing.id]?.some((bid) => bid.status === 'pending')
        );
      }

      setListings(filteredListings);
      setBidsCache(bidsCacheTemp);
    } catch (error) {
      console.error('Failed to load data:', error);
      setMessage({ type: 'error', text: t('failedToLoadData', selectedLanguage) });
    } finally {
      setLoading(false);
    }
  }, [pendingFilterOnly]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredListings = listings.filter((listing) => {
    if (listingStatusFilter !== 'all' && listing.status !== listingStatusFilter) return false;
    const query = listingSearch.trim().toLowerCase();
    if (!query) return true;
    const plot = plots.find((item) => item.id === listing.plotId);
    const terms = [listing.listingCode, plot?.name, plot?.district, plot?.dsDivision]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return terms.includes(query);
  });

  const selectedPlot = plots.find((plot) => plot.id === form.plotId);

  const openCreate = () => {
    setMessage(null);
    setEditorMode('create');
    setForm(EMPTY_FORM);
    setIsEditorOpen(true);
  };

  const openView = (listing: Listing) => {
    setMessage(null);
    setEditorMode('view');
    setForm({
      listingId: listing.id,
      plotId: listing.plotId,
      financialTerms: listing.financialTerms,
      cashRentLkr: listing.cashRentLkr ? String(listing.cashRentLkr) : '',
      honeyShareKg: listing.honeyShareKg ? String(listing.honeyShareKg) : '',
      sprayingClauseAgreed: listing.sprayingClauseAgreed,
      availabilityEndDate: listing.availabilityEndDate || '',
    });
    setIsEditorOpen(true);
  };

  const openEdit = async (listing: Listing) => {
    const bids = bidsCache[listing.id] || [];
    if (bids.length > 0) {
      setMessage({
        type: 'error',
        text: t('cannotEditListingWithBids', selectedLanguage),
      });
      return;
    }

    setMessage(null);
    setEditorMode('edit');
    setForm({
      listingId: listing.id,
      plotId: listing.plotId,
      financialTerms: listing.financialTerms,
      cashRentLkr: listing.cashRentLkr ? String(listing.cashRentLkr) : '',
      honeyShareKg: listing.honeyShareKg ? String(listing.honeyShareKg) : '',
      sprayingClauseAgreed: listing.sprayingClauseAgreed,
      availabilityEndDate: listing.availabilityEndDate || '',
    });
    setIsEditorOpen(true);
  };

  const openBids = async (listing: Listing) => {
    setActiveListingForBids(listing);
    const bids = bidsCache[listing.id] || await landownerMarketplaceService.getBidsForListing(listing.id);
    setActiveBids(bids);
    setIsBidsOpen(true);
  };

  const closeEditor = () => setIsEditorOpen(false);

  const handleDelete = async (listingId: number) => {
    setSaving(true);
    try {
      await landownerMarketplaceService.deleteListing(listingId);
      setConfirmDelete(null);
      setMessage({ type: 'success', text: t('listingDeletedSuccess', selectedLanguage) });
      await loadData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || t('failedToDeleteListing', selectedLanguage) });
    } finally {
      setSaving(false);
    }
  };

  const validateFormForPublish = () => {
    if (!form.plotId) return t('selectPlotRequired', selectedLanguage);

    if (form.financialTerms === 'cash_rent') {
      const rentValue = Number(form.cashRentLkr);
      if (!Number.isFinite(rentValue) || rentValue <= 0) return t('lkrAmountRequired', selectedLanguage);
    }

    if (form.financialTerms === 'honey_share') {
      const honeyValue = Number(form.honeyShareKg);
      if (!Number.isFinite(honeyValue) || honeyValue <= 0) return t('yieldKgRequired', selectedLanguage);
    }

    if (!form.sprayingClauseAgreed) {
      return t('mustAgreePesticideNotice', selectedLanguage);
    }

    return '';
  };

  const saveListing = async (targetStatus: ListingStatus) => {
    setMessage(null);

    if (!form.plotId) {
      setMessage({ type: 'error', text: t('selectPlotRequired', selectedLanguage) });
      return;
    }

    const publishValidation = targetStatus === 'published' ? validateFormForPublish() : '';
    if (publishValidation) {
      setMessage({ type: 'error', text: publishValidation });
      return;
    }

    const payload = {
      plotId: form.plotId,
      financialTerms: form.financialTerms,
      cashRentLkr: form.financialTerms === 'cash_rent' ? Number(form.cashRentLkr) : undefined,
      honeyShareKg: form.financialTerms === 'honey_share' ? Number(form.honeyShareKg) : undefined,
      sprayingClauseAgreed: form.sprayingClauseAgreed,
      availabilityEndDate: form.availabilityEndDate || undefined,
      status: targetStatus,
    };

    

    setSaving(true);
    try {
      if (editorMode === 'edit' && form.listingId) {
        await landownerMarketplaceService.updateListing(form.listingId, payload);
        setMessage({ type: 'success', text: targetStatus === 'draft' ? t('listingUpdatedDraft', selectedLanguage) : t('listingUpdatedPublished', selectedLanguage) });
      } else {
        await landownerMarketplaceService.createListing(payload);
        setMessage({ type: 'success', text: targetStatus === 'draft' ? t('listingSavedDraft', selectedLanguage) : t('listingPublishedSuccess', selectedLanguage) });
      }

      setIsEditorOpen(false);
      await loadData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || t('failedToSaveListing', selectedLanguage) });
    } finally {
      setSaving(false);
    }
  };

  const handleAcceptBid = async (bidId: number) => {
    if (!activeListingForBids) return;

    setSaving(true);
    try {
      await landownerMarketplaceService.acceptBid(activeListingForBids.id, bidId);
      setMessage({ type: 'success', text: t('bidAcceptedSuccess', selectedLanguage) });
      setIsBidsOpen(false);
      await loadData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || t('failedToAcceptBid', selectedLanguage) });
    } finally {
      setSaving(false);
    }
  };

  const handleRejectBid = async (bidId: number) => {
    if (!activeListingForBids) return;

    setSaving(true);
    try {
      await landownerMarketplaceService.rejectBid(activeListingForBids.id, bidId);
      setMessage({ type: 'success', text: t('bidRejectedSuccess', selectedLanguage) });
      // Refresh bids
      const bids = await landownerMarketplaceService.getBidsForListing(activeListingForBids.id);
      setActiveBids(bids);
      setBidsCache((prev) => ({ ...prev, [activeListingForBids.id]: bids }));
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || t('failedToRejectBid', selectedLanguage) });
    } finally {
      setSaving(false);
    }
  };

  const handleMoveOutResponse = async (contractId: number, approve: boolean) => {
    setSaving(true);
    try {
      await landownerMarketplaceService.respondMoveOut(contractId, approve);
      setMessage({
        type: 'success',
        text: approve
          ? t('moveOutApprovedSuccess', selectedLanguage)
          : t('moveOutDeclinedSuccess', selectedLanguage),
      });
      await loadData();
    } catch (error) {
      console.error('Failed to update move-out request:', error);
      setMessage({ type: 'error', text: t('failedToUpdateMoveOut', selectedLanguage) });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[100dvh] bg-gradient-to-b from-emerald-50 via-green-50 to-white flex flex-col overflow-hidden">
        <div className="bg-white shadow-sm">
          <MobileHeader
            userName={user?.name}
            roleLabel="Landowner"
            selectedLanguage={selectedLanguage}
            onLanguageChange={onLanguageChange}
            activeTab="clients"
            onNavigate={onNavigate}
            onLogout={onLogout}
            onViewAllNotifications={() => onNavigate('notifications')}
            role="landowner"
            theme="green"
          />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
        </div>
      </div>
    );
  }

  return (
    
    <div className="h-full bg-white relative">
      <div className="h-full overflow-y-auto pb-24">
        {/* Navbar */}
        <div className="bg-white shadow-sm">
          <MobileHeader
            userName={user?.name}
            roleLabel="Landowner"
            selectedLanguage={selectedLanguage}
            onLanguageChange={onLanguageChange}
            activeTab="clients"
            onNavigate={onNavigate}
            onLogout={onLogout}
            onViewAllNotifications={() => onNavigate('notifications')}
            role="landowner"
            theme="green"
          />
        </div>

        <div className="px-4 py-4 space-y-4">
        <section className="rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-base font-extrabold text-stone-900">{t('listings', selectedLanguage)}</h1>
              <p className="mt-1 text-sm text-stone-600">
                {pendingFilterOnly ? t('pendingBidsOnly', selectedLanguage) : t('createPublishManage', selectedLanguage)}
              </p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              <FilePlus2 className="h-4 w-4" />
              {t('createListing', selectedLanguage)}
            </button>
          </div>

          {message && (
            <p className={`mt-2 rounded-lg px-3 py-2 text-xs font-semibold ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              {message.text}
            </p>
          )}
        </section>

        {plots.length === 0 ? (
          <section className="rounded-xl border border-dashed border-stone-300 bg-white px-4 py-4 shadow-sm text-center">
            <p className="text-sm font-semibold text-stone-800">{t('needAtLeastOnePlot', selectedLanguage)}</p>
            <button
              onClick={() => onNavigate('profile')}
              className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-700 px-3 py-1.5 text-xs font-semibold text-emerald-800"
            >
              {t('goToMyLands', selectedLanguage)}
            </button>
          </section>
        ) : (
          <section className="rounded-xl border border-stone-200 bg-white px-2 py-2 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 px-1 pb-2">
              <div className="relative min-w-[12rem] flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                <input
                  value={listingSearch}
                  onChange={(event) => setListingSearch(event.target.value)}
                  placeholder={t('searchListingPlotLocation', selectedLanguage)}
                  className="w-full rounded-lg border border-stone-300 bg-white py-1.5 pl-8 pr-3 text-[0.75rem] text-stone-700 focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <select
                value={listingStatusFilter}
                onChange={(event) => setListingStatusFilter(event.target.value as typeof listingStatusFilter)}
                className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-[0.75rem] text-stone-700 focus:border-emerald-600 focus:outline-none"
              >
                <option value="all">{t('anyStatus', selectedLanguage)}</option>
                <option value="draft">{t('draft', selectedLanguage)}</option>
                <option value="published">{t('published', selectedLanguage)}</option>
                <option value="accepted">{t('accepted', selectedLanguage)}</option>
                <option value="expired">{t('expired', selectedLanguage)}</option>
              </select>
            </div>
            <div className="grid grid-cols-[1.2fr_1fr_auto] gap-2 border-b border-stone-200 px-1 pb-1">
              <p className="text-caption uppercase tracking-[0.05em] text-stone-500">{t('listing', selectedLanguage)}</p>
              <p className="text-caption uppercase tracking-[0.05em] text-stone-500">{t('location', selectedLanguage)}</p>
              <p className="text-caption uppercase tracking-[0.05em] text-stone-500 text-right">{t('actions', selectedLanguage)}</p>
            </div>

            <div className="divide-y divide-stone-100 max-h-96 overflow-y-auto">
              {filteredListings.map((listing) => {
                const plot = plots.find((item) => item.id === listing.plotId);
                const listingBids = bidsCache[listing.id] || [];
                const pendingCount = listingBids.filter((bid) => bid.status === 'pending').length;

                return (
                  <div key={listing.id} className="grid grid-cols-[1.2fr_1fr_auto] gap-2 px-1 py-2 items-start">
                    <div className="min-w-0">
                      <p className="text-button text-stone-900">{listing.listingCode}</p>
                      <p className="truncate text-body text-stone-600">{plot?.name || 'Unknown Plot'}</p>
                      <span className={`mt-0.5 inline-flex rounded-full px-1.5 py-0.25 text-xs font-semibold ${statusClass(listing.status)}`}>
                        {statusLabel(listing.status, selectedLanguage)}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="text-button text-stone-800">{plot?.district || '-'}</p>
                      <p className="truncate text-body text-stone-600">{plot?.dsDivision || '-'}</p>
                      <p className="mt-0.5 text-caption text-stone-500">
                        {listing.financialTerms === 'cash_rent' ? `Rs ${listing.cashRentLkr || 0}` : listing.financialTerms === 'honey_share' ? `${listing.honeyShareKg || 0} kg` : 'Barter'}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <ActionBtn label={t('view', selectedLanguage)} onClick={() => openView(listing)} icon={<Eye className="h-3.5 w-3.5" />} />
                      <ActionBtn label={t('edit', selectedLanguage)} onClick={() => openEdit(listing)} icon={<Pencil className="h-3.5 w-3.5" />} />
                      {listingBids.length > 0 && (
                        <ActionBtn
                          label={`${t('bids', selectedLanguage)} ${pendingCount > 0 ? `(${pendingCount})` : ''}`}
                          onClick={() => openBids(listing)}
                          icon={<HandCoins className="h-3.5 w-3.5" />}
                        />
                      )}
                      <ActionBtn
                        label={t('delete', selectedLanguage)}
                        onClick={() => setConfirmDelete(listing.id)}
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                        danger
                      />
                    </div>
                  </div>
                );
              })}

              {filteredListings.length === 0 && (
                <div className="px-2 py-6 text-center text-body text-stone-500">{t('noListingsToShow', selectedLanguage)}</div>
              )}
            </div>
          </section>
        )}

        <ContractsSection contracts={contracts} onRespond={handleMoveOutResponse} saving={saving} selectedLanguage={selectedLanguage} />
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete !== null && (
        <div className="absolute inset-0 z-50 bg-black/50 px-3 py-6 flex items-center justify-center" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-xl p-4 shadow-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-stone-900">{t('deleteListing', selectedLanguage)}</h3>
            <p className="mt-2 text-sm text-stone-600">{t('deleteListingConfirm', selectedLanguage)}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg border border-stone-300 bg-white py-2 text-sm font-semibold text-stone-700"
                disabled={saving}
              >
                {t('cancel', selectedLanguage)}
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="rounded-lg bg-red-600 py-2 text-sm font-semibold text-white inline-flex items-center justify-center gap-2"
                disabled={saving}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('delete', selectedLanguage)}
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditorOpen && (
        <div className="absolute inset-0 z-50 bg-black/50 px-3 py-6" onClick={closeEditor}>
          <div className="mx-auto max-w-sm rounded-xl bg-white p-3 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-stone-900">
                {editorMode === 'create' ? t('createListing', selectedLanguage) : editorMode === 'edit' ? t('editListing', selectedLanguage) : t('viewListing', selectedLanguage)}
              </h2>
              <button onClick={closeEditor} className="rounded-lg p-1 hover:bg-stone-100">
                <X className="h-4.5 w-4.5 text-stone-500" />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-stone-500">{t('selectPlot', selectedLanguage)}</span>
                <select
                  disabled={editorMode === 'view'}
                  value={form.plotId}
                  onChange={(event) => setForm((prev) => ({ ...prev, plotId: Number(event.target.value) || 0 }))}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm disabled:bg-stone-100"
                >
                  <option value={0}>{t('selectPlot', selectedLanguage)}</option>
                  {plots.map((plot) => (
                    <option key={plot.id} value={plot.id}>{plot.name}</option>
                  ))}
                </select>
              </label>

{selectedPlot && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                  <p className="text-xs font-semibold text-emerald-900">{t('plotSummary', selectedLanguage)}</p>
                  <p className="mt-1 text-sm text-stone-700">{selectedPlot.name}</p>
                  <p className="text-xs text-stone-600 inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{selectedPlot.district} / {selectedPlot.dsDivision}</p>
                  <p className="text-xs text-stone-600 mt-0.5">{t('water', selectedLanguage)}: {selectedPlot.waterAvailability}</p>
                  <p className="text-xs text-stone-600 mt-0.5">Acreage: {selectedPlot.totalAcreage?.toFixed(1) ?? 'N/A'} acres</p>
                  <p className="text-xs text-stone-600 mt-0.5">{t('vehicleAccess', selectedLanguage)}: {selectedPlot.vehicleAccess ?? 'N/A'}</p>
                  <p className="text-xs text-stone-600 mt-1">
                    Forage: {(selectedPlot.forageEntries ?? [])[0]?.name ?? 'N/A'}
                    {((selectedPlot.forageEntries ?? [])[1]) && `, ${selectedPlot.forageEntries[1].name}`}
                  </p>
                </div>
              )}

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-stone-500">{t('financialTerms', selectedLanguage)}</span>
                <select
                  disabled={editorMode === 'view'}
                  value={form.financialTerms}
                  onChange={(event) => setForm((prev) => ({ ...prev, financialTerms: event.target.value as FinancialTerms }))}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm disabled:bg-stone-100"
                >
                  <option value="cash_rent">{t('cashRent', selectedLanguage)}</option>
                  <option value="honey_share">{t('honeyShare', selectedLanguage)}</option>
                  <option value="pollination_service">{t('pollinationService', selectedLanguage)}</option>
                </select>
              </label>

              {form.financialTerms === 'cash_rent' && (
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-stone-500">{t('lkrPerMonth', selectedLanguage)}</span>
                  <input
                    disabled={editorMode === 'view'}
                    value={form.cashRentLkr}
                    onChange={(event) => setForm((prev) => ({ ...prev, cashRentLkr: event.target.value }))}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm disabled:bg-stone-100"
                  />
                </label>
              )}

              {form.financialTerms === 'honey_share' && (
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-stone-500">{t('honeyShareKg', selectedLanguage)}</span>
                  <input
                    disabled={editorMode === 'view'}
                    value={form.honeyShareKg}
                    onChange={(event) => setForm((prev) => ({ ...prev, honeyShareKg: event.target.value }))}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm disabled:bg-stone-100"
                  />
                </label>
              )}

              {form.financialTerms === 'pollination_service' && (
                <p className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700">
                  {t('freeBarterAgreement', selectedLanguage)}
                </p>
              )}

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-stone-500">{t('availabilityEndDate', selectedLanguage)}</span>
                <input
                  disabled={editorMode === 'view'}
                  type="date"
                  value={form.availabilityEndDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, availabilityEndDate: event.target.value }))}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm disabled:bg-stone-100"
                />
              </label>

              <label className="flex items-start gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5">
                <input
                  type="checkbox"
                  disabled={editorMode === 'view'}
                  checked={form.sprayingClauseAgreed}
                  onChange={(event) => setForm((prev) => ({ ...prev, sprayingClauseAgreed: event.target.checked }))}
                  className="mt-0.5"
                />
                <span className="text-sm text-stone-700">
                  {t('pesticideNotice', selectedLanguage)}
                </span>
              </label>
            </div>

            {editorMode !== 'view' && (
              <div className={`mt-3 ${form.listingId && listings.find((l) => l.id === form.listingId)?.status === 'published' ? 'grid grid-cols-1' : 'grid grid-cols-2'} gap-2`}>
                {(!form.listingId || listings.find((l) => l.id === form.listingId)?.status === 'draft') && (
                  <button
                    onClick={() => saveListing('draft')}
                    className="rounded-xl border border-stone-300 bg-white py-2.5 text-sm font-semibold text-stone-800 inline-flex items-center justify-center gap-2"
                    disabled={saving}
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t('saveAsDraft', selectedLanguage)}
                  </button>
                )}
                <button
                  onClick={() => saveListing('published')}
                  className="rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white inline-flex items-center justify-center gap-2"
                  disabled={saving}
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('publish', selectedLanguage)}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isBidsOpen && activeListingForBids && (
        <div className="absolute inset-0 z-50 bg-black/50 px-3 py-6" onClick={() => setIsBidsOpen(false)}>
          <div className="mx-auto max-w-sm rounded-2xl bg-white p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-[1rem] font-bold text-stone-900">{t('incomingBids', selectedLanguage)}</h2>
              <button onClick={() => setIsBidsOpen(false)} className="rounded-lg p-1 hover:bg-stone-100">
                <X className="h-4.5 w-4.5 text-stone-500" />
              </button>
            </div>

            <div className="mt-3 max-h-[70vh] space-y-2.5 overflow-y-auto pr-1">
              {activeBids.map((bid) => (
                <div key={bid.id} className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[0.9rem] font-bold text-stone-900 inline-flex items-center gap-1">
                        {bid.beekeeperName}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[0.7rem] font-semibold ${bidStatusClass(bid.status)}`}>{bid.status}</span>
                  </div>

                  <div className="mt-2 text-[0.8rem] text-stone-700 space-y-0.5">
                    {bid.fullName && <p>{bid.fullName}</p>}

                    {(bid.beekeepingNature || bid.trainingLevel) && (
                      <p>
                        {[bid.beekeepingNature, bid.trainingLevel].filter(Boolean).join(' · ')}
                      </p>
                    )}

                    {(bid.primaryBeeSpecies || bid.district) && (
                      <p>
                        {[bid.primaryBeeSpecies, bid.district].filter(Boolean).join(' · ')}
                      </p>
                    )}

                    {(bid.hivesProposed > 0 || bid.placementStartDate || bid.placementEndDate) && (
                      <p>
                        {t('proposed', selectedLanguage)} {bid.hivesProposed} {t('hives', selectedLanguage)}
                        {(bid.placementStartDate || bid.placementEndDate) && (
                          <> · {bid.placementStartDate} {t('to', selectedLanguage)} {bid.placementEndDate}</>
                        )}
                      </p>
                    )}

                    <p>{t('submitted', selectedLanguage)} {new Date(bid.submittedAt).toLocaleDateString()}</p>
                    {bid.note && <p className="text-stone-600">{t('note', selectedLanguage)} {bid.note}</p>}
                  </div>

                  {bid.status === 'pending' && (
                    <div className="mt-2.5 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleAcceptBid(bid.id)}
                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-700 py-2 text-[0.78rem] font-semibold text-white"
                        disabled={saving}
                      >
                        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        <Check className="h-3.5 w-3.5" />
                        {t('accept', selectedLanguage)}
                      </button>
                      <button
                        onClick={() => handleRejectBid(bid.id)}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-300 bg-white py-2 text-[0.78rem] font-semibold text-red-700"
                        disabled={saving}
                      >
                        <X className="h-3.5 w-3.5" />
                        {t('reject', selectedLanguage)}
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {activeBids.length === 0 && <p className="text-[0.74rem] text-stone-500 text-center py-4">{t('noBidsYet', selectedLanguage)}</p>}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function ActionBtn({
  label,
  onClick,
  icon,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  icon: ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1 rounded-md border text-xs font-medium py-1.5 px-2.5 min-h-[28px] transition-colors ${
        danger ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100' : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ContractsSection({
  contracts,
  onRespond,
  saving,
  selectedLanguage,
}: {
  contracts: Contract[];
  onRespond: (contractId: number, approve: boolean) => void;
  saving: boolean;
  selectedLanguage: Language;
}) {
  const formatPaymentTerms = (contract: Contract) => {
    if (contract.financial_terms === 'cash_rent') {
      return `${t('cashRentRs', selectedLanguage)} ${contract.cash_rent_lkr || 0}`;
    }
    if (contract.financial_terms === 'honey_share') {
      return `${t('honeyShareKgLabel', selectedLanguage)} · ${contract.honey_share_kgs || 0} ${t('kg', selectedLanguage)}`;
    }
    if (contract.financial_terms === 'pollination_service') {
      return t('pollinationServiceLabel', selectedLanguage);
    }
    return t('paymentTermsNotSet', selectedLanguage);
  };

  return (
    <section className="rounded-2xl border border-stone-200 bg-white px-2 py-2 shadow-sm">
      <h2 className="px-1 text-[1rem] font-bold text-stone-900">{t('activeContracts', selectedLanguage)}</h2>
      <div className="mt-2 divide-y divide-stone-100">
        {contracts.map((contract) => {
          console.log(contract);

          return (
          
          <div key={contract.id} className="px-1 py-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[0.9rem] font-bold text-stone-900">{contract.beekeeperName}</p>
                <p className="text-[0.82rem] text-stone-600">{contract.plotName} · {contract.hiveCount} {t('hives', selectedLanguage)}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[0.72rem] font-semibold ${contractStatusClass(contract.status)}`}>
                {contract.status === 'moving_out_requested' ? t('moveOutRequested', selectedLanguage) : contract.status}
              </span>
            </div>

            <p className="mt-1 text-[0.78rem] text-stone-500">{t('expiry', selectedLanguage)} {contract.expiryLabel}</p>
            <p className="mt-0.5 text-[0.78rem] text-stone-500">
              {t('payment', selectedLanguage)} {formatPaymentTerms(contract)}
            </p>

            {contract.status === 'moving_out_requested' && (
              <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-2">
                <p className="text-[0.76rem] font-semibold text-amber-800">{t('moveOutRequested', selectedLanguage)}</p>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onRespond(contract.id, true)}
                    className="rounded-lg bg-emerald-700 py-2 text-[0.78rem] font-semibold text-white inline-flex items-center justify-center gap-1"
                    disabled={saving}
                  >
                    {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {t('approveMoveOut', selectedLanguage)}
                  </button>
                  <button
                    onClick={() => onRespond(contract.id, false)}
                    className="rounded-lg border border-stone-300 bg-white py-2 text-[0.78rem] font-semibold text-stone-700"
                    disabled={saving}
                  >
                    {t('decline', selectedLanguage)}
                  </button>
                </div>
              </div>
            )}
          </div>
          
        );
        
        })}  

        {contracts.length === 0 && <div className="px-1 py-4 text-[0.74rem] text-stone-500">{t('noActiveContracts', selectedLanguage)}</div>}
      </div>
    </section>
  );
}

function statusLabel(status: ListingStatus, selectedLanguage: Language = 'en') {
  if (status === 'draft') return t('draft', selectedLanguage);
  if (status === 'published') return t('published', selectedLanguage);
  if (status === 'accepted') return t('accepted', selectedLanguage);
  if (status === 'expired') return t('expired', selectedLanguage);
  return t('occupied', selectedLanguage);
}

function statusClass(status: ListingStatus) {
  if (status === 'draft') return 'bg-stone-100 text-stone-700';
  if (status === 'published') return 'bg-emerald-100 text-emerald-700';
  if (status === 'accepted') return 'bg-blue-100 text-blue-700';
  if (status === 'expired') return 'bg-amber-100 text-amber-800';
  return 'bg-emerald-700 text-white';
}

function bidStatusClass(status: 'pending' | 'accepted' | 'rejected') {
  if (status === 'pending') return 'bg-amber-100 text-amber-700';
  if (status === 'accepted') return 'bg-emerald-100 text-emerald-700';
  return 'bg-stone-200 text-stone-700';
}

function contractStatusClass(status: Contract['status']) {
  if (status === 'active') return 'bg-emerald-100 text-emerald-700';
  if (status === 'moving_out_requested') return 'bg-amber-100 text-amber-800';
  return 'bg-stone-200 text-stone-700';
}
