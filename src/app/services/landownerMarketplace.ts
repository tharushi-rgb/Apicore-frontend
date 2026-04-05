import { authService } from './auth';

export type WaterAvailability = 'On-site' | 'Within 500m' | 'Requires Manual Water';
export type ShadeProfile = 'Full Shade' | 'Partial Shade' | 'Full Sun';
export type VehicleAccess = 'Lorry' | 'Tuk-tuk' | 'Footpath';
export type FinancialTerms = 'cash_rent' | 'honey_share' | 'pollination_service';
export type ListingStatus = 'draft' | 'published' | 'accepted' | 'expired' | 'occupied';
export type BidStatus = 'pending' | 'accepted' | 'rejected';
export type ContractStatus = 'active' | 'moving_out_requested' | 'completed';

export interface ForageEntry {
  name: string;
  bloomStartMonth: string;
  bloomEndMonth: string;
}

export interface LandPlot {
  id: number;
  name: string;
  province: string;
  district: string;
  dsDivision: string;
  gpsLatitude: number;
  gpsLongitude: number;
  totalAcreage: number;
  forageEntries: ForageEntry[];
  waterAvailability: WaterAvailability;
  shadeProfile: ShadeProfile;
  vehicleAccess: VehicleAccess;
  nightAccess: boolean;
  images: string[];
  createdAt: string;
}

export interface Listing {
  id: number;
  listingCode: string;
  plotId: number;
  financialTerms: FinancialTerms;
  cashRentLkr?: number;
  honeyShareKg?: number;
  sprayingClauseAgreed: boolean;
  status: ListingStatus;
  availabilityEndDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bid {
  id: number;
  listingId: number;
  beekeeperName: string;
  verified: boolean;
  rating: number;
  fullName: string;
  beekeepingNature: string;
  trainingLevel: string;
  primaryBeeSpecies: string;
  district: string;
  reviews: number;
  previousListings: number;
  hivesProposed: number;
  placementStartDate: string;
  placementEndDate: string;
  note: string;
  submittedAt: string;
  status: BidStatus;
}

export interface Contract {
  id: number;
  listingId: number;
  bidId: number;
  plot_id: number;
  beekeeperName: string;
  plotName: string;
  hiveCount: number;
  expiryLabel: string;
  status: ContractStatus;
  cash_rent_lkr?: number;
  honey_share_kgs?: number;
  financial_terms?: FinancialTerms;
  moveOutRequestedAt?: string;
}

interface MarketplaceStore {
  plots: LandPlot[];
  listings: Listing[];
  bids: Bid[];
  contracts: Contract[];
  counters: {
    plot: number;
    listing: number;
    bid: number;
    contract: number;
  };
}

const STORAGE_KEY = 'apicore_landowner_marketplace_v1';

function getUserId() {
  const user = authService.getLocalUser();
  if (!user) throw new Error('Not logged in');
  return user.id;
}

function readAllData(): Record<string, MarketplaceStore> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, MarketplaceStore>) : {};
  } catch {
    return {};
  }
}

function writeAllData(data: Record<string, MarketplaceStore>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function todayIso() {
  return new Date().toISOString();
}

function makeListingCode(id: number) {
  return `LST-${String(id).padStart(4, '0')}`;
}

function createSeedStore(): MarketplaceStore {
  const now = todayIso();
  const plots: LandPlot[] = [
    {
      id: 1,
      name: 'North Coconut Grove',
      province: 'Southern Province',
      district: 'Matara',
      dsDivision: 'Matara Four Gravets',
      gpsLatitude: 5.9549,
      gpsLongitude: 80.555,
      totalAcreage: 8.5,
      forageEntries: [{ name: 'Coconut Palm', bloomStartMonth: 'Jan', bloomEndMonth: 'Dec' }],
      waterAvailability: 'On-site',
      shadeProfile: 'Partial Shade',
      vehicleAccess: 'Lorry',
      nightAccess: true,
      images: [],
      createdAt: now,
    },
    {
      id: 2,
      name: 'East Rubber Estate',
      province: 'Sabaragamuwa Province',
      district: 'Ratnapura',
      dsDivision: 'Ratnapura',
      gpsLatitude: 6.6828,
      gpsLongitude: 80.3992,
      totalAcreage: 12,
      forageEntries: [{ name: 'Rubber (Hevea)', bloomStartMonth: 'Mar', bloomEndMonth: 'Oct' }],
      waterAvailability: 'Within 500m',
      shadeProfile: 'Full Shade',
      vehicleAccess: 'Lorry',
      nightAccess: false,
      images: [],
      createdAt: now,
    },
    {
      id: 3,
      name: 'South Mango Orchard',
      province: 'Southern Province',
      district: 'Hambantota',
      dsDivision: 'Hambantota',
      gpsLatitude: 6.1246,
      gpsLongitude: 81.1185,
      totalAcreage: 5.3,
      forageEntries: [{ name: 'Mango', bloomStartMonth: 'Feb', bloomEndMonth: 'May' }],
      waterAvailability: 'Requires Manual Water',
      shadeProfile: 'Full Sun',
      vehicleAccess: 'Tuk-tuk',
      nightAccess: false,
      images: [],
      createdAt: now,
    },
  ];

  const listings: Listing[] = [
    {
      id: 1,
      listingCode: makeListingCode(1),
      plotId: 1,
      financialTerms: 'honey_share',
      honeyShareKg: 80,
      sprayingClauseAgreed: true,
      status: 'published',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 2,
      listingCode: makeListingCode(2),
      plotId: 2,
      financialTerms: 'cash_rent',
      cashRentLkr: 15000,
      sprayingClauseAgreed: true,
      status: 'accepted',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 3,
      listingCode: makeListingCode(3),
      plotId: 3,
      financialTerms: 'pollination_service',
      sprayingClauseAgreed: true,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const bids: Bid[] = [
    {
      id: 1,
      listingId: 1,
      beekeeperName: 'Saman Perera',
      verified: true,
      rating: 4.8,
      fullName: 'Saman Perera',
      beekeepingNature: 'Commercial',
      trainingLevel: 'NVQ Level 4',
      primaryBeeSpecies: 'Apis cerana',
      district: 'Galle',
      reviews: 18,
      previousListings: 5,
      hivesProposed: 4,
      placementStartDate: '2026-04-01',
      placementEndDate: '2026-09-30',
      note: 'Can begin setup next week. Team has transport and frames ready.',
      submittedAt: now,
      status: 'pending',
    },
    {
      id: 2,
      listingId: 1,
      beekeeperName: 'Lanka Honey Co.',
      verified: true,
      rating: 4.6,
      fullName: 'Lanka Honey Cooperative',
      beekeepingNature: 'Cooperative',
      trainingLevel: 'Department Certified',
      primaryBeeSpecies: 'Apis mellifera',
      district: 'Matara',
      reviews: 41,
      previousListings: 12,
      hivesProposed: 3,
      placementStartDate: '2026-04-10',
      placementEndDate: '2026-10-10',
      note: 'Interested in medium-term placement with honey-share split.',
      submittedAt: now,
      status: 'pending',
    },
    {
      id: 3,
      listingId: 1,
      beekeeperName: 'AgroTrade Ltd.',
      verified: false,
      rating: 4.1,
      fullName: 'AgroTrade Ltd.',
      beekeepingNature: 'Contract',
      trainingLevel: 'In-house Training',
      primaryBeeSpecies: 'Apis cerana',
      district: 'Hambantota',
      reviews: 7,
      previousListings: 2,
      hivesProposed: 3,
      placementStartDate: '2026-05-01',
      placementEndDate: '2026-08-30',
      note: 'Can provide own night-security support if required.',
      submittedAt: now,
      status: 'pending',
    },
    {
      id: 4,
      listingId: 2,
      beekeeperName: 'Kamal Gunasekara',
      verified: true,
      rating: 4.9,
      fullName: 'Kamal Gunasekara',
      beekeepingNature: 'Commercial',
      trainingLevel: 'NVQ Level 5',
      primaryBeeSpecies: 'Apis mellifera',
      district: 'Ratnapura',
      reviews: 25,
      previousListings: 8,
      hivesProposed: 8,
      placementStartDate: '2026-01-10',
      placementEndDate: '2026-12-10',
      note: 'Long-term managed operation with periodic inspections.',
      submittedAt: now,
      status: 'accepted',
    },
  ];

  const contracts: Contract[] = [
    {
      id: 1,
      listingId: 1,
      bidId: 4,
      plot_id: 1,
      beekeeperName: 'Kamal Gunasekara',
      plotName: 'North Coconut Grove',
      hiveCount: 8,
      expiryLabel: 'Dec 2026',
      status: 'active',
      financial_terms: 'honey_share',
      honey_share_kgs: 80,
    },
    {
      id: 2,
      listingId: 2,
      bidId: 4,
      plot_id: 2,
      beekeeperName: 'Suresh Perera',
      plotName: 'East Rubber Estate',
      hiveCount: 4,
      expiryLabel: 'Aug 2026',
      status: 'moving_out_requested',
      financial_terms: 'cash_rent',
      cash_rent_lkr: 15000,
      moveOutRequestedAt: now,
    },
  ];

  return {
    plots,
    listings,
    bids,
    contracts,
    counters: {
      plot: 3,
      listing: 3,
      bid: 4,
      contract: 2,
    },
  };
}

function getStoreForCurrentUser() {
  const userId = getUserId();
  const all = readAllData();
  const key = String(userId);
  if (!all[key]) {
    all[key] = createSeedStore();
    writeAllData(all);
  }
  return { key, all, store: all[key] };
}

function persistStore(key: string, all: Record<string, MarketplaceStore>, store: MarketplaceStore) {
  all[key] = store;
  writeAllData(all);
}

function listingWithDerivedStatus(listing: Listing) {
  if (listing.status === 'published' && listing.availabilityEndDate) {
    const now = new Date();
    const expiry = new Date(listing.availabilityEndDate);
    if (!Number.isNaN(expiry.getTime()) && expiry < now) {
      return { ...listing, status: 'expired' as ListingStatus };
    }
  }
  return listing;
}

export const landownerMarketplaceService = {
  getPlots() {
    const { store } = getStoreForCurrentUser();
    return [...store.plots].sort((a, b) => b.id - a.id);
  },

  createPlot(payload: Omit<LandPlot, 'id' | 'createdAt'>) {
    const { key, all, store } = getStoreForCurrentUser();
    const exists = store.plots.some(
      (plot) => plot.name.trim().toLowerCase() === payload.name.trim().toLowerCase(),
    );
    if (exists) throw new Error('Land / Plot Name must be unique for your account');

    const id = store.counters.plot + 1;
    const nextPlot: LandPlot = {
      ...payload,
      id,
      createdAt: todayIso(),
    };

    const nextStore: MarketplaceStore = {
      ...store,
      counters: { ...store.counters, plot: id },
      plots: [nextPlot, ...store.plots],
    };

    persistStore(key, all, nextStore);
    return nextPlot;
  },

  updatePlot(plotId: number, payload: Omit<LandPlot, 'id' | 'createdAt'>) {
    const { key, all, store } = getStoreForCurrentUser();
    const plotIndex = store.plots.findIndex((plot) => plot.id === plotId);
    if (plotIndex === -1) throw new Error('Plot not found');

    const currentPlot = store.plots[plotIndex];

    // Check for name uniqueness, but allow the same name for the same plot
    const exists = store.plots.some(
      (plot) => 
        plot.id !== plotId && 
        plot.name.trim().toLowerCase() === payload.name.trim().toLowerCase(),
    );
    if (exists) throw new Error('Land / Plot Name must be unique for your account');

    const updatedPlot: LandPlot = {
      ...payload,
      id: plotId,
      createdAt: currentPlot.createdAt,
    };

    const nextPlots = [...store.plots];
    nextPlots[plotIndex] = updatedPlot;

    const nextStore: MarketplaceStore = {
      ...store,
      plots: nextPlots,
    };

    persistStore(key, all, nextStore);
    return updatedPlot;
  },

  deletePlot(plotId: number) {
    const { key, all, store } = getStoreForCurrentUser();

    const listingIdsToRemove = new Set(
      store.listings.filter((listing) => listing.plotId === plotId).map((listing) => listing.id),
    );

    const nextStore: MarketplaceStore = {
      ...store,
      plots: store.plots.filter((plot) => plot.id !== plotId),
      listings: store.listings.filter((listing) => listing.plotId !== plotId),
      bids: store.bids.filter((bid) => !listingIdsToRemove.has(bid.listingId)),
      contracts: store.contracts.filter((contract) => contract.plot_id !== plotId),
    };

    persistStore(key, all, nextStore);
  },

  getListings() {
    const { store } = getStoreForCurrentUser();
    return [...store.listings]
      .map(listingWithDerivedStatus)
      .sort((a, b) => b.id - a.id);
  },

  getListingById(listingId: number) {
    const listing = this.getListings().find((item) => item.id === listingId);
    if (!listing) throw new Error('Listing not found');
    return listing;
  },

  createListing(payload: {
    plotId: number;
    financialTerms: FinancialTerms;
    cashRentLkr?: number;
    honeyShareKg?: number;
    sprayingClauseAgreed: boolean;
    availabilityEndDate?: string;
    status: ListingStatus;
  }) {
    const { key, all, store } = getStoreForCurrentUser();
    const plot = store.plots.find((item) => item.id === payload.plotId);
    if (!plot) throw new Error('Select a valid plot before saving');

    const nextId = store.counters.listing + 1;
    const nextListing: Listing = {
      id: nextId,
      listingCode: makeListingCode(nextId),
      plotId: payload.plotId,
      financialTerms: payload.financialTerms,
      cashRentLkr: payload.cashRentLkr,
      honeyShareKg: payload.honeyShareKg,
      sprayingClauseAgreed: payload.sprayingClauseAgreed,
      status: payload.status,
      availabilityEndDate: payload.availabilityEndDate,
      createdAt: todayIso(),
      updatedAt: todayIso(),
    };

    const nextStore: MarketplaceStore = {
      ...store,
      listings: [nextListing, ...store.listings],
      counters: { ...store.counters, listing: nextId },
    };

    persistStore(key, all, nextStore);
    return nextListing;
  },

  updateListing(
    listingId: number,
    payload: {
      plotId: number;
      financialTerms: FinancialTerms;
      cashRentLkr?: number;
      honeyShareKg?: number;
      sprayingClauseAgreed: boolean;
      availabilityEndDate?: string;
      status: ListingStatus;
    },
  ) {
    const { key, all, store } = getStoreForCurrentUser();
    const listing = store.listings.find((item) => item.id === listingId);
    if (!listing) throw new Error('Listing not found');

    const hasAnyBid = store.bids.some((bid) => bid.listingId === listingId);
    if (hasAnyBid) {
      throw new Error('This listing cannot be edited as proposals have already been received');
    }

    const nextListings = store.listings.map((item) => (
      item.id === listingId
        ? {
            ...item,
            ...payload,
            updatedAt: todayIso(),
          }
        : item
    ));

    const nextStore: MarketplaceStore = {
      ...store,
      listings: nextListings,
    };

    persistStore(key, all, nextStore);
    return nextListings.find((item) => item.id === listingId) as Listing;
  },

  deleteListing(listingId: number) {
    const { key, all, store } = getStoreForCurrentUser();
    const hasAcceptedBid = store.bids.some((bid) => bid.listingId === listingId && bid.status === 'accepted');
    if (hasAcceptedBid) {
      throw new Error('This listing cannot be deleted because it has an accepted bid');
    }

    const nextStore: MarketplaceStore = {
      ...store,
      listings: store.listings.filter((item) => item.id !== listingId),
      bids: store.bids.filter((bid) => bid.listingId !== listingId),
      contracts: store.contracts.filter((contract) => contract.listingId !== listingId),
    };

    persistStore(key, all, nextStore);
  },

  getBidsForListing(listingId: number) {
    const { store } = getStoreForCurrentUser();
    return store.bids
      .filter((bid) => bid.listingId === listingId)
      .sort((a, b) => b.id - a.id);
  },

  rejectBid(listingId: number, bidId: number) {
    const { key, all, store } = getStoreForCurrentUser();
    const nextStore: MarketplaceStore = {
      ...store,
      bids: store.bids.filter((bid) => !(bid.listingId === listingId && bid.id === bidId)),
    };
    persistStore(key, all, nextStore);
  },

  acceptBid(listingId: number, bidId: number) {
    const { key, all, store } = getStoreForCurrentUser();
    const selectedBid = store.bids.find((bid) => bid.id === bidId && bid.listingId === listingId);
    if (!selectedBid) throw new Error('Bid not found');

    const listing = store.listings.find((item) => item.id === listingId);
    if (!listing) throw new Error('Listing not found');

    const acceptedBefore = store.bids
      .filter((bid) => bid.listingId === listingId && bid.status === 'accepted')
      .reduce((sum, bid) => sum + bid.hivesProposed, 0);

    const maxCapacity = 10;
    const newTotalAccepted = acceptedBefore + selectedBid.hivesProposed;
    const isCapacityFull = newTotalAccepted >= maxCapacity;

    const nextBids = store.bids.map((bid) => {
      if (bid.id === bidId) return { ...bid, status: 'accepted' as BidStatus };
      if (bid.listingId === listingId && bid.status === 'pending' && isCapacityFull) {
        return { ...bid, status: 'rejected' as BidStatus };
      }
      return bid;
    });

    const nextStatus: ListingStatus = isCapacityFull ? 'occupied' : 'accepted';
    const nextListings = store.listings.map((item) => (
      item.id === listingId ? { ...item, status: nextStatus, updatedAt: todayIso() } : item
    ));

    const plot = store.plots.find((item) => item.id === listing.plotId);

    const nextContractId = store.counters.contract + 1;
    const nextContract: Contract = {
      id: nextContractId,
      listingId,
      bidId,
      plot_id: plot?.id || listing.plotId,
      beekeeperName: selectedBid.beekeeperName,
      plotName: plot?.name || 'Plot',
      hiveCount: selectedBid.hivesProposed,
      expiryLabel: 'Dec 2026',
      status: 'active',
      financial_terms: listing.financialTerms,
      cash_rent_lkr: listing.cashRentLkr,
      honey_share_kgs: listing.honeyShareKg,
    };

    const nextStore: MarketplaceStore = {
      ...store,
      bids: nextBids,
      listings: nextListings,
      contracts: [nextContract, ...store.contracts],
      counters: { ...store.counters, contract: nextContractId },
    };

    persistStore(key, all, nextStore);
  },

  getContracts() {
    const { store } = getStoreForCurrentUser();
    return [...store.contracts].sort((a, b) => b.id - a.id);
  },

  respondMoveOut(contractId: number, approve: boolean) {
    const { key, all, store } = getStoreForCurrentUser();
    const nextContracts = store.contracts.map((contract) => {
      if (contract.id !== contractId) return contract;
      if (approve) return { ...contract, status: 'completed' as ContractStatus };
      return { ...contract, status: 'active' as ContractStatus, moveOutRequestedAt: undefined };
    });

    const nextStore: MarketplaceStore = {
      ...store,
      contracts: nextContracts,
    };

    persistStore(key, all, nextStore);
  },

  getDashboardStats() {
    const { store } = getStoreForCurrentUser();
    const activeListings = store.listings.filter((listing) => ['published', 'accepted', 'occupied'].includes(listing.status));
    const activeListingIds = new Set(activeListings.map((listing) => listing.id));

    const hiveCount = store.bids
      .filter((bid) => activeListingIds.has(bid.listingId) && bid.status === 'accepted')
      .reduce((sum, bid) => sum + bid.hivesProposed, 0);

    const pendingBids = store.bids.filter((bid) => bid.status === 'pending').length;

    const rupeesReceived = store.listings
      .filter((listing) => ['accepted', 'occupied'].includes(listing.status) && listing.financialTerms === 'cash_rent')
      .reduce((sum, listing) => sum + (listing.cashRentLkr || 0), 0);

    const honeyShareKg = store.listings
      .filter((listing) => ['accepted', 'occupied'].includes(listing.status) && listing.financialTerms === 'honey_share')
      .reduce((sum, listing) => sum + (listing.honeyShareKg || 0), 0);

    return {
      hiveCount,
      pendingBids,
      rupeesReceived,
      honeyShareKg,
    };
  },
};
