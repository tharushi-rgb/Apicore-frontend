import { supabase } from './supabaseClient';
import { authService } from './auth';
import { notificationsService } from './notifications';
import {
  type Bid,
  type Contract,
  type FinancialTerms,
  type LandPlot,
  type Listing,
  type ShadeProfile,
} from './landownerMarketplace';

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
  ownerContact: string;
  ownerYearsActive: number;
  image?: string;
  maxHiveCapacity: number;
  acceptedHiveCount: number;
  userProposalStatus: 'none' | 'pending' | 'accepted' | 'rejected';
  totalAcreage?: number;
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
  id: number;
  listingId: number;
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

// --- Helpers ---
function getCurrentUser() {
  const user = authService.getLocalUser();
  if (!user) throw new Error('Not logged in');
  return user;
}

function makeListingCode(id: number): string {
  return `LST-${String(id).padStart(4, '0')}`;
}

function paymentLabel(financialTerms: FinancialTerms, cashRentLkr?: number, honeyShareKg?: number): string {
  if (financialTerms === 'cash_rent') return `Rs. ${(cashRentLkr || 0).toLocaleString()}/mo`;
  if (financialTerms === 'honey_share') return `${honeyShareKg || 0}% Honey Share`;
  return 'Free - Pollination';
}

function normalizeForageEntries(input: any): string[] {
  if (!input) return [];
  try {
    const parsed = typeof input === 'string' ? JSON.parse(input) : input;
    if (Array.isArray(parsed)) {
      return parsed.map((e: any) => e.name || e.forage).filter(Boolean);
    }
  } catch (e) { console.error("Forage parse error", e); }
  return [];
}

export const beekeeperListingsService = {
  async getListingReviews(listingId: number): Promise<ListingReview[]> {
    const { data: reviewsData, error } = await supabase
      .from('listing_reviews')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (reviewsData || []).map((r: any) => ({
      id: r.id,
      listingId: r.listing_id,
      beekeeperUserId: r.beekeeper_user_id,
      beekeeperName: r.beekeeper_name || `Beekeeper ${r.beekeeper_user_id}`,
      rating: r.rating,
      comment: r.comment || '',
      createdAt: r.created_at,
    }));
  },

  async getPublishedListings(): Promise<ListingSummary[]> {
    // FIX 1: Explicit Join using fk_listings_plot and fk_listings_user
    const { data, error } = await supabase
      .from('landowner_listings')
      .select(`
        *,
        landowner_plots!fk_listings_plot(*),
        users!fk_listings_user(id, name, phone, created_at)
      `)
      .in('status', ['published', 'active', 'accepted'])
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    const output: ListingSummary[] = [];
    for (const row of (data || [])) {
      const plot = row.landowner_plots;
      const owner = row.users;
      if (!plot || !owner) continue;

      const { data: acceptedBids } = await supabase
        .from('landowner_bids')
        .select('hives_proposed')
        .eq('listing_id', row.id)
        .eq('status', 'accepted');

      const acceptedHiveCount = (acceptedBids || []).reduce((sum: number, b: any) => sum + (b.hives_proposed || 0), 0);
      const ownerCreatedAt = new Date(owner.created_at);
      const yearsActive = Math.max(1, Math.floor((Date.now() - ownerCreatedAt.getTime()) / (365.25 * 24 * 60 * 60 * 1000)));

      output.push({
        id: `${row.user_id}:${row.id}`,
        ownerUserId: row.user_id,
        listingId: row.id,
        plotId: plot.id,
        listingCode: row.listing_code || makeListingCode(row.id),
        plotName: plot.name,
        district: plot.district || '',
        dsDivision: plot.ds_division || '',
        coordinates: { lat: plot.gps_latitude || 0, lng: plot.gps_longitude || 0 },
        forageNames: normalizeForageEntries(plot.forage_entries),
        shadeProfile: plot.shade_profile || 'Full Sun',
        hasWaterOnSite: plot.water_availability === 'On-site',
        vehicleAccess: plot.vehicle_access || 'Lorry',
        nightAccess: plot.night_access || false,
        paymentLabel: paymentLabel(row.financial_terms, row.cash_rent_lkr, row.honey_share_kgs),
        financialTerms: row.financial_terms,
        ownerName: owner.name || `Landowner ${row.user_id}`,
        ownerContact: owner.phone || '',
        ownerYearsActive: yearsActive,
        image: (plot.images || [])[0],
        maxHiveCapacity: 10,
        acceptedHiveCount,
        userProposalStatus: 'none',
        totalAcreage: plot.total_acreage || 0
      });
    }
    return output.sort((a, b) => a.listingCode.localeCompare(b.listingCode));
  },

  async getMyProposals(): Promise<ListingProposal[]> {
    const user = getCurrentUser();
    
    // FIX 2: Explicit Join using fk_bids_listing
    const { data: bids, error: bidsError } = await supabase
      .from('landowner_bids')
      .select(`
        *,
        landowner_listings!fk_bids_listing(
          *, 
          landowner_plots!fk_listings_plot(*), 
          users!fk_listings_user(name, phone)
        )
      `)
      .eq('beekeeper_user_id', user.id)
      .order('created_at', { ascending: false });

    if (bidsError) throw new Error(bidsError.message);

    const proposals: ListingProposal[] = [];
    for (const bid of (bids || [])) {
      const listing = bid.landowner_listings;
      if (!listing) continue;
      const plot = listing.landowner_plots;
      const owner = listing.users;

      const { data: acceptedBids } = await supabase
        .from('landowner_bids')
        .select('hives_proposed')
        .eq('listing_id', listing.id)
        .eq('status', 'accepted');

      const acceptedHiveCount = (acceptedBids || []).reduce((sum: number, b: any) => sum + (b.hives_proposed || 0), 0);

      let contract: any = null;
      if (bid.status === 'accepted') {
        const { data: contracts } = await supabase
          .from('landowner_contracts')
          .select('*')
          .eq('listing_id', listing.id)
          .eq('bid_id', bid.id)
          .maybeSingle();
        contract = contracts;
      }

      proposals.push({
        ownerUserId: listing.user_id,
        listingId: listing.id,
        bidId: bid.id,
        listingCode: listing.listing_code || makeListingCode(listing.id),
        plotName: plot?.name || 'Plot',
        province: plot?.province || '-',
        hiveCount: bid.hives_proposed,
        moveInDate: bid.placement_start_date,
        moveOutDate: bid.placement_end_date,
        submittedAt: bid.submitted_at || bid.created_at,
        status: bid.status,
        contractId: contract?.id,
        contractStatus: contract?.status,
        remainingCapacity: Math.max(0, 10 - acceptedHiveCount),
        district: plot?.district || '-',
        dsDivision: plot?.ds_division || '-',
        ownerName: owner?.name || `Landowner ${listing.user_id}`,
        ownerContact: owner?.phone || '',
        financialTerms: listing.financial_terms,
        cashRentLkr: listing.cash_rent_lkr,
        honeyShareKg: listing.honey_share_kgs,
        waterAvailability: plot?.water_availability || 'On-site',
        vehicleAccess: plot?.vehicle_access || 'Lorry',
        nightAccess: plot?.night_access ?? false,
        gpsLatitude: plot?.gps_latitude ?? 0,
        gpsLongitude: plot?.gps_longitude ?? 0,
        forageEntries: plot?.forage_entries || [],
      });
    }
    return proposals;
  },

  async submitProposal(payload: ProposalPayload): Promise<void> {
    const user = getCurrentUser();
    
    // FIX 3: Explicit Join inside proposal check
    const { data: listing, error: lError } = await supabase
      .from('landowner_listings')
      .select('id, status, users!fk_listings_user(id)')
      .eq('id', payload.listingId)
      .single();

    if (lError || !listing || !['published', 'active', 'accepted'].includes(listing.status)) {
      throw new Error('Listing is not accepting proposals');
    }

    const { error: bidError } = await supabase.from('landowner_bids').insert({
      listing_id: payload.listingId,
      beekeeper_user_id: user.id,
      beekeeper_name: user.name,
      full_name: user.name,
      hives_proposed: payload.hiveCount,
      placement_start_date: payload.moveInDate,
      placement_end_date: payload.moveOutDate,
      note: payload.note || '',
      status: 'pending',
      submitted_at: new Date().toISOString()
    });

    if (bidError) throw new Error(bidError.message);
    
    notificationsService.createActionNotification({
      entity: 'Proposal',
      event: 'created',
      details: 'Your proposal has been submitted successfully.',
      severity: 'low',
    });
  }
};