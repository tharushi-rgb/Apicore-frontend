import { supabase } from './supabaseClient';
import { authService } from './auth';

export type WaterAvailability = 'On-site' | 'Within 500m' | 'Requires Manual Water';
export type ShadeProfile = 'Full Shade' | 'Partial Shade' | 'Full Sun';
export type VehicleAccess = 'Lorry' | 'Tuk-tuk' | 'Footpath';

export interface ForageEntry {
  name: string;
  bloomStartMonth: string;
  bloomEndMonth: string;
}

export interface LandPlot {
  id: number;
  user_id: string;
  name: string;
  province: string;
  district: string;
  ds_division: string;
  gps_latitude: number;
  gps_longitude: number;
  total_acreage: number;
  forage_entries: ForageEntry[];
  water_availability: WaterAvailability;
  shade_profile: ShadeProfile;
  vehicle_access: VehicleAccess;
  night_access: boolean;
  images: string[];
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export const landownerPlotsService = {
  /**
   * Get all plots for the current user
   */
  async getPlots(): Promise<LandPlot[]> {
    const user = authService.getLocalUser();
    if (!user) throw new Error('Not logged in');

    const { data, error } = await supabase
      .from('landowner_plots')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(plot => {
      const imagesKey = `plot_images_${plot.id}`;
      const storedImages = localStorage.getItem(imagesKey);
      const images = storedImages ? JSON.parse(storedImages) : (plot.images || []);

      return {
        ...plot,
        forage_entries: plot.forage_entries || [],
        images
      };
    });
  },

  /**
   * Get a single plot by ID
   */
  async getPlotById(plotId: number): Promise<LandPlot> {
    const user = authService.getLocalUser();
    if (!user) throw new Error('Not logged in');

    const { data, error } = await supabase
      .from('landowner_plots')
      .select('*')
      .eq('id', plotId)
      .eq('user_id', user.id)
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Plot not found');

    const imagesKey = `plot_images_${plotId}`;
    const storedImages = localStorage.getItem(imagesKey);
    const images = storedImages ? JSON.parse(storedImages) : (data.images || []);

    return {
      ...data,
      forage_entries: data.forage_entries || [],
      images
    };
  },

  /**
   * Create a new plot
   */
  async createPlot(payload: Omit<LandPlot, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'status'>): Promise<LandPlot> {
    const user = authService.getLocalUser();
    if (!user) throw new Error('Not logged in');

    const now = new Date().toISOString();
    const images = payload.images || [];

    const { data, error } = await supabase
      .from('landowner_plots')
      .insert([
        {
          user_id: user.id,
          ...payload,
          status: 'active',
          created_at: now,
          updated_at: now
        }
      ])
      .select()
      .single();

    if (error) {
      // Even if database save fails for images, we can still save to localStorage
      if (error.message.includes('images') || error.message.includes('column') || error.message.includes('schema')) {
        console.warn('Database does not support images column, using localStorage fallback');
        // Re-try without images
        const { data: dataWithoutImages, error: retryError } = await supabase
          .from('landowner_plots')
          .insert([
            {
              user_id: user.id,
              ...payload,
              images: undefined,
              status: 'active',
              created_at: now,
              updated_at: now
            }
          ])
          .select()
          .single();

        if (retryError) throw new Error(retryError.message);

        // Save images to localStorage
        const imagesKey = `plot_images_${dataWithoutImages.id}`;
        if (images.length > 0) {
          localStorage.setItem(imagesKey, JSON.stringify(images));
        }

        return {
          ...dataWithoutImages,
          forage_entries: dataWithoutImages.forage_entries || [],
          images
        };
      }
      throw new Error(error.message);
    }

    // Save images to localStorage as backup
    const imagesKey = `plot_images_${data.id}`;
    if (images.length > 0) {
      localStorage.setItem(imagesKey, JSON.stringify(images));
    }

    return {
      ...data,
      forage_entries: data.forage_entries || [],
      images: data.images || images
    };
  },

  /**
   * Update an existing plot
   */
  async updatePlot(plotId: number, payload: Partial<Omit<LandPlot, 'id' | 'user_id' | 'created_at'>>): Promise<LandPlot> {
    const user = authService.getLocalUser();
    if (!user) throw new Error('Not logged in');

    const now = new Date().toISOString();
    const images = payload.images;

    const { data, error } = await supabase
      .from('landowner_plots')
      .update({
        ...payload,
        updated_at: now
      })
      .eq('id', plotId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      // Handle case where database doesn't support images column
      if (error.message.includes('images') || error.message.includes('column') || error.message.includes('schema')) {
        console.warn('Database does not support images column, using localStorage fallback');
        // Re-try without images
        const { data: dataWithoutImages, error: retryError } = await supabase
          .from('landowner_plots')
          .update({
            ...payload,
            images: undefined,
            updated_at: now
          })
          .eq('id', plotId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (retryError) throw new Error(retryError.message);

        // Save images to localStorage
        const imagesKey = `plot_images_${plotId}`;
        if (images && images.length >= 0) {
          localStorage.setItem(imagesKey, JSON.stringify(images));
        }

        return {
          ...dataWithoutImages,
          forage_entries: dataWithoutImages.forage_entries || [],
          images: images || []
        };
      }
      throw new Error(error.message);
    }

    // Save images to localStorage as backup
    if (images && images.length >= 0) {
      const imagesKey = `plot_images_${plotId}`;
      localStorage.setItem(imagesKey, JSON.stringify(images));
    }

    return {
      ...data,
      forage_entries: data.forage_entries || [],
      images: data.images || images || []
    };
  },

  /**
   * Delete a plot
   */
  async deletePlot(plotId: number): Promise<void> {
    const user = authService.getLocalUser();
    if (!user) throw new Error('Not logged in');

    // Check if plot has active listings
    const { data: listings, error: listError } = await supabase
      .from('landowner_listings')
      .select('id')
      .eq('plot_id', plotId)
      .in('status', ['draft', 'published', 'accepted', 'occupied']);

    if (listError) throw new Error(listError.message);
    if (listings && listings.length > 0) {
      throw new Error('Cannot delete plot with active listings. Remove or archive listings first.');
    }

    const { error } = await supabase
      .from('landowner_plots')
      .delete()
      .eq('id', plotId)
      .eq('user_id', user.id);

    if (error) throw new Error(error.message);

    // Clean up localStorage for images
    const imagesKey = `plot_images_${plotId}`;
    localStorage.removeItem(imagesKey);
  },

  /**
   * Get hive count for a plot (total hives placed on land)
   */
  async getPlotHiveCount(plotId: number): Promise<number> {
    const user = authService.getLocalUser();
    if (!user) throw new Error('Not logged in');

    // Get all active contracts for this plot
    const { data: contracts, error } = await supabase
      .from('landowner_contracts')
      .select('hive_count')
      .eq('plot_id', plotId)
      .eq('status', 'active');

    if (error) throw new Error(error.message);
    
    const total = (contracts || []).reduce((sum: number, contract: any) => sum + (contract.hive_count || 0), 0);
    return total;
  },

  /**
   * Get dashboard stats for all plots
   */
  async getDashboardStats() {
    const user = authService.getLocalUser();
    if (!user) throw new Error('Not logged in');

    // Get all plots
    const { data: plots, error: plotError } = await supabase
      .from('landowner_plots')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (plotError) throw new Error(plotError.message);

    // Get all contracts for active plots
    const plotIds = (plots || []).map(p => p.id);
    if (plotIds.length === 0) {
      return {
        totalPlots: 0,
        activeContracts: 0,
        totalHives: 0,
        totalRevenue: 0
      };
    }

    const { data: contracts, error: contractError } = await supabase
      .from('landowner_contracts')
      .select('status, hive_count, financial_terms, cash_rent_lkr, honey_share_kgs')
      .in('plot_id', plotIds);

    if (contractError) throw new Error(contractError.message);

    const activeContracts = (contracts || []).filter(c => c.status === 'active').length;
    const totalHives = (contracts || [])
      .filter(c => c.status === 'active')
      .reduce((sum: number, c: any) => sum + (c.hive_count || 0), 0);

    const totalRevenue = (contracts || [])
      .filter((c: any) => c.status === 'active' && c.financial_terms === 'cash_rent')
      .reduce((sum: number, c: any) => sum + (c.cash_rent_lkr || 0), 0);

    return {
      totalPlots: (plots || []).length,
      activeContracts,
      totalHives,
      totalRevenue
    };
  }
};
