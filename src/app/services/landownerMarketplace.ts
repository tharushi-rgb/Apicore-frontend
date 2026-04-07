import { supabase } from './supabaseClient';
import { authService } from './auth';
import { notificationsService } from './notifications';

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
  beekeeperUserId?: number;
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
  beekeeperUserId?: number;
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

function getUserId(): number {
  const user = authService.getLocalUser();
  if (!user) throw new Error('Not logged in');
  return user.id;
}

function makeListingCode(id: number): string {
  return `LST-${String(id).padStart(4, '0')}`;
}

// Map database row to LandPlot interface
function mapDbToPlot(row: any): LandPlot {
  return {
    id: row.id,
    name: row.name,
    province: row.province || '',
    district: row.district || '',
    dsDivision: row.ds_division || '',
    gpsLatitude: row.gps_latitude || 0,
    gpsLongitude: row.gps_longitude || 0,
    totalAcreage: row.total_acreage || 0,
    forageEntries: row.forage_entries || [],
    waterAvailability: row.water_availability || 'On-site',
    shadeProfile: row.shade_profile || 'Full Sun',
    vehicleAccess: row.vehicle_access || 'Lorry',
    nightAccess: row.night_access || false,
    images: row.images || [],
    createdAt: row.created_at,
  };
}

// Map LandPlot to database row format
function mapPlotToDb(plot: Omit<LandPlot, 'id' | 'createdAt'>): any {
  return {
    name: plot.name,
    province: plot.province,
    district: plot.district,
    ds_division: plot.dsDivision,
    gps_latitude: plot.gpsLatitude,
    gps_longitude: plot.gpsLongitude,
    total_acreage: plot.totalAcreage,
    forage_entries: plot.forageEntries,
    water_availability: plot.waterAvailability,
    shade_profile: plot.shadeProfile,
    vehicle_access: plot.vehicleAccess,
    night_access: plot.nightAccess,
    images: plot.images,
  };
}

// Map database row to Listing interface
function mapDbToListing(row: any): Listing {
  return {
    id: row.id,
    listingCode: row.listing_code || makeListingCode(row.id),
    plotId: row.plot_id,
    financialTerms: row.financial_terms || 'cash_rent',
    cashRentLkr: row.cash_rent_lkr,
    honeyShareKg: row.honey_share_kg,
    sprayingClauseAgreed: row.spraying_clause_agreed || false,
    status: row.status || 'draft',
    availabilityEndDate: row.availability_end_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Map database row to Bid interface
function mapDbToBid(row: any): Bid {
  return {
    id: row.id,
    listingId: row.listing_id,
    beekeeperUserId: row.beekeeper_user_id,
    beekeeperName: row.beekeeper_name || '',
    verified: row.verified || false,
    rating: row.rating || 0,
    fullName: row.full_name || row.beekeeper_name || '',
    beekeepingNature: row.beekeeping_nature || '',
    trainingLevel: row.training_level || '',
    primaryBeeSpecies: row.primary_bee_species || '',
    district: row.district || '',
    reviews: row.reviews || 0,
    previousListings: row.previous_listings || 0,
    hivesProposed: row.hives_proposed || 0,
    placementStartDate: row.placement_start_date || '',
    placementEndDate: row.placement_end_date || '',
    note: row.note || '',
    submittedAt: row.submitted_at || row.created_at,
    status: row.status || 'pending',
  };
}

// Map database row to Contract interface
function mapDbToContract(row: any): Contract {
  return {
    id: row.id,
    listingId: row.listing_id,
    bidId: row.bid_id,
    plot_id: row.plot_id,
    beekeeperUserId: row.beekeeper_user_id,
    beekeeperName: row.beekeeper_name || '',
    plotName: row.plot_name || '',
    hiveCount: row.hive_count || 0,
    expiryLabel: row.expiry_label || '',
    status: row.status || 'active',
    cash_rent_lkr: row.cash_rent_lkr,
    honey_share_kgs: row.honey_share_kgs,
    financial_terms: row.financial_terms,
    moveOutRequestedAt: row.move_out_requested_at,
  };
}

// Check if listing is expired based on availability end date
function listingWithDerivedStatus(listing: Listing): Listing {
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
  // ─── Plots ───────────────────────────────────────────────────────────────────

  async getPlots(): Promise<LandPlot[]> {
    const userId = getUserId();
    const { data, error } = await supabase
      .from('landowner_plots')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(mapDbToPlot);
  },

  async createPlot(payload: Omit<LandPlot, 'id' | 'createdAt'>): Promise<LandPlot> {
    const userId = getUserId();

    // Check for unique name
    const { data: existing } = await supabase
      .from('landowner_plots')
      .select('id')
      .eq('user_id', userId)
      .ilike('name', payload.name.trim());

    if (existing && existing.length > 0) {
      throw new Error('Land / Plot Name must be unique for your account');
    }

    const { data, error } = await supabase
      .from('landowner_plots')
      .insert({
        user_id: userId,
        ...mapPlotToDb(payload),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    notificationsService.createActionNotification({
      entity: 'Land Plot',
      event: 'created',
      details: `Plot "${payload.name}" was added.`,
      severity: 'low',
    });

    return mapDbToPlot(data);
  },

  async updatePlot(plotId: number, payload: Omit<LandPlot, 'id' | 'createdAt'>): Promise<LandPlot> {
    const userId = getUserId();

    // Check for unique name (excluding current plot)
    const { data: existing } = await supabase
      .from('landowner_plots')
      .select('id')
      .eq('user_id', userId)
      .neq('id', plotId)
      .ilike('name', payload.name.trim());

    if (existing && existing.length > 0) {
      throw new Error('Land / Plot Name must be unique for your account');
    }

    const { data, error } = await supabase
      .from('landowner_plots')
      .update({
        ...mapPlotToDb(payload),
        updated_at: new Date().toISOString(),
      })
      .eq('id', plotId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    notificationsService.createActionNotification({
      entity: 'Land Plot',
      event: 'updated',
      details: `Plot "${payload.name}" was updated.`,
      severity: 'low',
    });

    return mapDbToPlot(data);
  },

  async deletePlot(plotId: number): Promise<void> {
    const userId = getUserId();

    // Check if plot has any listings
    const { data: listings } = await supabase
      .from('landowner_listings')
      .select('id')
      .eq('plot_id', plotId);

    if (listings && listings.length > 0) {
      // Delete associated bids first
      const listingIds = listings.map((l: any) => l.id);
      await supabase
        .from('landowner_bids')
        .delete()
        .in('listing_id', listingIds);

      // Delete associated contracts
      await supabase
        .from('landowner_contracts')
        .delete()
        .eq('plot_id', plotId);

      // Delete listings
      await supabase
        .from('landowner_listings')
        .delete()
        .eq('plot_id', plotId);
    }

    const { error } = await supabase
      .from('landowner_plots')
      .delete()
      .eq('id', plotId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);

    notificationsService.createActionNotification({
      entity: 'Land Plot',
      event: 'deleted',
      details: `Plot was deleted along with associated listings.`,
      severity: 'medium',
    });
  },

  // ─── Listings ────────────────────────────────────────────────────────────────

  async getListings(): Promise<Listing[]> {
    const userId = getUserId();
    const { data, error } = await supabase
      .from('landowner_listings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(mapDbToListing).map(listingWithDerivedStatus);
  },

  async getListingById(listingId: number): Promise<Listing> {
    const userId = getUserId();
    const { data, error } = await supabase
      .from('landowner_listings')
      .select('*')
      .eq('id', listingId)
      .eq('user_id', userId)
      .single();

    if (error) throw new Error(error.message);
    return listingWithDerivedStatus(mapDbToListing(data));
  },

  async createListing(payload: {
    plotId: number;
    financialTerms: FinancialTerms;
    cashRentLkr?: number;
    honeyShareKg?: number;
    sprayingClauseAgreed: boolean;
    availabilityEndDate?: string;
    status: ListingStatus;
  }): Promise<Listing> {
    const userId = getUserId();

    // Verify plot exists and belongs to user
    const { data: plot, error: plotError } = await supabase
      .from('landowner_plots')
      .select('id')
      .eq('id', payload.plotId)
      .eq('user_id', userId)
      .single();

    if (plotError || !plot) {
      throw new Error('Select a valid plot before saving');
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('landowner_listings')
      .insert({
        user_id: userId,
        plot_id: payload.plotId,
        financial_terms: payload.financialTerms,
        cash_rent_lkr: payload.cashRentLkr,
        honey_share_kg: payload.honeyShareKg,
        spraying_clause_agreed: payload.sprayingClauseAgreed,
        status: payload.status,
        availability_end_date: payload.availabilityEndDate,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Update listing code with the generated ID
    const listingCode = makeListingCode(data.id);
    await supabase
      .from('landowner_listings')
      .update({ listing_code: listingCode })
      .eq('id', data.id);

    notificationsService.createActionNotification({
      entity: 'Listing',
      event: 'created',
      details: `Listing ${listingCode} was created.`,
      severity: 'low',
    });

    return mapDbToListing({ ...data, listing_code: listingCode });
  },

  async updateListing(
    listingId: number,
    payload: {
      plotId: number;
      financialTerms: FinancialTerms;
      cashRentLkr?: number;
      honeyShareKg?: number;
      sprayingClauseAgreed: boolean;
      availabilityEndDate?: string;
      status: ListingStatus;
    }
  ): Promise<Listing> {
    const userId = getUserId();

    // Check if listing has any bids
    const { data: bids } = await supabase
      .from('landowner_bids')
      .select('id')
      .eq('listing_id', listingId);

    if (bids && bids.length > 0) {
      throw new Error('This listing cannot be edited as proposals have already been received');
    }

    const { data, error } = await supabase
      .from('landowner_listings')
      .update({
        plot_id: payload.plotId,
        financial_terms: payload.financialTerms,
        cash_rent_lkr: payload.cashRentLkr,
        honey_share_kg: payload.honeyShareKg,
        spraying_clause_agreed: payload.sprayingClauseAgreed,
        status: payload.status,
        availability_end_date: payload.availabilityEndDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    notificationsService.createActionNotification({
      entity: 'Listing',
      event: 'updated',
      details: `Listing was updated.`,
      severity: 'low',
    });

    return mapDbToListing(data);
  },

  async deleteListing(listingId: number): Promise<void> {
    const userId = getUserId();

    // Check if listing has accepted bids
    const { data: acceptedBids } = await supabase
      .from('landowner_bids')
      .select('id')
      .eq('listing_id', listingId)
      .eq('status', 'accepted');

    if (acceptedBids && acceptedBids.length > 0) {
      throw new Error('This listing cannot be deleted because it has an accepted bid');
    }

    // Delete associated bids
    await supabase
      .from('landowner_bids')
      .delete()
      .eq('listing_id', listingId);

    // Delete associated contracts
    await supabase
      .from('landowner_contracts')
      .delete()
      .eq('listing_id', listingId);

    const { error } = await supabase
      .from('landowner_listings')
      .delete()
      .eq('id', listingId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);

    notificationsService.createActionNotification({
      entity: 'Listing',
      event: 'deleted',
      details: `Listing was deleted.`,
      severity: 'medium',
    });
  },

  // ─── Bids ────────────────────────────────────────────────────────────────────

  async getBidsForListing(listingId: number): Promise<Bid[]> {
    const { data, error } = await supabase
      .from('landowner_bids')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(mapDbToBid);
  },

  async rejectBid(listingId: number, bidId: number): Promise<void> {
    const { error } = await supabase
      .from('landowner_bids')
      .delete()
      .eq('id', bidId)
      .eq('listing_id', listingId);

    if (error) throw new Error(error.message);

    notificationsService.createActionNotification({
      entity: 'Bid',
      event: 'rejected',
      details: `Bid was rejected and removed.`,
      severity: 'low',
    });
  },

  async acceptBid(listingId: number, bidId: number): Promise<void> {
    const userId = getUserId();

    // Get the bid
    const { data: selectedBid, error: bidError } = await supabase
      .from('landowner_bids')
      .select('*')
      .eq('id', bidId)
      .eq('listing_id', listingId)
      .single();

    if (bidError || !selectedBid) throw new Error('Bid not found');

    // Get the listing
    const { data: listing, error: listingError } = await supabase
      .from('landowner_listings')
      .select('*, landowner_plots(name)')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) throw new Error('Listing not found');

    // Calculate accepted hive count
    const { data: acceptedBids } = await supabase
      .from('landowner_bids')
      .select('hives_proposed')
      .eq('listing_id', listingId)
      .eq('status', 'accepted');

    const acceptedBefore = (acceptedBids || []).reduce((sum: number, b: any) => sum + (b.hives_proposed || 0), 0);
    const maxCapacity = 10;
    const newTotalAccepted = acceptedBefore + (selectedBid.hives_proposed || 0);
    const isCapacityFull = newTotalAccepted >= maxCapacity;

    // Update the bid status
    await supabase
      .from('landowner_bids')
      .update({ status: 'accepted' })
      .eq('id', bidId);

    // If capacity is full, reject other pending bids
    if (isCapacityFull) {
      await supabase
        .from('landowner_bids')
        .update({ status: 'rejected' })
        .eq('listing_id', listingId)
        .eq('status', 'pending')
        .neq('id', bidId);
    }

    // Update listing status
    const nextStatus: ListingStatus = isCapacityFull ? 'occupied' : 'accepted';
    await supabase
      .from('landowner_listings')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', listingId);

    // Create contract
    const plotName = listing.landowner_plots?.name || 'Plot';
    await supabase
      .from('landowner_contracts')
      .insert({
        user_id: userId,
        listing_id: listingId,
        bid_id: bidId,
        plot_id: listing.plot_id,
        beekeeper_user_id: selectedBid.beekeeper_user_id,
        beekeeper_name: selectedBid.beekeeper_name,
        plot_name: plotName,
        hive_count: selectedBid.hives_proposed,
        expiry_label: selectedBid.placement_end_date ? new Date(selectedBid.placement_end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A',
        status: 'active',
        financial_terms: listing.financial_terms,
        cash_rent_lkr: listing.cash_rent_lkr,
        honey_share_kgs: listing.honey_share_kg,
        created_at: new Date().toISOString(),
      });

    notificationsService.createActionNotification({
      entity: 'Bid',
      event: 'accepted',
      details: `Bid accepted. Contract created with ${selectedBid.beekeeper_name}.`,
      severity: 'low',
    });
  },

  // ─── Contracts ───────────────────────────────────────────────────────────────

  async getContracts(): Promise<Contract[]> {
    const userId = getUserId();
    const { data, error } = await supabase
      .from('landowner_contracts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(mapDbToContract);
  },

  async respondMoveOut(contractId: number, approve: boolean): Promise<void> {
    const userId = getUserId();
    const updateData = approve
      ? { status: 'completed' as ContractStatus }
      : { status: 'active' as ContractStatus, move_out_requested_at: null };

    const { error } = await supabase
      .from('landowner_contracts')
      .update(updateData)
      .eq('id', contractId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);

    notificationsService.createActionNotification({
      entity: 'Contract',
      event: approve ? 'completed' : 'updated',
      details: approve
        ? 'Move-out approved. Contract marked as completed.'
        : 'Move-out request declined. Contract stays active.',
      severity: 'low',
    });
  },

  // ─── Dashboard Stats ─────────────────────────────────────────────────────────

  async getDashboardStats(): Promise<{
    hiveCount: number;
    pendingBids: number;
    rupeesReceived: number;
    honeyShareKg: number;
  }> {
    const userId = getUserId();

    // Get all listings for this user - use basic select to avoid column issues
    const { data: listings, error: listingsError } = await supabase
      .from('landowner_listings')
      .select('id, status, financial_terms, cash_rent_lkr')
      .eq('user_id', userId);

    if (listingsError) {
      console.warn('Error fetching listings:', listingsError.message);
      return { hiveCount: 0, pendingBids: 0, rupeesReceived: 0, honeyShareKg: 0 };
    }

    if (!listings || listings.length === 0) {
      return { hiveCount: 0, pendingBids: 0, rupeesReceived: 0, honeyShareKg: 0 };
    }

    const listingIds = listings.map((l: any) => l.id);
    const activeListings = listings.filter((l: any) => ['published', 'accepted', 'occupied'].includes(l.status));
    const activeListingIds = activeListings.map((l: any) => l.id);

    // Get accepted bids for active listings
    const { data: acceptedBids } = await supabase
      .from('landowner_bids')
      .select('hives_proposed, listing_id')
      .in('listing_id', activeListingIds.length > 0 ? activeListingIds : [-1])
      .eq('status', 'accepted');

    const hiveCount = (acceptedBids || []).reduce((sum: number, b: any) => sum + (b.hives_proposed || 0), 0);

    // Get pending bids count
    const { count: pendingBids } = await supabase
      .from('landowner_bids')
      .select('id', { count: 'exact', head: true })
      .in('listing_id', listingIds.length > 0 ? listingIds : [-1])
      .eq('status', 'pending');

    // Calculate revenue
    const acceptedListings = listings.filter((l: any) => ['accepted', 'occupied'].includes(l.status));
    const rupeesReceived = acceptedListings
      .filter((l: any) => l.financial_terms === 'cash_rent')
      .reduce((sum: number, l: any) => sum + (l.cash_rent_lkr || 0), 0);

    // Note: honey_share_kg column might not exist in database schema
    // For now, return 0 for honey share as this feature may not be implemented in the database
    const honeyShareKg = 0;

    return {
      hiveCount,
      pendingBids: pendingBids || 0,
      rupeesReceived,
      honeyShareKg,
    };
  },

  // ─── Get All Published Listings (for beekeepers to browse) ───────────────────

  async getAllPublishedListings(): Promise<Array<{
    listing: Listing;
    plot: LandPlot;
    ownerUserId: number;
    ownerName: string;
  }>> {
    const { data, error } = await supabase
      .from('landowner_listings')
      .select('*, landowner_plots(*), users(name)')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((row: any) => ({
      listing: listingWithDerivedStatus(mapDbToListing(row)),
      plot: row.landowner_plots ? mapDbToPlot(row.landowner_plots) : null,
      ownerUserId: row.user_id as number,
      ownerName: (row.users?.name || `Landowner ${row.user_id}`) as string,
    })).filter((item): item is { listing: Listing; plot: LandPlot; ownerUserId: number; ownerName: string } => item.plot !== null);
  },
};
