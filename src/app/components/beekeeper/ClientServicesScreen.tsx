import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  BadgeCheck,
  Droplets,
  Filter,
  Hourglass,
  Loader2,
  Moon,
  Search,
  ShieldCheck,
  Star,
  Sun,
  Truck,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileHeader } from '../shared/MobileHeader';
import { PageTitleBar } from '../shared/PageTitleBar';
import { authService } from '../../services/auth';
import {
  beekeeperListingsService,
  type ListingProposal,
  type ListingSummary,
} from '../../services/beekeeperListings';
import { t } from '../../i18n';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onNavigate: (tab: NavTab) => void;
  onLogout: () => void;
}

export function ClientServicesScreen({ selectedLanguage, onLanguageChange, onNavigate, onLogout }: Props) {
  const navigate = useNavigate();
  const user = authService.getLocalUser();

  const [tab, setTab] = useState<'find' | 'proposals'>('find');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [proposals, setProposals] = useState<ListingProposal[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedListing, setSelectedListing] = useState<ListingSummary | null>(null);
  const [listingReviews, setListingReviews] = useState<{ rating: number; comment: string; beekeeperName: string; createdAt: string }[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [confirmMoveOut, setConfirmMoveOut] = useState<ListingProposal | null>(null);

  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  const [filters, setFilters] = useState({
    distanceKm: 0,
    region: '',
    forageName: '',
    shadeProfiles: [] as string[],
    waterOnly: false,
    paymentModels: [] as string[],
  });

  const [proposalForm, setProposalForm] = useState({
    hiveCount: '',
    moveInDate: '',
    moveOutDate: '',
    note: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [listingsData, proposalsData] = await Promise.all([
        beekeeperListingsService.getPublishedListings(),
        beekeeperListingsService.getMyProposals(),
      ]);
      setListings(listingsData);
      setProposals(proposalsData);
      setError('');
    } catch (loadError: any) {
      setError(loadError?.message || t('failedToLoadListings', selectedLanguage));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const locationOptions = useMemo(() => {
    const values = new Set<string>();
    listings.forEach((listing) => {
      values.add(listing.district);
      values.add(listing.dsDivision);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [listings]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.distanceKm > 0) count += 1;
    if (filters.region.trim()) count += 1;
    if (filters.forageName.trim()) count += 1;
    if (filters.shadeProfiles.length) count += 1;
    if (filters.waterOnly) count += 1;
    if (filters.paymentModels.length) count += 1;
    return count;
  }, [filters]);

  const listingSearchTerm = search.trim().toLowerCase();

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      if (listingSearchTerm) {
        const searchable = [
          listing.listingCode,
          listing.plotName,
          listing.district,
          listing.dsDivision,
          listing.forageNames.join(' '),
        ]
          .join(' ')
          .toLowerCase();
        if (!searchable.includes(listingSearchTerm)) return false;
      }

      if (filters.region.trim()) {
        const regionSearch = filters.region.trim().toLowerCase();
        const locationText = `${listing.district} ${listing.dsDivision}`.toLowerCase();
        if (!locationText.includes(regionSearch)) return false;
      }

      if (filters.forageName.trim()) {
        const forageSearch = filters.forageName.trim().toLowerCase();
        if (!listing.forageNames.some((name) => name.toLowerCase().includes(forageSearch))) return false;
      }

      if (filters.shadeProfiles.length > 0 && !filters.shadeProfiles.includes(listing.shadeProfile)) {
        return false;
      }

      if (filters.waterOnly && !listing.hasWaterOnSite) return false;

      if (filters.paymentModels.length > 0 && !filters.paymentModels.includes(listing.financialTerms)) {
        return false;
      }

      if (filters.distanceKm > 0) {
        if (!myLocation) return false;
        const km = haversineKm(myLocation.lat, myLocation.lng, listing.coordinates.lat, listing.coordinates.lng);
        if (km > filters.distanceKm) return false;
      }

      return true;
    });
  }, [filters, listingSearchTerm, listings, myLocation]);

  const selectedProposal = useMemo(() => {
    if (!selectedListing) return undefined;
    return proposals.find((proposal) => (
      proposal.ownerUserId === selectedListing.ownerUserId
      && proposal.listingId === selectedListing.listingId
    ));
  }, [proposals, selectedListing]);

  const contractStats = useMemo(() => {
    const activeContracts = proposals.filter((proposal) => proposal.contractStatus === 'active' || proposal.contractStatus === 'moving_out_requested');
    const pendingBids = proposals.filter((proposal) => proposal.status === 'pending' && !proposal.contractStatus);
    const sumHives = (items: ListingProposal[]) => items.reduce((total, proposal) => total + (proposal.hiveCount || 0), 0);

    return {
      activeCount: activeContracts.length,
      activeHives: sumHives(activeContracts),
      pendingCount: pendingBids.length,
      pendingHives: sumHives(pendingBids),
    };
  }, [proposals]);

  const clearFilters = () => {
    setFilters({
      distanceKm: 0,
      region: '',
      forageName: '',
      shadeProfiles: [],
      waterOnly: false,
      paymentModels: [],
    });
    setLocationDenied(false);
  };

  const toggleMulti = (field: 'shadeProfiles' | 'paymentModels', value: string) => {
    setFilters((current) => {
      const exists = current[field].includes(value);
      return {
        ...current,
        [field]: exists ? current[field].filter((item) => item !== value) : [...current[field], value],
      };
    });
  };

  const requestDistanceFilter = (distanceKm: number) => {
    if (distanceKm === 0) {
      setFilters((current) => ({ ...current, distanceKm: 0 }));
      return;
    }
    if (myLocation) {
      setFilters((current) => ({ ...current, distanceKm }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMyLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationDenied(false);
        setFilters((current) => ({ ...current, distanceKm }));
      },
      () => {
        setLocationDenied(true);
        setFilters((current) => ({ ...current, distanceKm: 0 }));
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const openListing = async (listing: ListingSummary) => {
    setSelectedListing(listing);
    setProposalForm({ hiveCount: '', moveInDate: '', moveOutDate: '', note: '' });
    setSuccess('');
    setError('');
    setReviewsLoading(true);
    try {
      const detail = await beekeeperListingsService.getListingDetail(listing.ownerUserId, listing.listingId);
      setListingReviews(detail.reviews.map((review) => ({
        rating: review.rating,
        comment: review.comment,
        beekeeperName: review.beekeeperName,
        createdAt: review.createdAt,
      })));
    } catch (detailError: any) {
      setListingReviews([]);
      setError(detailError?.message || 'Failed to load listing details');
    } finally {
      setReviewsLoading(false);
    }
  };

  const onSubmitProposal = async () => {
    if (!selectedListing) return;
    const hiveCount = Number(proposalForm.hiveCount);
    if (!Number.isFinite(hiveCount) || hiveCount <= 0) {
      setError(t('hiveCountMandatory', selectedLanguage));
      return;
    }
    if (!proposalForm.moveInDate || !proposalForm.moveOutDate) {
      setError('Placement dates are mandatory');
      return;
    }
    if (proposalForm.moveInDate > proposalForm.moveOutDate) {
      setError('Move-out date must be after move-in date');
      return;
    }

    const remaining = selectedListing.maxHiveCapacity - selectedListing.acceptedHiveCount;
    if (hiveCount > remaining) {
      setError(`Hive count cannot exceed remaining capacity (${remaining})`);
      return;
    }

    setSaving(true);
    try {
      await beekeeperListingsService.submitProposal({
        ownerUserId: selectedListing.ownerUserId,
        listingId: selectedListing.listingId,
        hiveCount,
        moveInDate: proposalForm.moveInDate,
        moveOutDate: proposalForm.moveOutDate,
        note: proposalForm.note,
      });
      await loadData();
      setSelectedListing(null); // Close the modal
      setError('');
      setSuccess('Your proposal has been submitted. You will be notified once the landowner responds.');
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (submitError: any) {
      setError(submitError?.message || 'Failed to submit proposal');
    } finally {
      setSaving(false);
    }
  };

  const onRequestMoveOut = async (proposal: ListingProposal) => {
    if (!proposal.contractId) return;
    setSaving(true);
    try {
      await beekeeperListingsService.requestMoveOut(proposal.ownerUserId, proposal.contractId);
      await loadData();
      setSuccess('Move-out request sent to landowner. Awaiting approval.');
      setError('');
      setConfirmMoveOut(null);
    } catch (moveOutError: any) {
      setError(moveOutError?.message || 'Failed to request move-out');
    } finally {
      setSaving(false);
    }
  };

  const runSuitability = (listing: ListingSummary) => {
    navigate('/planning', {
      state: {
        prefillCoordinates: {
          lat: listing.coordinates.lat,
          lng: listing.coordinates.lng,
          district: listing.district,
          dsDivision: listing.dsDivision,
        },
      },
    });
  };

  return (
    <div className="h-[100dvh] bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 relative overflow-hidden flex flex-col">
      <div className="bg-white shadow-sm sticky top-0 z-30">
        <MobileHeader
          userName={user?.name}
          roleLabel={user?.role}
          selectedLanguage={selectedLanguage}
          onLanguageChange={onLanguageChange}
          activeTab="clients"
          onNavigate={onNavigate}
          onLogout={onLogout}
          onViewAllNotifications={() => onNavigate('notifications')}
        />
        <PageTitleBar title={t('findLand', selectedLanguage)} subtitle={t('browsePlots', selectedLanguage)} />
      </div>

      <div className="px-4 py-3 grid grid-cols-2 gap-2">
        <button onClick={() => setTab('find')} className={`rounded-xl py-2 text-[0.8rem] font-semibold ${tab === 'find' ? 'bg-amber-500 text-white' : 'bg-white text-stone-700 border border-stone-200'}`}>
          {t('findLand', selectedLanguage)}
        </button>
        <button onClick={() => setTab('proposals')} className={`rounded-xl py-2 text-[0.8rem] font-semibold ${tab === 'proposals' ? 'bg-amber-500 text-white' : 'bg-white text-stone-700 border border-stone-200'}`}>
          {t('myProposals', selectedLanguage)}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-3">
        {error && <p className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-[0.72rem] font-medium">{error}</p>}
        {success && <p className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 text-[0.72rem] font-medium">{success}</p>}

        {tab === 'find' && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-3 py-2.5 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between text-[0.74rem] text-emerald-800 font-semibold">
                  <span>{t('activeContracts', selectedLanguage)}</span>
                  <BadgeCheck className="w-4 h-4" />
                </div>
                <p className="text-[1rem] font-bold text-emerald-900 leading-tight">{contractStats.activeCount}</p>
                <p className="text-[0.72rem] text-emerald-700">{contractStats.activeHives} {t('hivesPlacedCount', selectedLanguage)}</p>
              </div>
              <div className="rounded-2xl bg-amber-50 border border-amber-100 px-3 py-2.5 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between text-[0.74rem] text-amber-800 font-semibold">
                  <span>{t('pendingBidsCount', selectedLanguage)}</span>
                  <Hourglass className="w-4 h-4" />
                </div>
                <p className="text-[1rem] font-bold text-amber-900 leading-tight">{contractStats.pendingCount}</p>
                <p className="text-[0.72rem] text-amber-700">{contractStats.pendingHives} {t('hivesRequestedCount', selectedLanguage)}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:border-amber-500 focus:outline-none" placeholder={t('searchListingPlotLocation', selectedLanguage)} />
              </div>
              <button onClick={() => setShowFilters(true)} className="relative bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm inline-flex items-center gap-1">
                <Filter className="w-4 h-4" />
                {t('filter', selectedLanguage)}
                {activeFilterCount > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 rounded-full bg-amber-500 text-white text-[0.65rem] font-bold inline-flex items-center justify-center px-1">{activeFilterCount}</span>}
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>
            ) : filteredListings.length === 0 ? (
              <p className="text-center text-stone-500 py-8 text-sm">{t('noPublishedListingsMatch', selectedLanguage)}</p>
            ) : (
              <div className="space-y-3">
                {filteredListings.map((listing) => (
                  <div key={listing.id} className="rounded-2xl bg-white border border-stone-200 shadow-sm overflow-hidden">
                    <div className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[0.68rem] text-stone-500">{listing.listingCode}</p>
                          <h3 className="text-[0.88rem] font-bold text-stone-800">{listing.plotName}</h3>
                          <p className="text-[0.72rem] text-stone-600">{listing.district} · {listing.dsDivision}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[0.8rem] font-bold text-emerald-700">{listing.paymentLabel}</p>
                          <p className="text-[0.68rem] text-stone-600 inline-flex items-center gap-1 justify-end"><Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" /> {listing.ownerRating}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-stone-600">
                        <AmenityIcon title={listing.shadeProfile} icon={<Sun className="w-3.5 h-3.5" />} />
                        {listing.hasWaterOnSite && <AmenityIcon title="On-site water" icon={<Droplets className="w-3.5 h-3.5" />} />}
                        <AmenityIcon title={listing.vehicleAccess} icon={<Truck className="w-3.5 h-3.5" />} />
                        {listing.nightAccess && <AmenityIcon title="Night access" icon={<Moon className="w-3.5 h-3.5" />} />}
                        {listing.userProposalStatus !== 'none' ? (
                          <span className={`ml-auto inline-flex items-center gap-1 text-[0.65rem] font-medium ${
                            listing.userProposalStatus === 'accepted' ? 'text-emerald-700' :
                            listing.userProposalStatus === 'pending' ? 'text-amber-700' :
                            'text-red-700'
                          }`}>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Proposal {listing.userProposalStatus}
                          </span>
                        ) : listing.ownerVerified && (
                          <span className="ml-auto inline-flex items-center gap-1 text-[0.65rem] font-medium text-emerald-700">
                            <ShieldCheck className="w-3.5 h-3.5" /> {t('verified', selectedLanguage)}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button onClick={() => openListing(listing)} className="rounded-xl border border-stone-300 py-2 text-[0.74rem] font-semibold text-stone-700">{t('view', selectedLanguage)}</button>
                        <button onClick={() => runSuitability(listing)} className="rounded-xl bg-emerald-600 py-2 text-[0.74rem] font-semibold text-white">{t('checkSuitability', selectedLanguage)}</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'proposals' && (
          <section className="rounded-2xl bg-white border border-stone-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-[0.95fr_1.05fr_0.95fr_0.85fr] gap-2 px-2.5 py-2 border-b border-stone-200 bg-stone-50 text-[0.62rem] font-bold uppercase tracking-wide text-stone-500">
              <p>Hive Count</p>
              <p>Dates</p>
              <p>Submitted</p>
              <p>Status</p>
            </div>

            <div className="divide-y divide-stone-100">
              {proposals.map((proposal) => (
                <div key={`${proposal.ownerUserId}-${proposal.listingId}-${proposal.bidId}`} className="px-2.5 py-2.5 space-y-2">
                  <div className="grid grid-cols-[0.95fr_1.05fr_0.95fr_0.85fr] gap-2 text-[0.7rem] text-stone-700">
                    <p className="font-semibold">{proposal.hiveCount} hives</p>
                    <p>{proposal.moveInDate} to {proposal.moveOutDate}</p>
                    <p>{new Date(proposal.submittedAt).toLocaleDateString()}</p>
                    <p><span className={`inline-flex rounded-full px-2 py-0.5 text-[0.62rem] font-semibold ${proposalStatusClass(proposal.status)}`}>{proposal.status}</span></p>
                  </div>

                  <p className="text-[0.68rem] text-stone-500">{proposal.listingCode} · {proposal.plotName} · {proposal.district} / {proposal.dsDivision}</p>

                  {proposal.status === 'accepted' && (
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => navigate('/apiaries/new', { state: { prefillApiary: proposal } })} className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-[0.68rem] font-semibold text-emerald-700">Go to My Apiary</button>

                      {proposal.contractStatus === 'active' && proposal.contractId && (
                        <button onClick={() => setConfirmMoveOut(proposal)} className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[0.68rem] font-semibold text-amber-700">Request Move-Out</button>
                      )}

                      {proposal.contractStatus === 'moving_out_requested' && (
                        <button disabled className="rounded-lg border border-stone-300 bg-stone-100 px-2.5 py-1.5 text-[0.68rem] font-semibold text-stone-500">Move-Out Requested - Awaiting Landowner Approval</button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {proposals.length === 0 && <p className="text-center text-stone-500 py-10 text-sm">No proposals submitted yet.</p>}
            </div>
          </section>
        )}
      </div>

      {/* Move-Out Confirmation Modal */}
      {confirmMoveOut && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={() => setConfirmMoveOut(null)}>
          <div className="bg-white rounded-xl p-4 shadow-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-stone-900">Request Move-Out?</h3>
            <p className="mt-2 text-sm text-stone-600">This will send a move-out request to the landowner for this active contract.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => setConfirmMoveOut(null)}
                className="rounded-lg border border-stone-300 bg-white py-2 text-sm font-semibold text-stone-700"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={() => onRequestMoveOut(confirmMoveOut)}
                className="rounded-lg bg-amber-500 py-2 text-sm font-semibold text-white inline-flex items-center justify-center gap-2"
                disabled={saving}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showFilters && (
        <div className="absolute inset-0 bg-black/50 z-50 px-3 py-4" onClick={() => setShowFilters(false)}>
          <div className="bg-white rounded-2xl max-h-full overflow-y-auto p-3" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-[0.9rem] font-bold text-stone-800">Filters</h3>
              <button onClick={() => setShowFilters(false)} className="p-1 rounded-lg bg-stone-100"><X className="w-4 h-4" /></button>
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-stone-500 mb-1">Distance</p>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 5, 10, 50].map((km) => (
                    <button key={km} onClick={() => requestDistanceFilter(km)} className={`rounded-lg py-1.5 text-[0.68rem] font-semibold ${filters.distanceKm === km ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-700'}`}>
                      {km === 0 ? 'Any' : `${km}km`}
                    </button>
                  ))}
                </div>
                {locationDenied && <p className="text-[0.66rem] text-red-600 mt-1">Location permission is required for distance filter.</p>}
              </div>

              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-stone-500 mb-1">District / DS Division</p>
                <input value={filters.region} onChange={(event) => setFilters((current) => ({ ...current, region: event.target.value }))} list="listing-locations" placeholder="Search location" className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
                <datalist id="listing-locations">{locationOptions.map((option) => <option key={option} value={option} />)}</datalist>
              </div>

              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-stone-500 mb-1">Forage Name</p>
                <input value={filters.forageName} onChange={(event) => setFilters((current) => ({ ...current, forageName: event.target.value }))} placeholder="e.g. Rubber" className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
              </div>

              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-stone-500 mb-1">Shade Profile</p>
                <div className="flex flex-wrap gap-2">
                  {['Full Sun', 'Partial Shade', 'Full Shade'].map((label) => (
                    <button key={label} onClick={() => toggleMulti('shadeProfiles', label)} className={`rounded-full px-3 py-1.5 text-[0.68rem] font-semibold ${filters.shadeProfiles.includes(label) ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-700'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-[0.74rem] font-medium text-stone-700">
                <input type="checkbox" checked={filters.waterOnly} onChange={(event) => setFilters((current) => ({ ...current, waterOnly: event.target.checked }))} />
                Water Source: On-site only
              </label>

              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-stone-500 mb-1">Payment Model</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Cash Rent', value: 'cash_rent' },
                    { label: 'Honey Share', value: 'honey_share' },
                    { label: 'Pollination Service', value: 'pollination_service' },
                  ].map((item) => (
                    <button key={item.value} onClick={() => toggleMulti('paymentModels', item.value)} className={`rounded-full px-3 py-1.5 text-[0.68rem] font-semibold ${filters.paymentModels.includes(item.value) ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-700'}`}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={clearFilters} className="flex-1 rounded-xl border border-stone-300 py-2 text-[0.74rem] font-semibold text-stone-700">Clear All Filters</button>
                <button onClick={() => setShowFilters(false)} className="flex-1 rounded-xl bg-amber-500 py-2 text-[0.74rem] font-semibold text-white">Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedListing && (
        <div className="absolute inset-0 z-50 bg-black/50 p-2 flex items-start justify-center overflow-y-auto" onClick={() => { setSelectedListing(null); setError(''); }}>
          <div className="bg-white rounded-2xl max-h-full overflow-y-auto w-full max-w-2xl my-4" onClick={(event) => event.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-stone-200 px-3 py-2 flex items-center justify-between z-10">
              <h3 className="text-[0.88rem] font-bold text-stone-800">Listing Detail</h3>
              <button onClick={() => { setSelectedListing(null); setError(''); }} className="p-1 rounded-lg bg-stone-100"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-3 space-y-3">

              <section className="rounded-xl border border-stone-200 p-3">
                <p className="text-[0.68rem] text-stone-500">Plot</p>
                <h4 className="text-[0.92rem] font-bold text-stone-800">{selectedListing.plotName}</h4>
                <p className="text-[0.74rem] text-stone-600">{selectedListing.district} · {selectedListing.dsDivision}</p>
                <p className="mt-1 text-[0.74rem] text-emerald-700 font-semibold">{selectedListing.paymentLabel}</p>
              </section>

              <section className="rounded-xl border border-stone-200 p-3">
                <p className="text-[0.68rem] text-stone-500 mb-1">Landowner Profile</p>
                <p className="text-[0.84rem] font-bold text-stone-800 inline-flex items-center gap-1">
                  {selectedListing.ownerName}
                  {selectedListing.ownerVerified && <BadgeCheck className="w-4 h-4 text-emerald-600" />}
                </p>
                <p className="text-[0.72rem] text-stone-600 inline-flex items-center gap-1 mt-0.5"><Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" /> {selectedListing.ownerRating} - {selectedListing.ownerReviewCount} reviews</p>
                <p className="text-[0.72rem] text-stone-600 mt-0.5">Active on APICore: {selectedListing.ownerYearsActive} years</p>
                <p className="text-[0.72rem] text-stone-600 mt-0.5">Contact: {selectedListing.ownerContact}</p>
              </section>

              <section className="rounded-xl border border-stone-200 p-3">
                <p className="text-[0.68rem] text-stone-500 mb-1">Community Reviews</p>
                {reviewsLoading ? (
                  <p className="text-[0.74rem] text-stone-600">Loading reviews...</p>
                ) : listingReviews.length === 0 ? (
                  <p className="text-[0.74rem] text-stone-600">No reviews yet for this plot. Be the first to place your hives here.</p>
                ) : (
                  <div className="space-y-2">
                    {listingReviews.slice(0, 3).map((review, index) => (
                      <div key={`${review.beekeeperName}-${review.createdAt}-${index}`} className="rounded-lg bg-stone-50 border border-stone-200 px-2.5 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[0.72rem] font-semibold text-stone-800 truncate">{review.beekeeperName}</p>
                          <span className="inline-flex items-center gap-1 text-[0.7rem] text-amber-600 font-semibold">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" /> {review.rating.toFixed(1)}
                          </span>
                        </div>
                        <p className="text-[0.72rem] text-stone-600 mt-0.5">{review.comment}</p>
                        <p className="text-[0.64rem] text-stone-400 mt-0.5">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-stone-200 p-3 space-y-2">
                <p className="text-[0.68rem] text-stone-500">Submit Proposal</p>

                {/* Show error inside modal */}
                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-2.5 py-2 text-[0.72rem] font-medium">
                    {error}
                  </div>
                )}

                {selectedProposal?.status === 'pending' && <p className="rounded-lg bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-2 text-[0.72rem] font-semibold">Proposal Submitted - Pending Review</p>}
                {selectedProposal?.status === 'accepted' && <p className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-2 text-[0.72rem] font-semibold">Your proposal was accepted.</p>}
                {selectedProposal?.status === 'rejected' && <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-2.5 py-2 text-[0.72rem] font-semibold">Your last proposal was rejected.</p>}

                {selectedProposal?.status !== 'pending' && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-[0.7rem] text-stone-600">Hive Count *
                        <input type="number" value={proposalForm.hiveCount} onChange={(event) => setProposalForm((current) => ({ ...current, hiveCount: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-300 px-2.5 py-2 text-[0.75rem]" />
                      </label>
                      <div className="rounded-lg bg-stone-50 border border-stone-200 px-2 py-2 text-[0.68rem] text-stone-600 self-end">Remaining capacity: {selectedListing.maxHiveCapacity - selectedListing.acceptedHiveCount}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-[0.7rem] text-stone-600">Move-In *
                        <input type="date" value={proposalForm.moveInDate} onChange={(event) => setProposalForm((current) => ({ ...current, moveInDate: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-300 px-2.5 py-2 text-[0.75rem]" />
                      </label>
                      <label className="text-[0.7rem] text-stone-600">Move-Out *
                        <input type="date" value={proposalForm.moveOutDate} onChange={(event) => setProposalForm((current) => ({ ...current, moveOutDate: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-300 px-2.5 py-2 text-[0.75rem]" />
                      </label>
                    </div>

                    <label className="text-[0.7rem] text-stone-600 block">Note to Landowner
                      <textarea rows={3} value={proposalForm.note} onChange={(event) => setProposalForm((current) => ({ ...current, note: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-300 px-2.5 py-2 text-[0.75rem]" placeholder="Optional message" />
                    </label>

                    <button onClick={onSubmitProposal} disabled={saving} className="w-full rounded-xl bg-emerald-600 py-2.5 text-[0.78rem] font-semibold text-white inline-flex items-center justify-center gap-2">
                      {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                      Submit Proposal
                    </button>
                  </>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AmenityIcon({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-stone-100" title={title}>
      {icon}
    </span>
  );
}

function proposalStatusClass(status: ListingProposal['status']) {
  if (status === 'accepted') return 'bg-emerald-100 text-emerald-700';
  if (status === 'rejected') return 'bg-red-100 text-red-700';
  return 'bg-amber-100 text-amber-700';
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}
