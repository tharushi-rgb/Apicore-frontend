import { useMemo, useState, type ReactNode } from 'react';
import {
  Check,
  Eye,
  FilePlus2,
  HandCoins,
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
  type Contract,
  type FinancialTerms,
  type Listing,
  type ListingStatus,
} from '../../services/landownerMarketplace';

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

  const [version, setVersion] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('create');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isBidsOpen, setIsBidsOpen] = useState(false);
  const [activeListingForBids, setActiveListingForBids] = useState<Listing | null>(null);
  const [listingSearch, setListingSearch] = useState('');
  const [listingStatusFilter, setListingStatusFilter] = useState<'all' | ListingStatus>('all');

  const plots = useMemo(() => {
    try {
      return landownerMarketplaceService.getPlots();
    } catch (error) {
      console.error('Failed to get plots:', error);
      return [];
    }
  }, [version]);

  const listings = useMemo(() => {
    try {
      const all = landownerMarketplaceService.getListings();
      if (!pendingFilterOnly) return all;
      return all.filter((listing) => landownerMarketplaceService.getBidsForListing(listing.id).some((bid) => bid.status === 'pending'));
    } catch (error) {
      console.error('Failed to get listings:', error);
      return [];
    }
  }, [version, pendingFilterOnly]);

  const filteredListings = useMemo(() => {
    const query = listingSearch.trim().toLowerCase();
    return listings.filter((listing) => {
      if (listingStatusFilter !== 'all' && listing.status !== listingStatusFilter) return false;
      if (!query) return true;
      const plot = plots.find((item) => item.id === listing.plotId);
      const terms = [
        listing.listingCode,
        plot?.name,
        plot?.district,
        plot?.dsDivision,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return terms.includes(query);
    });
  }, [listings, listingSearch, listingStatusFilter, plots]);

  const contracts = useMemo(() => {
    try {
      return landownerMarketplaceService.getContracts();
    } catch (error) {
      console.error('Failed to get contracts:', error);
      return [];
    }
  }, [version]);

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

  const openEdit = (listing: Listing) => {
    const bidCount = landownerMarketplaceService.getBidsForListing(listing.id).length;
    if (bidCount > 0) {
      setMessage({
        type: 'error',
        text: 'This listing cannot be edited as proposals have already been received',
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

  const openBids = (listing: Listing) => {
    setActiveListingForBids(listing);
    setIsBidsOpen(true);
  };

  const closeEditor = () => setIsEditorOpen(false);

  const handleDelete = (listingId: number) => {
    const confirmed = window.confirm('Delete this listing permanently?');
    if (!confirmed) return;

    try {
      landownerMarketplaceService.deleteListing(listingId);
      setVersion((value) => value + 1);
      setMessage({ type: 'success', text: 'Listing deleted successfully. Pending bids were rejected automatically.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Failed to delete listing' });
    }
  };

  const validateFormForPublish = () => {
    if (!form.plotId) return 'Select Plot is required';

    if (form.financialTerms === 'cash_rent') {
      const rentValue = Number(form.cashRentLkr);
      if (!Number.isFinite(rentValue) || rentValue <= 0) return 'LKR amount per month is required';
    }

    if (form.financialTerms === 'honey_share') {
      const honeyValue = Number(form.honeyShareKg);
      if (!Number.isFinite(honeyValue) || honeyValue <= 0) return 'Yield KG is required for Honey Share';
    }

    if (!form.sprayingClauseAgreed) {
      return 'You must agree to the pesticide notice clause before publishing';
    }

    return '';
  };

  const saveListing = (targetStatus: ListingStatus) => {
    setMessage(null);

    if (!form.plotId) {
      setMessage({ type: 'error', text: 'Select Plot is required' });
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

    try {
      if (editorMode === 'edit' && form.listingId) {
        landownerMarketplaceService.updateListing(form.listingId, payload);
        setMessage({ type: 'success', text: `Listing updated as ${targetStatus === 'draft' ? 'Draft' : 'Published'}` });
      } else {
        landownerMarketplaceService.createListing(payload);
        setMessage({ type: 'success', text: targetStatus === 'draft' ? 'Listing saved as Draft' : 'Listing published successfully' });
      }

      setVersion((value) => value + 1);
      setIsEditorOpen(false);
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Failed to save listing' });
    }
  };

  const bids = activeListingForBids ? landownerMarketplaceService.getBidsForListing(activeListingForBids.id) : [];

  const handleAcceptBid = (bidId: number) => {
    if (!activeListingForBids) return;

    try {
      landownerMarketplaceService.acceptBid(activeListingForBids.id, bidId);
      setVersion((value) => value + 1);
      setMessage({ type: 'success', text: 'Bid accepted. Listing and contract updated.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Failed to accept bid' });
    }
  };

  const handleRejectBid = (bidId: number) => {
    if (!activeListingForBids) return;

    try {
      landownerMarketplaceService.rejectBid(activeListingForBids.id, bidId);
      setVersion((value) => value + 1);
      setMessage({ type: 'success', text: 'Bid rejected and removed.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Failed to reject bid' });
    }
  };

  const handleMoveOutResponse = (contractId: number, approve: boolean) => {
    try {
      landownerMarketplaceService.respondMoveOut(contractId, approve);
      setVersion((value) => value + 1);
      setMessage({
        type: 'success',
        text: approve
          ? 'Move-out approved. Contract marked as Completed. Both parties can leave reviews.'
          : 'Move-out request declined. Contract stays active.',
      });
    } catch (error) {
      console.error('Failed to update move-out request:', error);
      setMessage({ type: 'error', text: 'Failed to update move-out request' });
    }
  };

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

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-4">
        <section className="rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-base font-extrabold text-stone-900">Listings</h1>
              <p className="mt-1 text-sm text-stone-600">
                {pendingFilterOnly ? 'Pending bids only' : 'Create, publish, and manage your land listings'}
              </p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              <FilePlus2 className="h-4 w-4" />
              Create Listing
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
            <p className="text-sm font-semibold text-stone-800">You need at least one saved plot to create a listing</p>
            <button
              onClick={() => onNavigate('profile')}
              className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-700 px-3 py-1.5 text-xs font-semibold text-emerald-800"
            >
              Go to My Lands
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
                  placeholder="Search listing, plot, or location"
                  className="w-full rounded-lg border border-stone-300 bg-white py-1.5 pl-8 pr-3 text-[0.75rem] text-stone-700 focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <select
                value={listingStatusFilter}
                onChange={(event) => setListingStatusFilter(event.target.value as typeof listingStatusFilter)}
                className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-[0.75rem] text-stone-700 focus:border-emerald-600 focus:outline-none"
              >
                <option value="all">Any status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="accepted">Accepted</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div className="grid grid-cols-[1.2fr_1fr_auto] gap-2 border-b border-stone-200 px-1 pb-1">
              <p className="text-caption uppercase tracking-[0.05em] text-stone-500">Listing</p>
              <p className="text-caption uppercase tracking-[0.05em] text-stone-500">Location</p>
              <p className="text-caption uppercase tracking-[0.05em] text-stone-500 text-right">Actions</p>
            </div>

            <div className="divide-y divide-stone-100 max-h-96 overflow-y-auto">
              {filteredListings.map((listing) => {
                const plot = plots.find((item) => item.id === listing.plotId);
                const listingBids = landownerMarketplaceService.getBidsForListing(listing.id);
                const pendingCount = listingBids.filter((bid) => bid.status === 'pending').length;

                return (
                  <div key={listing.id} className="grid grid-cols-[1.2fr_1fr_auto] gap-2 px-1 py-2 items-start">
                    <div className="min-w-0">
                      <p className="text-button text-stone-900">{listing.listingCode}</p>
                      <p className="truncate text-body text-stone-600">{plot?.name || 'Unknown Plot'}</p>
                      <span className={`mt-0.5 inline-flex rounded-full px-1.5 py-0.25 text-xs font-semibold ${statusClass(listing.status)}`}>
                        {statusLabel(listing.status)}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="text-button text-stone-800">{plot?.district || '-'}</p>
                      <p className="truncate text-body text-stone-600">{plot?.dsDivision || '-'}</p>
                      <p className="mt-0.5 text-caption text-stone-500">
                        {listing.financialTerms === 'cash_rent' ? `Rs ${listing.cashRentLkr || 0}` : listing.financialTerms === 'honey_share' ? `${listing.honeyShareKg || 0} kg` : 'Barter'}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-tight">
                      <ActionBtn label="View" onClick={() => openView(listing)} icon={<Eye className="h-3.5 w-3.5" />} />
                      <ActionBtn label="Edit" onClick={() => openEdit(listing)} icon={<Pencil className="h-3.5 w-3.5" />} />
                      {listingBids.length > 0 && (
                        <ActionBtn
                          label={`Bids ${pendingCount > 0 ? `(${pendingCount})` : ''}`}
                          onClick={() => openBids(listing)}
                          icon={<HandCoins className="h-3.5 w-3.5" />}
                        />
                      )}
                      <ActionBtn
                        label="Delete"
                        onClick={() => handleDelete(listing.id)}
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                        danger
                      />
                    </div>
                  </div>
                );
              })}

              {filteredListings.length === 0 && (
                <div className="px-2 py-6 text-center text-body text-stone-500">No listings to show.</div>
              )}
            </div>
          </section>
        )}

        <ContractsSection contracts={contracts} onRespond={handleMoveOutResponse} />
      </div>

      {isEditorOpen && (
        <div className="absolute inset-0 z-50 bg-black/50 px-3 py-6" onClick={closeEditor}>
          <div className="mx-auto max-w-sm rounded-xl bg-white p-3 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-stone-900">
                {editorMode === 'create' ? 'Create Listing' : editorMode === 'edit' ? 'Edit Listing' : 'View Listing'}
              </h2>
              <button onClick={closeEditor} className="rounded-lg p-1 hover:bg-stone-100">
                <X className="h-4.5 w-4.5 text-stone-500" />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-stone-500">Select Plot *</span>
                <select
                  disabled={editorMode === 'view'}
                  value={form.plotId}
                  onChange={(event) => setForm((prev) => ({ ...prev, plotId: Number(event.target.value) || 0 }))}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm disabled:bg-stone-100"
                >
                  <option value={0}>Select Plot</option>
                  {plots.map((plot) => (
                    <option key={plot.id} value={plot.id}>{plot.name}</option>
                  ))}
                </select>
              </label>

              {selectedPlot && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                  <p className="text-xs font-semibold text-emerald-900">Plot Summary</p>
                  <p className="mt-1 text-sm text-stone-700">{selectedPlot.name}</p>
                  <p className="text-xs text-stone-600 inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{selectedPlot.district} / {selectedPlot.dsDivision}</p>
                  <p className="text-xs text-stone-600 mt-0.5">Water: {selectedPlot.waterAvailability}</p>
                </div>
              )}

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-stone-500">Financial Terms *</span>
                <select
                  disabled={editorMode === 'view'}
                  value={form.financialTerms}
                  onChange={(event) => setForm((prev) => ({ ...prev, financialTerms: event.target.value as FinancialTerms }))}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm disabled:bg-stone-100"
                >
                  <option value="cash_rent">Cash Rent</option>
                  <option value="honey_share">Honey Share</option>
                  <option value="pollination_service">Pollination Service</option>
                </select>
              </label>

              {form.financialTerms === 'cash_rent' && (
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-stone-500">LKR Per Month *</span>
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
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-stone-500">Honey Share KG *</span>
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
                  Free - Barter Agreement
                </p>
              )}

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-stone-500">Availability End Date</span>
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
                  I agree to provide beekeepers with 48-hour notice before any pesticide or chemical spraying on this land.
                </span>
              </label>
            </div>

            {editorMode !== 'view' && (
              <div className={`mt-3 ${form.listingId && listings.find((l) => l.id === form.listingId)?.status === 'published' ? 'grid grid-cols-1' : 'grid grid-cols-2'} gap-2`}>
                {(!form.listingId || listings.find((l) => l.id === form.listingId)?.status === 'draft') && (
                  <button
                    onClick={() => saveListing('draft')}
                    className="rounded-xl border border-stone-300 bg-white py-2.5 text-sm font-semibold text-stone-800"
                  >
                    Save as Draft
                  </button>
                )}
                <button
                  onClick={() => saveListing('published')}
                  className="rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white"
                >
                  Publish
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
              <h2 className="text-[1rem] font-bold text-stone-900">Incoming Bids</h2>
              <button onClick={() => setIsBidsOpen(false)} className="rounded-lg p-1 hover:bg-stone-100">
                <X className="h-4.5 w-4.5 text-stone-500" />
              </button>
            </div>

            <div className="mt-3 max-h-[70vh] space-y-2.5 overflow-y-auto pr-1">
              {bids.map((bid) => (
                <div key={bid.id} className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[0.9rem] font-bold text-stone-900 inline-flex items-center gap-1">
                        {bid.beekeeperName}
                        {bid.verified && <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />}
                      </p>
                      <p className="text-[0.78rem] text-stone-600">Rating {bid.rating.toFixed(1)} · {bid.reviews} reviews</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[0.7rem] font-semibold ${bidStatusClass(bid.status)}`}>{bid.status}</span>
                  </div>

                  <div className="mt-2 text-[0.8rem] text-stone-700 space-y-0.5">
                    <p>{bid.fullName}</p>
                    <p>{bid.beekeepingNature} · {bid.trainingLevel}</p>
                    <p>{bid.primaryBeeSpecies} · {bid.district}</p>
                    <p>Previous listings: {bid.previousListings}</p>
                    <p>Proposed: {bid.hivesProposed} hives · {bid.placementStartDate} to {bid.placementEndDate}</p>
                    <p>Submitted: {new Date(bid.submittedAt).toLocaleDateString()}</p>
                    {bid.note && <p className="text-stone-600">Note: {bid.note}</p>}
                  </div>

                  {bid.status === 'pending' && (
                    <div className="mt-2.5 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleAcceptBid(bid.id)}
                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-700 py-2 text-[0.78rem] font-semibold text-white"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectBid(bid.id)}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-300 bg-white py-2 text-[0.78rem] font-semibold text-red-700"
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {bids.length === 0 && <p className="text-[0.74rem] text-stone-500 text-center py-4">No bids yet for this listing.</p>}
            </div>
          </div>
        </div>
      )}
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
      className={`btn-compact inline-flex items-center justify-center gap-1 rounded-full border min-h-9 px-4 ${
        danger ? 'border-red-300 bg-red-50 text-red-700' : 'border-emerald-300 bg-emerald-50 text-emerald-700'
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
}: {
  contracts: Contract[];
  onRespond: (contractId: number, approve: boolean) => void;
}) {
  const formatPaymentTerms = (contract: Contract) => {
    if (contract.financial_terms === 'cash_rent') {
      return `Cash rent · Rs ${contract.cash_rent_lkr || 0}`;
    }
    if (contract.financial_terms === 'honey_share') {
      return `Honey share · ${contract.honey_share_kgs || 0} kg`;
    }
    if (contract.financial_terms === 'pollination_service') {
      return 'Pollination service';
    }
    return 'Payment terms not set';
  };

  const formatOngoingDays = (contract: Contract) => {
    const bid = landownerMarketplaceService
      .getBidsForListing(contract.listingId)
      .find((item) => item.id === contract.bidId);
    if (!bid?.placementStartDate) return '-';
    const startDate = new Date(bid.placementStartDate);
    if (Number.isNaN(startDate.getTime())) return '-';
    const diffMs = Date.now() - startDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return `${Math.max(0, diffDays)} days`;
  };

  return (
    <section className="rounded-2xl border border-stone-200 bg-white px-2 py-2 shadow-sm">
      <h2 className="px-1 text-[1rem] font-bold text-stone-900">Active Contracts</h2>
      <div className="mt-2 divide-y divide-stone-100">
        {contracts.map((contract) => (
          <div key={contract.id} className="px-1 py-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[0.9rem] font-bold text-stone-900">{contract.beekeeperName}</p>
                <p className="text-[0.82rem] text-stone-600">{contract.plotName} · {contract.hiveCount} hives</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[0.72rem] font-semibold ${contractStatusClass(contract.status)}`}>
                {contract.status === 'moving_out_requested' ? 'Move-Out Requested' : contract.status}
              </span>
            </div>

            <p className="mt-1 text-[0.78rem] text-stone-500">Expiry: {contract.expiryLabel}</p>
            <p className="mt-0.5 text-[0.78rem] text-stone-500">
              Payment: {formatPaymentTerms(contract)} · Ongoing: {formatOngoingDays(contract)}
            </p>

            {contract.status === 'moving_out_requested' && (
              <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-2">
                <p className="text-[0.76rem] font-semibold text-amber-800">Move-Out Requested</p>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onRespond(contract.id, true)}
                    className="rounded-lg bg-emerald-700 py-2 text-[0.78rem] font-semibold text-white"
                  >
                    Approve Move-Out
                  </button>
                  <button
                    onClick={() => onRespond(contract.id, false)}
                    className="rounded-lg border border-stone-300 bg-white py-2 text-[0.78rem] font-semibold text-stone-700"
                  >
                    Decline
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {contracts.length === 0 && <div className="px-1 py-4 text-[0.74rem] text-stone-500">No active contracts yet.</div>}
      </div>
    </section>
  );
}

function statusLabel(status: ListingStatus) {
  if (status === 'draft') return 'Draft';
  if (status === 'published') return 'Published';
  if (status === 'accepted') return 'Accepted';
  if (status === 'expired') return 'Expired';
  return 'Occupied';
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
