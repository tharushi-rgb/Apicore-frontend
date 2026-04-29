import { supabase } from './supabaseClient';
import { authService } from './auth';
import { notificationsService } from './notifications';
import {
  type Bid,
  type Contract,
  type FinancialTerms,
  type LandPlot,
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

// --- Internal Helpers ---
function getCurrentUser() {
  const user = authService.getLocalUser();
  if (!user) throw new Error('Not logged in');
  return user;
}

function makeListingCode(id: number): string {
  return `LST-${String(id).padStart(4, '0')}`;
}

function paymentLabel(row: any): string {
  if (row.financial_terms === 'cash_rent') return `Rs. ${(row.cash_rent_lkr || 0).toLocaleString()}/mo`;
  if (row.financial_terms === 'honey_share') return `${row.honey_share_kgs || 0}% Honey Share`;
  return 'Free - Pollination';
}

function normalizeForage(entries: any): string[] {
  if (!entries) return [];
  if (Array.isArray(entries)) {
    return entries.map((e: any) => e.name || e.forage).filter(Boolean);
  }
  return [];
}

// --- Service Implementation ---
export const beekeeperListingsService = {
  async getListingReviews(listingId: number): Promise<ListingReview[]> {
    const { data, error } = await supabase
      .from('listing_reviews')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((r: any) => ({
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
    const { data, error } = await supabase
      .from('landowner_listings')
      .select(`
        *,
        landowner_plots(*),
        users(id, name, phone, created_at)
      `)
      .in('status', ['published', 'active', 'accepted'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    const output: ListingSummary[] = [];
    const user = authService.getLocalUser();

    for (const row of (data || [])) {
      const plot = row.landowner_plots;
      const owner = row.users;
      if (!plot) continue;

      // Logic to check if user already applied
      let proposalStatus: any = 'none';
      if (user) {
        const { data: userBid } = await supabase
          .from('landowner_bids')
          .select('status')
          .eq('listing_id', row.id)
          .eq('beekeeper_user_id', user.id)
          .maybeSingle();
        if (userBid) proposalStatus = userBid.status;
      }

      output.push({
        id: `${row.user_id}:${row.id}`,
        ownerUserId: row.user_id,
        listingId: row.id,
        plotId: row.plot_id,
        listingCode: row.listing_code || makeListingCode(row.id),
        plotName: plot.name,
        district: plot.district || '',
        dsDivision: plot.ds_division || '',
        coordinates: { lat: plot.gps_latitude || 0, lng: plot.gps_longitude || 0 },
        forageNames: normalizeForage(plot.forage_entries),
        shadeProfile: plot.shade_profile || 'Full Sun',
        hasWaterOnSite: plot.water_availability === 'On-site',
        vehicleAccess: plot.vehicle_access || 'Lorry',
        nightAccess: !!plot.night_access,
        paymentLabel: paymentLabel(row),
        financialTerms: row.financial_terms,
        ownerName: owner?.name || 'Landowner',
        ownerContact: owner?.phone || '',
        ownerYearsActive: 1,
        image: (plot.images || [])[0],
        maxHiveCapacity: 10,
        acceptedHiveCount: 0,
        userProposalStatus: proposalStatus,
        totalAcreage: plot.total_acreage || 0
      });
    }
    return output;
  },

  async getMyProposals(): Promise<ListingProposal[]> {
    const user = getCurrentUser();

    // Validate that user context is current by checking against the most recent auth state
    // This prevents stale user data from being used after login changes
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (!supabaseUser || !user.id) {
      throw new Error('User session is invalid. Please log in again.');
    }

    const { data, error } = await supabase
      .from('landowner_bids')
      .select(`
        *,
        landowner_listings(
          *, 
          landowner_plots(*), 
          users(name, phone)
        )
      `)
      .eq('beekeeper_user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((bid: any) => {
      const listing = bid.landowner_listings;
      const plot = listing?.landowner_plots;
      const owner = listing?.users;

      return {
        ownerUserId: listing?.user_id,
        listingId: bid.listing_id,
        bidId: bid.id,
        listingCode: listing?.listing_code || makeListingCode(bid.listing_id),
        plotName: plot?.name || 'Plot',
        province: plot?.province || '-',
        hiveCount: bid.hives_proposed,
        moveInDate: bid.placement_start_date,
        moveOutDate: bid.placement_end_date,
        submittedAt: bid.submitted_at || bid.created_at,
        status: bid.status,
        remainingCapacity: 10,
        district: plot?.district || '-',
        dsDivision: plot?.ds_division || '-',
        ownerName: owner?.name || 'Unknown',
        ownerContact: owner?.phone || '',
        financialTerms: listing?.financial_terms,
        waterAvailability: plot?.water_availability || 'On-site',
        vehicleAccess: plot?.vehicle_access || 'Lorry',
        nightAccess: !!plot?.night_access,
        gpsLatitude: plot?.gps_latitude ?? 0,
        gpsLongitude: plot?.gps_longitude ?? 0,
        forageEntries: plot?.forage_entries || [],
      };
    });
  },

  async submitProposal(payload: ProposalPayload): Promise<void> {
    const user = getCurrentUser();
    const { error } = await supabase.from('landowner_bids').insert({
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

    if (error) throw error;
    notificationsService.createActionNotification({
      entity: 'Proposal',
      event: 'created',
      details: 'Your proposal has been submitted.',
      severity: 'low',
    });
  }
};