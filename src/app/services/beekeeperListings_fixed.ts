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

export const beekeeperListingsService = {
  async getPublishedListings(): Promise<ListingSummary[]> {
    // Now that foreign keys are properly set up, use JOIN queries
    const { data, error } = await supabase
      .from('landowner_listings')
      .select(`
        *,
        landowner_plots(*),
        users(id, name, phone, created_at)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    const output: ListingSummary[] = [];

    for (const row of (data || [])) {
      const plot = row.landowner_plots;
      const owner = row.users;
      if (!plot) continue;

      // Get accepted hive count for this listing
      const { data: acceptedBids } = await supabase
        .from('landowner_bids')
        .select('hives_proposed')
        .eq('listing_id', row.id)
        .eq('status', 'accepted');

      const acceptedHiveCount = (acceptedBids || []).reduce((sum: number, b: any) => sum + (b.hives_proposed || 0), 0);

      // Get review count for owner
      const { count: reviewCount } = await supabase
        .from('listing_reviews')
        .select('id', { count: 'exact', head: true })
        .eq('owner_user_id', row.user_id);

      // Calculate owner's years active
      const ownerCreatedAt = owner?.created_at ? new Date(owner.created_at) : new Date();
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
        forageNames: (plot.forage_entries || []).map((e: any) => e.name).filter(Boolean),
        shadeProfile: plot.shade_profile || 'Full Sun',
        hasWaterOnSite: plot.water_availability === 'On-site',
        vehicleAccess: plot.vehicle_access || 'Lorry',
        nightAccess: plot.night_access || false,
        paymentLabel: paymentLabel(row.financial_terms, row.cash_rent_lkr, row.honey_share_kg),
        financialTerms: row.financial_terms,
        ownerName: owner?.name || `Landowner ${row.user_id}`,
        ownerRating: 4.5, // Default rating - could be calculated from reviews
        ownerReviewCount: reviewCount || 0,
        ownerVerified: true, // Could be based on verification status
        ownerContact: owner?.phone || '',
        ownerYearsActive: yearsActive,
        image: (plot.images || [])[0],
        maxHiveCapacity: 10, // Default capacity
        acceptedHiveCount,
      });
    }

    return output.sort((a, b) => a.listingCode.localeCompare(b.listingCode));
  },

  async getListingDetail(ownerUserId: number, listingId: number): Promise<{
    summary: ListingSummary;
    reviews: ListingReview[];
  }> {
    // Get the listing
    const listings = await this.getPublishedListings();
    const summary = listings.find(l => l.ownerUserId === ownerUserId && l.listingId === listingId);

    if (!summary) throw new Error('Listing not found or not currently published');

    // Get reviews for this listing
    const { data: reviewsData } = await supabase
      .from('listing_reviews')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    const reviews: ListingReview[] = (reviewsData || []).map((r: any) => ({
      id: r.id,
      listingId: r.listing_id,
      beekeeperUserId: r.beekeeper_user_id,
      beekeeperName: r.beekeeper_name || `Beekeeper ${r.beekeeper_user_id}`,
      rating: r.rating,
      comment: r.comment || '',
      createdAt: r.created_at,
    }));

    return { summary, reviews };
  },

  async submitProposal(payload: ProposalPayload): Promise<void> {
    const user = getCurrentUser();

    // Check if listing exists and is active
    const { data: listing, error: listingError } = await supabase
      .from('landowner_listings')
      .select('id, status, user_id')
      .eq('id', payload.listingId)
      .eq('user_id', payload.ownerUserId)
      .single();

    if (listingError || !listing) throw new Error('Listing not found');
    if (listing.status !== 'active') throw new Error('Listing is not accepting proposals');

    // Check remaining capacity
    const { data: acceptedBids } = await supabase
      .from('landowner_bids')
      .select('hives_proposed')
      .eq('listing_id', payload.listingId)
      .eq('status', 'accepted');

    const acceptedHiveCount = (acceptedBids || []).reduce((sum: number, b: any) => sum + (b.hives_proposed || 0), 0);
    const remainingCapacity = Math.max(0, 10 - acceptedHiveCount);

    if (payload.hiveCount > remainingCapacity) {
      throw new Error(`Hive count exceeds remaining capacity (${remainingCapacity})`);
    }

    // Check for existing pending proposal
    const { data: existingPending } = await supabase
      .from('landowner_bids')
      .select('id')
      .eq('listing_id', payload.listingId)
      .eq('beekeeper_user_id', user.id)
      .eq('status', 'pending');

    if (existingPending && existingPending.length > 0) {
      throw new Error('You already have a pending proposal for this listing');
    }

    // Create the bid
    const { error: bidError } = await supabase
      .from('landowner_bids')
      .insert({
        listing_id: payload.listingId,
        beekeeper_user_id: user.id,
        beekeeper_name: user.name || `Beekeeper ${user.id}`,
        verified: true,
        rating: 4.7,
        full_name: user.name || `Beekeeper ${user.id}`,
        beekeeping_nature: 'Commercial',
        training_level: 'APICore Certified',
        primary_bee_species: 'Apis cerana',
        district: user.district || 'Unknown',
        reviews: 0,
        previous_listings: 0,
        hives_proposed: payload.hiveCount,
        placement_start_date: payload.moveInDate,
        placement_end_date: payload.moveOutDate,
        note: payload.note || '',
        submitted_at: new Date().toISOString(),
        status: 'pending',
        created_at: new Date().toISOString(),
      });

    if (bidError) throw new Error(bidError.message);

    notificationsService.createActionNotification({
      entity: 'Proposal',
      event: 'created',
      details: 'Your proposal has been submitted successfully.',
      severity: 'low',
    });
  },

  async getMyProposals(): Promise<ListingProposal[]> {
    const user = getCurrentUser();

    // Get all bids by this user
    const { data: bids, error: bidsError } = await supabase
      .from('landowner_bids')
      .select(`
        *,
        landowner_listings(*, landowner_plots(*), users(name, phone))
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

      // Get accepted hive count
      const { data: acceptedBids } = await supabase
        .from('landowner_bids')
        .select('hives_proposed')
        .eq('listing_id', listing.id)
        .eq('status', 'accepted');

      const acceptedHiveCount = (acceptedBids || []).reduce((sum: number, b: any) => sum + (b.hives_proposed || 0), 0);

      // Get contract if bid is accepted
      let contract: any = null;
      if (bid.status === 'accepted') {
        const { data: contracts } = await supabase
          .from('landowner_contracts')
          .select('*')
          .eq('listing_id', listing.id)
          .eq('bid_id', bid.id)
          .single();
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
        honeyShareKg: listing.honey_share_kg,
        waterAvailability: plot?.water_availability || 'On-site',
        vehicleAccess: plot?.vehicle_access || 'Lorry',
        nightAccess: plot?.night_access ?? false,
        gpsLatitude: plot?.gps_latitude ?? 0,
        gpsLongitude: plot?.gps_longitude ?? 0,
        forageEntries: plot?.forage_entries || [],
      });
    }

    return proposals.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  },

  async requestMoveOut(ownerUserId: number, contractId: number): Promise<void> {
    const user = getCurrentUser();

    // Get the contract
    const { data: contract, error: contractError } = await supabase
      .from('landowner_contracts')
      .select('*')
      .eq('id', contractId)
      .eq('user_id', ownerUserId)
      .single();

    if (contractError || !contract) throw new Error('Contract not found');
    if (contract.beekeeper_user_id !== user.id) throw new Error('You are not authorized to request move-out for this contract');
    if (contract.status !== 'active') throw new Error('Move-out can only be requested for active contracts');

    const { error: updateError } = await supabase
      .from('landowner_contracts')
      .update({
        status: 'moving_out_requested',
        move_out_requested_at: new Date().toISOString(),
      })
      .eq('id', contractId);

    if (updateError) throw new Error(updateError.message);

    notificationsService.createActionNotification({
      entity: 'Contract',
      event: 'updated',
      details: 'Move-out request sent to landowner.',
      severity: 'low',
    });
  },

  async submitReview(ownerUserId: number, listingId: number, rating: number, comment: string): Promise<void> {
    const user = getCurrentUser();

    // Check if user has a completed contract for this listing
    const { data: contract } = await supabase
      .from('landowner_contracts')
      .select('id')
      .eq('listing_id', listingId)
      .eq('beekeeper_user_id', user.id)
      .eq('status', 'completed')
      .single();

    if (!contract) {
      throw new Error('Review is allowed only after move-out is completed');
    }

    // Check if already reviewed
    const { data: existingReview } = await supabase
      .from('listing_reviews')
      .select('id')
      .eq('listing_id', listingId)
      .eq('beekeeper_user_id', user.id);

    if (existingReview && existingReview.length > 0) {
      throw new Error('You already submitted a review for this plot');
    }

    // Submit review
    const { error } = await supabase
      .from('listing_reviews')
      .insert({
        listing_id: listingId,
        owner_user_id: ownerUserId,
        beekeeper_user_id: user.id,
        beekeeper_name: user.name || `Beekeeper ${user.id}`,
        rating,
        comment: comment.trim(),
        created_at: new Date().toISOString(),
      });

    if (error) throw new Error(error.message);

    notificationsService.createActionNotification({
      entity: 'Review',
      event: 'created',
      details: 'Your review has been submitted.',
      severity: 'low',
    });
  },
};