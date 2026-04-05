import { authService } from './auth';
import {
  type Bid,
  type Contract,
  type FinancialTerms,
  type LandPlot,
  type Listing,
  type ShadeProfile,
  landownerMarketplaceService,
} from './landownerMarketplace';

const REVIEWS_KEY = 'apicore_listing_reviews_v1';

type ContractStatus = Contract['status'];

export interface ListingSummary {
  id: string;
  ownerUserId: number;
  listingId: number;
  plotId: number;
  listingCode: string;
  plotName: string;
  district: string;
  dsDivision: string;
  coordinates: { lat: number; lng: number };
  forageNames: string[];
  shadeProfile: ShadeProfile;
  hasWaterOnSite: boolean;
  vehicleAccess: LandPlot['vehicleAccess'];
  nightAccess: boolean;
  paymentLabel: string;
  financialTerms: FinancialTerms;
  ownerName: string;
  ownerRating: number;
  ownerReviewCount: number;
  ownerVerified: boolean;
  ownerContact: string;
  ownerYearsActive: number;
  image?: string;
  maxHiveCapacity: number;
  acceptedHiveCount: number;
}

export interface ListingProposal {
  ownerUserId: number;
  listingId: number;
  bidId: number;
  listingCode: string;
  plotName: string;
  province: string;
  hiveCount: number;
  moveInDate: string;
  moveOutDate: string;
  submittedAt: string;
  status: Bid['status'];
  contractId?: number;
  contractStatus?: ContractStatus;
  remainingCapacity: number;
  district: string;
  dsDivision: string;
  ownerName: string;
  ownerContact: string;
  financialTerms: FinancialTerms;
  cashRentLkr?: number;
  honeyShareKg?: number;
  waterAvailability: LandPlot['waterAvailability'];
  vehicleAccess: LandPlot['vehicleAccess'];
  nightAccess: boolean;
  gpsLatitude: number;
  gpsLongitude: number;
  forageEntries: LandPlot['forageEntries'];
}

export interface ListingReview {
  id: string;
  listingKey: string;
  beekeeperUserId: number;
  beekeeperName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ProposalPayload {
  ownerUserId: number;
  listingId: number;
  hiveCount: number;
  moveInDate: string;
  moveOutDate: string;
  note?: string;
}

interface AllStore {
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

function getCurrentUser() {
  const user = authService.getLocalUser();
  if (!user) throw new Error('Not logged in');
  return user;
}

function listingKey(ownerUserId: number, listingId: number) {
  return `${ownerUserId}:${listingId}`;
}

function readRawStore(): Record<string, AllStore> {
  try {
    const raw = localStorage.getItem('apicore_landowner_marketplace_v1');
    return raw ? (JSON.parse(raw) as Record<string, AllStore>) : {};
  } catch {
    return {};
  }
}

function writeRawStore(data: Record<string, AllStore>) {
  localStorage.setItem('apicore_landowner_marketplace_v1', JSON.stringify(data));
}

function readReviews(): Record<string, ListingReview[]> {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ListingReview[]>) : {};
  } catch {
    return {};
  }
}

function writeReviews(data: Record<string, ListingReview[]>) {
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(data));
}

function normalizeStatus(listing: Listing): Listing['status'] {
  if (listing.status !== 'published' || !listing.availabilityEndDate) return listing.status;
  const expiry = new Date(listing.availabilityEndDate);
  if (!Number.isNaN(expiry.getTime()) && expiry < new Date()) return 'expired';
  return listing.status;
}

function ownerMeta(ownerUserId: number) {
  return {
    ownerName: `Landowner ${ownerUserId}`,
    ownerRating: 4.4 + (ownerUserId % 6) * 0.1,
    ownerReviewCount: 6 + (ownerUserId % 12),
    ownerVerified: ownerUserId % 2 === 0,
    ownerContact: `+94 7${String(ownerUserId).padStart(8, '0').slice(-8)}`,
    ownerYearsActive: 1 + (ownerUserId % 7),
  };
}

function paymentLabel(listing: Listing) {
  if (listing.financialTerms === 'cash_rent') return `Rs. ${(listing.cashRentLkr || 0).toLocaleString()}/mo`;
  if (listing.financialTerms === 'honey_share') return `${listing.honeyShareKg || 0}% Honey Share`;
  return 'Free - Pollination';
}

function getAcceptedCountForListing(store: AllStore, listingId: number) {
  return store.bids
    .filter((bid) => bid.listingId === listingId && bid.status === 'accepted')
    .reduce((sum, bid) => sum + (bid.hivesProposed || 0), 0);
}

export const beekeeperListingsService = {
  getPublishedListings() {
    // Ensure seed data exists for the current session.
    try {
      landownerMarketplaceService.getListings();
    } catch {
      // no-op
    }

    const all = readRawStore();
    const output: ListingSummary[] = [];

    Object.entries(all).forEach(([ownerKey, store]) => {
      const ownerUserId = Number(ownerKey);
      if (!Number.isFinite(ownerUserId)) return;

      store.listings.forEach((listing) => {
        if (normalizeStatus(listing) !== 'published') return;

        const plot = store.plots.find((item) => item.id === listing.plotId);
        if (!plot) return;

        const acceptedHiveCount = getAcceptedCountForListing(store, listing.id);
        const meta = ownerMeta(ownerUserId);

        output.push({
          id: listingKey(ownerUserId, listing.id),
          ownerUserId,
          listingId: listing.id,
          plotId: plot.id,
          listingCode: listing.listingCode,
          plotName: plot.name,
          district: plot.district,
          dsDivision: plot.dsDivision,
          coordinates: { lat: plot.gpsLatitude, lng: plot.gpsLongitude },
          forageNames: plot.forageEntries.map((entry) => entry.name).filter(Boolean),
          shadeProfile: plot.shadeProfile,
          hasWaterOnSite: plot.waterAvailability === 'On-site',
          vehicleAccess: plot.vehicleAccess,
          nightAccess: plot.nightAccess,
          paymentLabel: paymentLabel(listing),
          financialTerms: listing.financialTerms,
          ownerName: meta.ownerName,
          ownerRating: Number(meta.ownerRating.toFixed(1)),
          ownerReviewCount: meta.ownerReviewCount,
          ownerVerified: meta.ownerVerified,
          ownerContact: meta.ownerContact,
          ownerYearsActive: meta.ownerYearsActive,
          image: plot.images[0],
          maxHiveCapacity: 10,
          acceptedHiveCount,
        });
      });
    });

    return output.sort((a, b) => a.listingCode.localeCompare(b.listingCode));
  },

  getListingDetail(ownerUserId: number, listingId: number) {
    const all = readRawStore();
    const store = all[String(ownerUserId)];
    if (!store) throw new Error('Listing not found');

    const listing = store.listings.find((item) => item.id === listingId);
    if (!listing) throw new Error('Listing not found');

    const plot = store.plots.find((item) => item.id === listing.plotId);
    if (!plot) throw new Error('Plot not found');

    const summary = this.getPublishedListings().find((item) => item.ownerUserId === ownerUserId && item.listingId === listingId);
    if (!summary) throw new Error('Listing is not currently published');

    const reviewsByListing = readReviews();
    const key = listingKey(ownerUserId, listingId);

    return {
      summary,
      listing,
      plot,
      reviews: reviewsByListing[key] || [],
    };
  },

  submitProposal(payload: ProposalPayload) {
    const user = getCurrentUser();
    const all = readRawStore();
    const ownerKey = String(payload.ownerUserId);
    const store = all[ownerKey];
    if (!store) throw new Error('Listing owner not found');

    const listing = store.listings.find((item) => item.id === payload.listingId);
    if (!listing) throw new Error('Listing not found');

    const acceptedHiveCount = getAcceptedCountForListing(store, payload.listingId);
    const remainingCapacity = Math.max(0, 10 - acceptedHiveCount);
    if (payload.hiveCount > remainingCapacity) {
      throw new Error(`Hive count exceeds remaining capacity (${remainingCapacity})`);
    }

    const existingPending = store.bids.find(
      (bid) => bid.listingId === payload.listingId
        && bid.status === 'pending'
        && ((bid as any).beekeeperUserId === user.id),
    );
    if (existingPending) {
      throw new Error('You already have a pending proposal for this listing');
    }

    const nextBidId = (store.counters?.bid || 0) + 1;
    const bid: Bid = {
      id: nextBidId,
      listingId: payload.listingId,
      beekeeperName: user.name || `Beekeeper ${user.id}`,
      verified: true,
      rating: 4.7,
      fullName: user.name || `Beekeeper ${user.id}`,
      beekeepingNature: 'Commercial',
      trainingLevel: 'APICore Certified',
      primaryBeeSpecies: 'Apis cerana',
      district: user.district || 'Unknown',
      reviews: 0,
      previousListings: 0,
      hivesProposed: payload.hiveCount,
      placementStartDate: payload.moveInDate,
      placementEndDate: payload.moveOutDate,
      note: payload.note || '',
      submittedAt: new Date().toISOString(),
      status: 'pending',
      ...( { beekeeperUserId: user.id } as any ),
    };

    const nextStore: AllStore = {
      ...store,
      bids: [bid, ...store.bids],
      counters: { ...store.counters, bid: nextBidId },
    };

    all[ownerKey] = nextStore;
    writeRawStore(all);
    return bid;
  },

  getMyProposals() {
    const user = getCurrentUser();
    const all = readRawStore();
    const proposals: ListingProposal[] = [];

    Object.entries(all).forEach(([ownerKey, store]) => {
      const ownerUserId = Number(ownerKey);
      if (!Number.isFinite(ownerUserId)) return;

      store.bids.forEach((bid) => {
        if ((bid as any).beekeeperUserId !== user.id) return;

        const listing = store.listings.find((item) => item.id === bid.listingId);
        if (!listing) return;

        const plot = store.plots.find((item) => item.id === listing.plotId);
        const acceptedHiveCount = getAcceptedCountForListing(store, listing.id);
        const contract = store.contracts.find((item) => item.bidId === bid.id && item.listingId === listing.id);
        const owner = ownerMeta(ownerUserId);

        proposals.push({
          ownerUserId,
          listingId: listing.id,
          bidId: bid.id,
          listingCode: listing.listingCode,
          plotName: plot?.name || 'Plot',
          province: plot?.province || '-',
          hiveCount: bid.hivesProposed,
          moveInDate: bid.placementStartDate,
          moveOutDate: bid.placementEndDate,
          submittedAt: bid.submittedAt,
          status: bid.status,
          contractId: contract?.id,
          contractStatus: contract?.status,
          remainingCapacity: Math.max(0, 10 - acceptedHiveCount),
          district: plot?.district || '-',
          dsDivision: plot?.dsDivision || '-',
          ownerName: owner.ownerName,
          ownerContact: owner.ownerContact,
          financialTerms: listing.financialTerms,
          cashRentLkr: listing.cashRentLkr,
          honeyShareKg: listing.honeyShareKg,
          waterAvailability: plot?.waterAvailability || 'On-site',
          vehicleAccess: plot?.vehicleAccess || 'Lorry',
          nightAccess: plot?.nightAccess ?? false,
          gpsLatitude: plot?.gpsLatitude ?? 0,
          gpsLongitude: plot?.gpsLongitude ?? 0,
          forageEntries: plot?.forageEntries || [],
        });
      });
    });

    return proposals.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  },

  requestMoveOut(ownerUserId: number, contractId: number) {
    const all = readRawStore();
    const ownerKey = String(ownerUserId);
    const store = all[ownerKey];
    if (!store) throw new Error('Contract owner not found');

    const contract = store.contracts.find((item) => item.id === contractId);
    if (!contract) throw new Error('Contract not found');
    if (contract.status !== 'active') throw new Error('Move-out can only be requested for active contracts');

    const nextContracts = store.contracts.map((item) => (
      item.id === contractId
        ? { ...item, status: 'moving_out_requested' as ContractStatus, moveOutRequestedAt: new Date().toISOString() }
        : item
    ));

    all[ownerKey] = { ...store, contracts: nextContracts };
    writeRawStore(all);
  },

  submitReview(ownerUserId: number, listingId: number, rating: number, comment: string) {
    const user = getCurrentUser();
    const myProposal = this.getMyProposals().find(
      (proposal) => proposal.ownerUserId === ownerUserId
        && proposal.listingId === listingId
        && proposal.contractStatus === 'completed',
    );

    if (!myProposal) throw new Error('Review is allowed only after move-out is completed');

    const key = listingKey(ownerUserId, listingId);
    const reviews = readReviews();
    const existing = reviews[key] || [];
    const already = existing.some((item) => item.beekeeperUserId === user.id);
    if (already) throw new Error('You already submitted a review for this plot');

    const nextReview: ListingReview = {
      id: `${Date.now()}-${user.id}`,
      listingKey: key,
      beekeeperUserId: user.id,
      beekeeperName: user.name || `Beekeeper ${user.id}`,
      rating,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };

    reviews[key] = [nextReview, ...existing];
    writeReviews(reviews);
    return nextReview;
  },
};
