import { supabase } from './supabaseClient';
import { authService } from './auth';
import { notificationsService } from './notifications';

const METADATA_MARKER = '\n\n[APIARY_METADATA]\n';

export interface ApiaryForageEntry {
  forageType: string;
  bloomingPeriod: string;
}

export interface ApiaryMetadata {
  province?: string;
  ds_division?: string;
  land_ownership?: 'owned' | 'not_owned';
  payment_terms?: 'cash' | 'honey_share' | 'pollination_service';
  payment_amount_lkr?: number | null;
  honey_share_kgs?: number | null;
  max_hive_capacity?: number | null;
  water_availability?: 'On-site' | '<500m' | '>500m (Requires Manual Water)';
  vehicle_accessibility?: 'Lorry' | 'Tuk-tuk' | 'Footpath';
  forage_entries?: ApiaryForageEntry[];
  images?: string[];
}

export interface Apiary {
  id: number;
  user_id: number;
  name: string;
  district: string;
  area?: string;
  established_date?: string;
  status: string;
  apiary_type?: string;
  terrain?: string;
  forage_primary?: string;
  blooming_window?: string;
  gps_latitude?: number;
  gps_longitude?: number;
  notes?: string;
  landlord_name?: string;
  landlord_contact?: string;
  contract_start?: string;
  contract_end?: string;
  rental_fee?: number | null;
  province?: string;
  ds_division?: string;
  land_ownership?: 'owned' | 'not_owned';
  payment_terms?: 'cash' | 'honey_share' | 'pollination_service';
  payment_amount_lkr?: number | null;
  honey_share_kgs?: number | null;
  max_hive_capacity?: number | null;
  water_availability?: 'On-site' | '<500m' | '>500m (Requires Manual Water)';
  vehicle_accessibility?: 'Lorry' | 'Tuk-tuk' | 'Footpath';
  forage_entries?: ApiaryForageEntry[];
  images?: string[];
  hive_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ApiaryPayload {
  name: string;
  district: string;
  area?: string | null;
  established_date?: string | null;
  status?: string;
  apiary_type?: string;
  terrain?: string;
  forage_primary?: string;
  blooming_window?: string;
  gps_latitude?: number | string | null;
  gps_longitude?: number | string | null;
  notes?: string;
  landlord_name?: string;
  landlord_contact?: string;
  contract_start?: string | null;
  contract_end?: string | null;
  rental_fee?: number | string | null;
  province?: string;
  ds_division?: string;
  land_ownership?: 'owned' | 'not_owned';
  payment_terms?: 'cash' | 'honey_share' | 'pollination_service';
  payment_amount_lkr?: number | string | null;
  honey_share_kgs?: number | string | null;
  max_hive_capacity?: number | string | null;
  water_availability?: 'On-site' | '<500m' | '>500m (Requires Manual Water)';
  vehicle_accessibility?: 'Lorry' | 'Tuk-tuk' | 'Footpath';
  forage_entries?: ApiaryForageEntry[];
  images?: string[];
}

function sanitizeString(value?: string | null) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function sanitizeDate(value?: string | null) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function sanitizeNumber(value?: number | string | null) {
  if (value == null || value === '') return null;
  const parsed = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function validateAndSanitizePhoneNumber(phone?: string | null): string | null {
  if (!phone) return null;
  const sanitized = sanitizeString(phone);
  if (!sanitized) return null;
  
  // Extract only numeric characters (include +)
  const cleaned = sanitized.replace(/\D/g, '');
  
  // Check if it's 9-12 digits for Sri Lankan format (+94 XXXXXXXXX)
  if (cleaned.length >= 9 && cleaned.length <= 12) {
    return sanitized;
  }
  
  // If invalid, throw error to frontend
  throw new Error(`Invalid phone number. Must be 9-12 digits (+94 format). Received: ${cleaned.length} digits`);
}

function splitNotesAndMetadata(notes?: string | null) {
  if (!notes) return { notes: '', metadata: {} as ApiaryMetadata };
  const [plainNotes, metadataRaw] = notes.split(METADATA_MARKER);
  if (!metadataRaw) return { notes: plainNotes || '', metadata: {} as ApiaryMetadata };
  try {
    return {
      notes: plainNotes || '',
      metadata: JSON.parse(metadataRaw) as ApiaryMetadata,
    };
  } catch {
    return { notes: plainNotes || '', metadata: {} as ApiaryMetadata };
  }
}

function buildNotesWithMetadata(notes: string | undefined, metadata: ApiaryMetadata) {
  const cleanNotes = sanitizeString(notes) || '';
  const hasMetadata = Object.values(metadata).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== '';
  });
  if (!hasMetadata) return cleanNotes || null;
  return `${cleanNotes}${METADATA_MARKER}${JSON.stringify(metadata)}`;
}

function normalizePayload(payload: Partial<ApiaryPayload>, isCreate = false) {
  const forageEntries = (payload.forage_entries || [])
    .map((entry) => ({
      forageType: entry.forageType.trim(),
      bloomingPeriod: entry.bloomingPeriod.trim(),
    }))
    .filter((entry) => entry.forageType || entry.bloomingPeriod);

  const primaryForage = forageEntries[0]?.forageType || sanitizeString(payload.forage_primary) || null;
  const bloomingWindow = forageEntries[0]?.bloomingPeriod || sanitizeString(payload.blooming_window) || null;
  const landOwnership = payload.land_ownership || 'owned';
  const paymentTerms = landOwnership === 'not_owned' ? (payload.payment_terms || 'cash') : undefined;
  const rentalFee = paymentTerms === 'cash' ? sanitizeNumber(payload.payment_amount_lkr ?? payload.rental_fee) : null;

  const metadata: ApiaryMetadata = {
    province: sanitizeString(payload.province) || undefined,
    ds_division: sanitizeString(payload.ds_division) || undefined,
    land_ownership: landOwnership,
    payment_terms: paymentTerms,
    payment_amount_lkr: paymentTerms === 'cash' ? rentalFee : null,
    honey_share_kgs: paymentTerms === 'honey_share' ? sanitizeNumber(payload.honey_share_kgs) : null,
    max_hive_capacity: sanitizeNumber(payload.max_hive_capacity),
    water_availability: payload.water_availability,
    vehicle_accessibility: payload.vehicle_accessibility,
    forage_entries: forageEntries,
    images: payload.images?.filter(Boolean) || [],
  };

  return {
    name: sanitizeString(payload.name) || '',
    district: sanitizeString(payload.district) || '',
    area: sanitizeString(payload.area),
    established_date: sanitizeDate(payload.established_date),
    status: isCreate ? (payload.status || 'active') : payload.status,
    apiary_type: landOwnership === 'not_owned' ? 'client' : 'personal',
    terrain: null,
    forage_primary: primaryForage,
    blooming_window: bloomingWindow,
    gps_latitude: sanitizeNumber(payload.gps_latitude),
    gps_longitude: sanitizeNumber(payload.gps_longitude),
    landlord_name: landOwnership === 'not_owned' ? sanitizeString(payload.landlord_name) : null,
    landlord_contact: landOwnership === 'not_owned' ? validateAndSanitizePhoneNumber(payload.landlord_contact) : null,
    contract_start: landOwnership === 'not_owned' ? sanitizeDate(payload.contract_start) : null,
    contract_end: landOwnership === 'not_owned' ? sanitizeDate(payload.contract_end) : null,
    rental_fee: landOwnership === 'not_owned' && paymentTerms === 'cash' ? rentalFee : null,
    notes: buildNotesWithMetadata(payload.notes, metadata),
  };
}

function parseApiaryRecord(record: Apiary) {
  const { notes, metadata } = splitNotesAndMetadata(record.notes);
  const derivedForageEntries = metadata.forage_entries && metadata.forage_entries.length > 0
    ? metadata.forage_entries
    : (record.forage_primary || record.blooming_window)
      ? [{ forageType: record.forage_primary || '', bloomingPeriod: record.blooming_window || '' }]
      : [];

  return {
    ...record,
    notes,
    province: metadata.province,
    ds_division: metadata.ds_division || record.area,
    land_ownership: metadata.land_ownership || (record.apiary_type === 'client' ? 'not_owned' : 'owned'),
    payment_terms: metadata.payment_terms,
    payment_amount_lkr: metadata.payment_amount_lkr,
    honey_share_kgs: metadata.honey_share_kgs,
    max_hive_capacity: metadata.max_hive_capacity,
    water_availability: metadata.water_availability,
    vehicle_accessibility: metadata.vehicle_accessibility,
    forage_entries: derivedForageEntries,
    images: metadata.images || [],
  } as Apiary;
}

function getUserId(): number {
  const user = authService.getLocalUser();
  if (!user) throw new Error('Not logged in');
  return user.id;
}

const HISTORY_FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  district: 'District',
  area: 'Area',
  established_date: 'Established Date',
  status: 'Status',
  province: 'Province',
  ds_division: 'DS Division',
  land_ownership: 'Land Ownership',
  payment_terms: 'Payment Terms',
  payment_amount_lkr: 'Payment Amount (LKR)',
  honey_share_kgs: 'Honey Share (kg)',
  max_hive_capacity: 'Max Hive Capacity',
  water_availability: 'Water Availability',
  vehicle_accessibility: 'Vehicle Accessibility',
  forage_entries: 'Forage Entries',
  images: 'Images',
  gps_latitude: 'GPS Latitude',
  gps_longitude: 'GPS Longitude',
  notes: 'Notes',
  landlord_name: 'Landowner Name',
  landlord_contact: 'Landowner Contact',
  contract_start: 'Contract Start',
  contract_end: 'Contract End',
};

async function appendApiaryHistory(apiaryId: number, userId: number, action: 'created' | 'updated' | 'deleted', details: string) {
  const { error } = await supabase.from('apiary_history').insert([
    {
      apiary_id: apiaryId,
      user_id: userId,
      action,
      details,
    },
  ]);
  if (error) throw new Error(error.message);
}

function normalizeValueForCompare(value: unknown) {
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === 'string') return value.trim();
  if (value === undefined) return null;
  return value;
}

function buildApiaryUpdateDetails(previous: Apiary | null, updated: Apiary) {
  if (!previous) return 'Apiary updated';
  const changedFields = Object.keys(HISTORY_FIELD_LABELS).filter((key) => {
    const before = normalizeValueForCompare((previous as any)[key]);
    const after = normalizeValueForCompare((updated as any)[key]);
    return before !== after;
  });
  if (changedFields.length === 0) return 'Apiary updated (no field-level changes detected)';
  const labels = changedFields.map((key) => HISTORY_FIELD_LABELS[key]);
  return `Updated fields: ${labels.join(', ')}`;
}

export const apiariesService = {
  async getAll() {
    const userId = getUserId();
    const { data, error } = await supabase
      .from('apiaries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    // Attach hive counts
    const apiaries = (data as Apiary[]).map(parseApiaryRecord);
    const { data: hiveCounts } = await supabase
      .from('hives')
      .select('apiary_id')
      .eq('user_id', userId)
      .eq('status', 'active');
    if (hiveCounts) {
      const countMap: Record<number, number> = {};
      hiveCounts.forEach((h: { apiary_id: number | null }) => {
        if (h.apiary_id) countMap[h.apiary_id] = (countMap[h.apiary_id] ?? 0) + 1;
      });
      apiaries.forEach(a => { a.hive_count = countMap[a.id] ?? 0; });
    }
    return apiaries;
  },

  async getById(id: number) {
    const { data, error } = await supabase
      .from('apiaries')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return parseApiaryRecord(data as Apiary);
  },

  async create(payload: ApiaryPayload) {
    const userId = getUserId();
    const normalized = normalizePayload(payload, true);
    const { data, error } = await supabase
      .from('apiaries')
      .insert({ ...normalized, user_id: userId, status: normalized.status ?? 'active' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    const created = parseApiaryRecord(data as Apiary);
    try {
      await appendApiaryHistory(created.id, userId, 'created', `Apiary "${created.name || 'Unnamed'}" created`);
    } catch (historyError) {
      console.warn('Failed to append apiary history (create):', historyError);
    }
    notificationsService.createActionNotification({
      entity: 'Apiary',
      event: 'created',
      details: `${created.name || 'Apiary'} was added.`,
      severity: 'low',
    });
    return created;
  },

  async update(id: number, payload: Partial<ApiaryPayload>) {
    const userId = getUserId();
    let previousApiary: Apiary | null = null;
    try {
      const { data: previousData, error: previousError } = await supabase
        .from('apiaries')
        .select('*')
        .eq('id', id)
        .single();
      if (!previousError && previousData) {
        previousApiary = parseApiaryRecord(previousData as Apiary);
      }
    } catch {
      previousApiary = null;
    }

    const normalized = normalizePayload(payload);
    const { data, error } = await supabase
      .from('apiaries')
      .update({ ...normalized, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    const updated = parseApiaryRecord(data as Apiary);
    try {
      await appendApiaryHistory(id, userId, 'updated', buildApiaryUpdateDetails(previousApiary, updated));
    } catch (historyError) {
      console.warn('Failed to append apiary history (update):', historyError);
    }
    notificationsService.createActionNotification({
      entity: 'Apiary',
      event: 'updated',
      details: `${updated.name || 'Apiary'} was updated.`,
      severity: 'low',
    });
    return updated;
  },

  async delete(id: number) {
    const userId = getUserId();
    const { data: existing } = await supabase.from('apiaries').select('name').eq('id', id).single();
    const { error } = await supabase.from('apiaries').delete().eq('id', id);
    if (error) throw new Error(error.message);
    try {
      await appendApiaryHistory(id, userId, 'deleted', `Apiary "${existing?.name || id}" deleted`);
    } catch (historyError) {
      console.warn('Failed to append apiary history (delete):', historyError);
    }
    notificationsService.createActionNotification({
      entity: 'Apiary',
      event: 'deleted',
      details: `${existing?.name || 'Apiary'} was deleted.`,
      severity: 'medium',
    });
  },

  async getHistory(id: number) {
    const { data, error } = await supabase
      .from('apiary_history')
      .select('*')
      .eq('apiary_id', id)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async checkAndNotifyContractExpiry() {
    try {
      const userId = getUserId();
      // Get all apiaries with rental contracts (those with contract_end dates)
      const { data: apiaries, error } = await supabase
        .from('apiaries')
        .select('id, name, contract_end, apiary_type')
        .eq('user_id', userId)
        .not('contract_end', 'is', null);
      
      if (error || !apiaries) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const apiary of apiaries) {
        if (!apiary.contract_end) continue;
        
        const contractEnd = new Date(apiary.contract_end);
        contractEnd.setHours(0, 0, 0, 0);
        
        const daysUntilExpiry = Math.ceil((contractEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Check if we've already created a notification for this apiary recently (within last 24 hours)
        const { data: recentNotifications } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', userId)
          .ilike('message', `%${apiary.name}%`)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        if (recentNotifications && recentNotifications.length > 0) {
          continue; // Already notified in the last 24 hours
        }

        if (daysUntilExpiry < 0) {
          // Contract expired
          await notificationsService.create({
            title: 'Contract Expired',
            message: `The rental contract for "${apiary.name}" has expired. Please renew or relocate your hives.`,
            notification_type: 'contract_expiry',
            severity: 'high',
            related_type: 'apiary',
            related_id: apiary.id,
          });
        } else if (daysUntilExpiry <= 7) {
          // Contract expiring within a week
          await notificationsService.create({
            title: 'Contract Expiring Soon',
            message: `The rental contract for "${apiary.name}" expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}.`,
            notification_type: 'contract_expiry',
            severity: 'high',
            related_type: 'apiary',
            related_id: apiary.id,
          });
        } else if (daysUntilExpiry <= 30) {
          // Contract expiring within 30 days
          await notificationsService.create({
            title: 'Contract Expiring in 30 Days',
            message: `The rental contract for "${apiary.name}" expires in ${daysUntilExpiry} days. Start planning for renewal or relocation.`,
            notification_type: 'contract_expiry',
            severity: 'medium',
            related_type: 'apiary',
            related_id: apiary.id,
          });
        }
      }
    } catch (err) {
      console.warn('Failed to check contract expiry:', err);
    }
  },
};
