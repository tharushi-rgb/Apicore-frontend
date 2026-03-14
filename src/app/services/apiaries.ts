import { supabase } from './supabaseClient';
import { authService } from './auth';

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
    landlord_contact: landOwnership === 'not_owned' ? sanitizeString(payload.landlord_contact) : null,
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
    return parseApiaryRecord(data as Apiary);
  },

  async update(id: number, payload: Partial<ApiaryPayload>) {
    const normalized = normalizePayload(payload);
    const { data, error } = await supabase
      .from('apiaries')
      .update({ ...normalized, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return parseApiaryRecord(data as Apiary);
  },

  async delete(id: number) {
    const { error } = await supabase.from('apiaries').delete().eq('id', id);
    if (error) throw new Error(error.message);
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
};
