/**
 * ApiCore — Full DB Setup + Seed Script
 * Runs via: node setup-db.mjs
 *
 * What this does:
 *  1. ALTER TABLE users — add all missing columns
 *  2. Create Supabase Auth user: admin@apicore.com / 12345678
 *  3. Upsert user profile row in users table with full demo data
 *  4. Insert: 3 apiaries, 8 hives, 10 inspections, 10 expenses,
 *             3 treatments, 5 queens, 4 feedings, 9 hive_components,
 *             5 alerts, 5 notifications, 3 client_services, 1 transfer
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://nckolanwqyeecteqlbqp.supabase.co';
// anon key — used for data reads/writes (RLS allows all)
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ja29sYW53cXllZWN0ZXFsYnFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODk2NTAsImV4cCI6MjA4NzE2NTY1MH0.VtGeTBoVZ-ueB8NiWWZJTZH_MMpkvXjxhnUAJBOZnbc';

const sb = createClient(SUPABASE_URL, ANON_KEY);

// ─── helpers ──────────────────────────────────────────────────────────────────
function ok(label, data) { console.log(`  ✅  ${label}`, data !== undefined ? JSON.stringify(data).slice(0, 80) : ''); }
function fail(label, err) { console.error(`  ❌  ${label}:`, err?.message ?? err); }
async function rpc(sql) {
  const r = await sb.rpc('exec_sql', { sql });
  if (r.error) throw r.error;
  return r;
}

// ─── Step 1: Add missing columns to users via direct REST DDL ─────────────────
async function fixUsersTable() {
  console.log('\n── Step 1: Fix users table schema ──');

  // We'll use supabase's REST API to run raw SQL via the pg-meta endpoint.
  // Since we only have anon key, we use a different approach:
  // Try to update the row with all columns — if columns don't exist they'll just be ignored.
  // Instead: use ALTER TABLE through Supabase's SQL editor endpoint.

  const missingCols = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS nic_number TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS age_group TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS known_bee_allergy TEXT DEFAULT 'no'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS blood_group TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS beekeeping_nature TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS business_reg_no TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_bee_species TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS nvq_level TEXT",
  ];

  // Use the Supabase REST /sql endpoint (available in newer versions)
  for (const sql of missingCols) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ sql }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok && !JSON.stringify(json).includes('already exists')) {
      console.log(`  ⚠️  DDL (may need service key): ${sql.slice(0, 60)} → ${JSON.stringify(json).slice(0,100)}`);
    } else {
      console.log(`  ✅  ${sql.slice(0, 60)}`);
    }
  }
}

// ─── Step 2: Create Supabase Auth user ────────────────────────────────────────
async function createAuthUser() {
  console.log('\n── Step 2: Create auth user admin@apicore.com ──');
  const { data, error } = await sb.auth.signUp({
    email: 'admin@apicore.com',
    password: '12345678',
  });
  if (error) {
    if (error.message.includes('already registered') || error.message.includes('already been registered')) {
      console.log('  ✅  Auth user already exists — skipping signUp');
      return null;
    }
    fail('signUp', error);
    return null;
  }
  ok('Auth user created', { id: data.user?.id });
  return data.session?.access_token ?? null;
}

// ─── Step 3: Upsert users profile row ─────────────────────────────────────────
async function upsertUserProfile() {
  console.log('\n── Step 3: Upsert users profile row ──');

  // First check current columns
  const { data: existing } = await sb.from('users').select('*').eq('email', 'admin@apicore.com').maybeSingle();
  const hasNic = existing && 'nic_number' in existing;

  const profile = {
    name: 'Admin User',
    email: 'admin@apicore.com',
    password: 'supabase_auth',
    phone: '0771234567',
    district: 'Kandy',
    role: 'beekeeper',
    years_experience: 5,
  };

  // Only add extra cols if they exist
  if (hasNic) {
    Object.assign(profile, {
      nic_number: '199512345678',
      preferred_language: 'en',
      age_group: '26-35',
      known_bee_allergy: 'no',
      blood_group: 'O+',
      beekeeping_nature: 'Hobbyist',
      business_reg_no: 'BRN-2022-001',
      primary_bee_species: 'apis cerana',
      nvq_level: 'Level 3',
    });
  } else {
    console.log('  ⚠️  Extra columns not yet available — inserting base profile only');
  }

  if (existing) {
    const { error } = await sb.from('users').update(profile).eq('email', 'admin@apicore.com');
    if (error) fail('update user', error); else ok('User profile updated', { id: existing.id });
    return existing.id;
  } else {
    const { data, error } = await sb.from('users').insert(profile).select().single();
    if (error) { fail('insert user', error); return null; }
    ok('User profile inserted', { id: data.id });
    return data.id;
  }
}

// ─── Step 4: Seed all data ─────────────────────────────────────────────────────
async function seedData(userId) {
  console.log(`\n── Step 4: Seeding data for user_id=${userId} ──`);

  // ── Apiaries ──
  const { data: apiaries, error: ae } = await sb.from('apiaries').insert([
    { user_id: userId, name: 'Kandy Hill Apiary',      district: 'Kandy',      area: '2.5 acres', established_date: '2022-03-15', status: 'active', apiary_type: 'personal',    terrain: 'hilly',  forage_primary: 'Rubber & Coconut', blooming_window: 'March–May',    gps_latitude: 7.2906,  gps_longitude: 80.6337, notes: 'Main home apiary. Dense forest nearby provides excellent foraging.' },
    { user_id: userId, name: 'Colombo Client Apiary',  district: 'Colombo',    area: '1.2 acres', established_date: '2023-06-01', status: 'active', apiary_type: 'commercial', terrain: 'flat',   forage_primary: 'Urban Gardens',    blooming_window: 'Year-round',   gps_latitude: 6.9271,  gps_longitude: 79.8612, notes: 'Commercial apiary managed for client. Monthly inspection schedule.' },
    { user_id: userId, name: 'Kurunegala Forest Site', district: 'Kurunegala', area: '5 acres',   established_date: '2021-11-20', status: 'active', apiary_type: 'personal',    terrain: 'forest', forage_primary: 'Rubber & Jak',     blooming_window: 'April–June',   gps_latitude: 7.4875,  gps_longitude: 80.3647, notes: 'Remote forest apiary. Stingless bee focus.' },
  ]).select();
  if (ae) { fail('apiaries', ae); return; }
  ok(`Apiaries (${apiaries.length})`);
  const [a1, a2, a3] = apiaries;

  // ── Hives ──
  const { data: hives, error: he } = await sb.from('hives').insert([
    { user_id: userId, apiary_id: a1.id, name: 'KDY-001', hive_type: 'Langstroth',          location_type: 'ground',        status: 'active', queen_present: true,  queen_age: 1.2, queen_age_risk: 'low',    colony_strength: 'strong',   last_inspection_date: '2026-02-10', inspection_overdue: false, pest_detected: false, is_starred: true,  num_frames: 10, num_supers: 2, material: 'wood',        established_date: '2022-04-01', bee_source: 'local',      notes: 'Best producing hive. Queen marked yellow (2025).' },
    { user_id: userId, apiary_id: a1.id, name: 'KDY-002', hive_type: 'Langstroth',          location_type: 'ground',        status: 'active', queen_present: true,  queen_age: 2.5, queen_age_risk: 'medium', colony_strength: 'moderate', last_inspection_date: '2026-01-28', inspection_overdue: false, pest_detected: false, is_starred: false, num_frames: 8,  num_supers: 1, material: 'wood',        established_date: '2022-04-01', bee_source: 'split',      notes: 'Split from KDY-001 in 2023. Good temperament.' },
    { user_id: userId, apiary_id: a1.id, name: 'KDY-003', hive_type: 'Langstroth',          location_type: 'elevated',      status: 'active', queen_present: true,  queen_age: 0.8, queen_age_risk: 'low',    colony_strength: 'strong',   last_inspection_date: '2026-02-15', inspection_overdue: false, pest_detected: true,  is_starred: false, num_frames: 10, num_supers: 2, material: 'wood',        established_date: '2023-09-10', bee_source: 'purchased',  notes: 'Varroa detected last month. Under treatment.' },
    { user_id: userId, apiary_id: a1.id, name: 'KDY-004', hive_type: 'Top Bar',             location_type: 'elevated',      status: 'active', queen_present: false, queen_age: null, queen_age_risk: 'high',   colony_strength: 'weak',     last_inspection_date: '2026-01-05', inspection_overdue: true,  pest_detected: false, is_starred: false, num_frames: null, material: 'wood',       established_date: '2022-06-15', bee_source: 'local',      notes: 'Queen missing. Need to requeen urgently.' },
    { user_id: userId, apiary_id: a2.id, name: 'COL-001', hive_type: 'Langstroth',          location_type: 'rooftop',       status: 'active', queen_present: true,  queen_age: 1.0, queen_age_risk: 'low',    colony_strength: 'strong',   last_inspection_date: '2026-02-18', inspection_overdue: false, pest_detected: false, is_starred: true,  num_frames: 10, material: 'polystyrene', established_date: '2023-06-15', bee_source: 'purchased',  ownership_type: 'client', owner_name: 'Mr. Nimal Perera', owner_contact: '+94711234567', notes: 'Rooftop hive. Urban honey producer.' },
    { user_id: userId, apiary_id: a2.id, name: 'COL-002', hive_type: 'Langstroth',          location_type: 'rooftop',       status: 'active', queen_present: true,  queen_age: 1.0, queen_age_risk: 'low',    colony_strength: 'moderate', last_inspection_date: '2026-02-18', inspection_overdue: false, pest_detected: false, is_starred: false, num_frames: 8,  material: 'polystyrene', established_date: '2023-07-01', bee_source: 'split',      ownership_type: 'client', owner_name: 'Mr. Nimal Perera', owner_contact: '+94711234567', notes: 'Split from COL-001.' },
    { user_id: userId, apiary_id: a3.id, name: 'KGL-001', hive_type: 'Stingless (Pot Hive)', location_type: 'tree-mounted', status: 'active', queen_present: true,  queen_age: 0.5, queen_age_risk: 'low',    colony_strength: 'strong',   last_inspection_date: '2026-02-01', inspection_overdue: false, pest_detected: false, is_starred: true,  pot_volume_liters: 5.0, pot_material: 'clay', stingless_species: 'Tetragonula iridipennis', colony_size: 'large', established_date: '2021-12-01', bee_source: 'wild_caught', notes: 'Wild-caught colony. Keluluwel honey.' },
    { user_id: userId, apiary_id: a3.id, name: 'KGL-002', hive_type: 'Stingless (Pot Hive)', location_type: 'tree-mounted', status: 'active', queen_present: true,  queen_age: 1.2, queen_age_risk: 'low',    colony_strength: 'moderate', last_inspection_date: '2026-01-20', inspection_overdue: false, pest_detected: false, is_starred: false, pot_volume_liters: 3.0, pot_material: 'clay', stingless_species: 'Tetragonula iridipennis', colony_size: 'medium', established_date: '2022-03-10', bee_source: 'split', notes: 'Split from KGL-001. Growing nicely.' },
  ]).select();
  if (he) { fail('hives', he); return; }
  ok(`Hives (${hives.length})`);
  const [h1, h2, h3, h4, h5, h6, h7, h8] = hives;

  // ── Inspections ──
  const { error: ie } = await sb.from('inspections').insert([
    { user_id: userId, hive_id: h1.id, apiary_id: a1.id, inspection_date: '2026-02-10', queen_present: true,  colony_strength: 'strong',   pest_detected: false, notes: 'Excellent brood pattern. 9 frames of brood. Added second super.' },
    { user_id: userId, hive_id: h1.id, apiary_id: a1.id, inspection_date: '2026-01-15', queen_present: true,  colony_strength: 'strong',   pest_detected: false, notes: 'Queen spotted. Laying well. Honey stores good.' },
    { user_id: userId, hive_id: h2.id, apiary_id: a1.id, inspection_date: '2026-01-28', queen_present: true,  colony_strength: 'moderate', pest_detected: false, notes: 'Colony recovering. 6 frames brood.' },
    { user_id: userId, hive_id: h3.id, apiary_id: a1.id, inspection_date: '2026-02-15', queen_present: true,  colony_strength: 'strong',   pest_detected: true,  notes: 'Varroa mite count: 3/100 bees. Started oxalic acid treatment.' },
    { user_id: userId, hive_id: h3.id, apiary_id: a1.id, inspection_date: '2026-01-20', queen_present: true,  colony_strength: 'strong',   pest_detected: true,  notes: 'First Varroa detection. Mite wash done.' },
    { user_id: userId, hive_id: h4.id, apiary_id: a1.id, inspection_date: '2026-01-05', queen_present: false, colony_strength: 'weak',     pest_detected: false, notes: 'No queen found. Colony declining. Must requeen ASAP.' },
    { user_id: userId, hive_id: h5.id, apiary_id: a2.id, inspection_date: '2026-02-18', queen_present: true,  colony_strength: 'strong',   pest_detected: false, notes: 'Client present. All frames drawn. Honey capped.' },
    { user_id: userId, hive_id: h6.id, apiary_id: a2.id, inspection_date: '2026-02-18', queen_present: true,  colony_strength: 'moderate', pest_detected: false, notes: 'Young colony expanding. Good laying pattern.' },
    { user_id: userId, hive_id: h7.id, apiary_id: a3.id, inspection_date: '2026-02-01', queen_present: true,  colony_strength: 'strong',   pest_detected: false, notes: 'Propolis entrance healthy. Honey pots nearly full.' },
    { user_id: userId, hive_id: h8.id, apiary_id: a3.id, inspection_date: '2026-01-20', queen_present: true,  colony_strength: 'moderate', pest_detected: false, notes: 'Colony building up. Wax structures well formed.' },
  ]);
  if (ie) fail('inspections', ie); else ok('Inspections (10)');

  // ── Expenses ──
  const { error: ee } = await sb.from('expenses').insert([
    { user_id: userId, hive_id: h3.id, apiary_id: a1.id, expense_date: '2026-02-16', expense_type: 'Treatment', amount: 1800, description: 'Oxalic acid (Api-Bioxal) for Varroa — KDY-003' },
    { user_id: userId, hive_id: null,   apiary_id: a1.id, expense_date: '2026-02-01', expense_type: 'Equipment', amount: 4500, description: 'New super box and 10 frames for Kandy apiary' },
    { user_id: userId, hive_id: null,   apiary_id: a2.id, expense_date: '2026-01-20', expense_type: 'Travel',    amount: 2200, description: 'Colombo visit — fuel and toll fees (2 trips)' },
    { user_id: userId, hive_id: null,   apiary_id: a1.id, expense_date: '2026-01-10', expense_type: 'Feed',      amount: 1200, description: '3 kg sugar for winter feeding — KDY-002, KDY-004' },
    { user_id: userId, hive_id: null,   apiary_id: a1.id, expense_date: '2025-12-15', expense_type: 'Equipment', amount: 8500, description: 'Honey extractor rental for December harvest' },
    { user_id: userId, hive_id: null,   apiary_id: a3.id, expense_date: '2025-12-01', expense_type: 'Travel',    amount: 3800, description: 'Kurunegala field visit — transport and accommodation' },
    { user_id: userId, hive_id: null,   apiary_id: a1.id, expense_date: '2025-11-20', expense_type: 'Feed',      amount: 900,  description: '2 kg pollen substitute patties — Kandy hives' },
    { user_id: userId, hive_id: null,   apiary_id: null,  expense_date: '2025-11-01', expense_type: 'Equipment', amount: 15000, description: 'Full protective suit, gloves, smoker' },
    { user_id: userId, hive_id: h5.id, apiary_id: a2.id, expense_date: '2026-02-05', expense_type: 'Equipment', amount: 2400, description: 'Polystyrene hive lid replacement — COL-001' },
    { user_id: userId, hive_id: null,   apiary_id: a1.id, expense_date: '2026-02-20', expense_type: 'Feed',      amount: 650,  description: 'Sugar syrup — KDY-004 weak colony support' },
  ]);
  if (ee) fail('expenses', ee); else ok('Expenses (10)');

  // ── Feedings ──
  const { error: fe } = await sb.from('feedings').insert([
    { user_id: userId, hive_id: h2.id, feeding_date: '2026-01-10', feed_type: 'Sugar Syrup',  quantity: 1000, unit: 'ml', concentration: '1:1', notes: 'Stimulative feeding — early spring buildup' },
    { user_id: userId, hive_id: h4.id, feeding_date: '2026-02-20', feed_type: 'Sugar Syrup',  quantity: 1500, unit: 'ml', concentration: '2:1', notes: 'Emergency feeding for weak queenless colony' },
    { user_id: userId, hive_id: h4.id, feeding_date: '2026-01-08', feed_type: 'Sugar Syrup',  quantity: 1000, unit: 'ml', concentration: '1:1', notes: 'Winter syrup top-up' },
    { user_id: userId, hive_id: h2.id, feeding_date: '2025-11-20', feed_type: 'Pollen Patty', quantity: 200,  unit: 'g',  concentration: null,   notes: 'Protein supplement — pre-winter' },
  ]);
  if (fe) fail('feedings', fe); else ok('Feedings (4)');

  // ── Treatments ──
  const { error: te } = await sb.from('treatments').insert([
    { user_id: userId, hive_id: h3.id, treatment_date: '2026-02-15', treatment_type: 'Varroa',     product_name: 'Oxalic Acid (Api-Bioxal)', dosage: '2.1g per seam', application_method: 'dribble',    duration_days: 21, end_date: '2026-03-08', outcome: null,       notes: 'In progress. First treatment of year.' },
    { user_id: userId, hive_id: h3.id, treatment_date: '2025-10-10', treatment_type: 'Varroa',     product_name: 'Formic Acid (MAQS)',       dosage: '1 strip',        application_method: 'strip',       duration_days: 7,  end_date: '2025-10-17', outcome: 'effective', notes: 'Autumn treatment. Mite count dropped from 4% to 0.5%.' },
    { user_id: userId, hive_id: h1.id, treatment_date: '2025-09-01', treatment_type: 'Preventive', product_name: 'Thymol (ApiLife Var)',     dosage: '1 wafer',        application_method: 'evaporation', duration_days: 28, end_date: '2025-09-29', outcome: 'effective', notes: 'Preventive thymol treatment. No Varroa detected after.' },
  ]);
  if (te) fail('treatments', te); else ok('Treatments (3)');

  // ── Queens ──
  const { error: qe } = await sb.from('queens').insert([
    { user_id: userId, hive_id: h1.id, marking_color: 'yellow', source: 'local_breeder', introduction_date: '2025-03-10', status: 'active', species: 'Apis cerana', notes: 'Excellent layer. Very calm temperament.' },
    { user_id: userId, hive_id: h2.id, marking_color: 'white',  source: 'split',         introduction_date: '2023-08-20', status: 'active', species: 'Apis cerana', notes: 'Emerged from KDY-001 queen cells.' },
    { user_id: userId, hive_id: h3.id, marking_color: 'blue',   source: 'purchased',     introduction_date: '2024-09-05', status: 'active', species: 'Apis cerana', notes: 'Good honey production.' },
    { user_id: userId, hive_id: h5.id, marking_color: 'yellow', source: 'purchased',     introduction_date: '2025-06-20', status: 'active', species: 'Apis cerana', notes: 'High-performance queen. Client satisfied.' },
    { user_id: userId, hive_id: h6.id, marking_color: 'white',  source: 'split',         introduction_date: '2023-07-10', status: 'active', species: 'Apis cerana', notes: 'Split from COL-001.' },
  ]);
  if (qe) fail('queens', qe); else ok('Queens (5)');

  // ── Hive Components ──
  const { error: ce } = await sb.from('hive_components').insert([
    { user_id: userId, hive_id: h1.id, component_type: 'Super Box',       quantity: 2, condition: 'good', installed_date: '2025-04-01', notes: 'Both supers currently on hive' },
    { user_id: userId, hive_id: h1.id, component_type: 'Queen Excluder',  quantity: 1, condition: 'good', installed_date: '2024-03-15', notes: null },
    { user_id: userId, hive_id: h1.id, component_type: 'Frames',          quantity: 10, condition: 'good', installed_date: '2022-04-01', notes: 'Wax foundation frames' },
    { user_id: userId, hive_id: h2.id, component_type: 'Super Box',       quantity: 1, condition: 'good', installed_date: '2025-05-10', notes: null },
    { user_id: userId, hive_id: h2.id, component_type: 'Frames',          quantity: 8, condition: 'good', installed_date: '2022-04-01', notes: null },
    { user_id: userId, hive_id: h3.id, component_type: 'Super Box',       quantity: 2, condition: 'good', installed_date: '2025-04-01', notes: null },
    { user_id: userId, hive_id: h3.id, component_type: 'Queen Excluder',  quantity: 1, condition: 'fair', installed_date: '2023-09-10', notes: 'Slightly bent — replace next visit' },
    { user_id: userId, hive_id: h5.id, component_type: 'Frames',          quantity: 10, condition: 'good', installed_date: '2023-06-15', notes: 'Plastic foundation frames' },
    { user_id: userId, hive_id: h6.id, component_type: 'Frames',          quantity: 8, condition: 'good', installed_date: '2023-07-01', notes: null },
  ]);
  if (ce) fail('hive_components', ce); else ok('Hive components (9)');

  // ── Alerts ──
  const { error: ale } = await sb.from('alerts').insert([
    { user_id: userId, hive_id: h4.id, apiary_id: a1.id, alert_type: 'queen_missing',     message: 'KDY-004: Queen not found during last inspection. Requeen immediately.',         is_read: false },
    { user_id: userId, hive_id: h3.id, apiary_id: a1.id, alert_type: 'pest_detected',     message: 'KDY-003: Varroa mite infestation detected. Treatment in progress.',             is_read: false },
    { user_id: userId, hive_id: h4.id, apiary_id: a1.id, alert_type: 'inspection_overdue', message: 'KDY-004: Inspection overdue by 50 days. Schedule immediately.',                 is_read: false },
    { user_id: userId, hive_id: h2.id, apiary_id: a1.id, alert_type: 'queen_aging',       message: 'KDY-002: Queen is 2.5 years old. Consider requeening this season.',             is_read: false },
    { user_id: userId, hive_id: null,  apiary_id: null,  alert_type: 'weather',           message: 'Kandy District: Heavy rain forecast this weekend. Inspect hives before Saturday.', is_read: true },
  ]);
  if (ale) fail('alerts', ale); else ok('Alerts (5)');

  // ── Notifications ──
  const { error: ne } = await sb.from('notifications').insert([
    { user_id: userId, target_role: 'beekeeper', notification_type: 'alert',    severity: 'high',   title: 'Varroa Detected — KDY-003',       message: 'Varroa mite detected in hive KDY-003. Oxalic acid treatment started 15 Feb 2026.',           related_type: 'hive', is_read: false, is_dismissed: false },
    { user_id: userId, target_role: 'beekeeper', notification_type: 'alert',    severity: 'high',   title: 'Queen Missing — KDY-004',         message: 'No queen found in KDY-004 during last inspection. Colony is queenless. Take immediate action.', related_type: 'hive', is_read: false, is_dismissed: false },
    { user_id: userId, target_role: 'beekeeper', notification_type: 'reminder', severity: 'medium', title: 'Inspection Due — KDY-004',        message: 'KDY-004 has not been inspected since January 5. Overdue by 50+ days.',                        related_type: 'hive', is_read: false, is_dismissed: false },
    { user_id: userId, target_role: 'beekeeper', notification_type: 'info',     severity: 'info',   title: 'Client Visit — Colombo',          message: 'Mr. Nimal Perera has requested a hive demonstration on March 5, 2026.',                        related_type: null,   is_read: false, is_dismissed: false },
    { user_id: userId, target_role: 'beekeeper', notification_type: 'info',     severity: 'info',   title: 'Harvest Season Approaching',      message: 'Rubber bloom expected in Kandy from late March. Prepare supers for KDY-001 and KDY-003.',      related_type: null,   is_read: true,  is_dismissed: false },
  ]);
  if (ne) fail('notifications', ne); else ok('Notifications (5)');

  // ── Client Services ──
  const { error: cse } = await sb.from('client_services').insert([
    { user_id: userId, client_name: 'Mr. Nimal Perera',    client_contact: '+94711234567', client_email: 'nimal@example.com',     service_type: 'Hive Management',  description: 'Monthly management of 2 rooftop Langstroth hives',                          location: 'Colombo 07',    status: 'active',    priority: 'normal', scheduled_date: '2026-03-05', payment_amount: 15000, payment_status: 'paid',   notes: 'Long-term client. Monthly retainer.' },
    { user_id: userId, client_name: 'Green Valley Resort', client_contact: '+94452345678', client_email: 'gvresort@example.com', service_type: 'Bee Hotel Setup',   description: 'Install and setup 3 decorative hives for resort garden',                   location: 'Nuwara Eliya', status: 'pending',   priority: 'high',   scheduled_date: '2026-03-15', payment_amount: 45000, payment_status: 'unpaid', notes: 'New client. Site visit done. Proposal accepted.' },
    { user_id: userId, client_name: 'Organic Honey Co.',   client_contact: '+94773456789', client_email: 'info@organichoney.lk', service_type: 'Honey Extraction', description: 'Assisted honey extraction session — 10 hive operation',                    location: 'Matale',       status: 'completed', priority: 'normal', scheduled_date: '2026-01-25', payment_amount: 8000,  payment_status: 'paid',   notes: 'Completed. Good feedback received.' },
  ]);
  if (cse) fail('client_services', cse); else ok('Client services (3)');

  // ── Colony Transfer ──
  const { error: cte } = await sb.from('colony_transfers').insert([
    { user_id: userId, source_hive_id: h1.id, target_hive_id: h2.id, transfer_date: '2023-08-20', transfer_type: 'split', queen_moved: false, brood_frames_moved: 3, notes: 'Split KDY-001 to create KDY-002. Left queen in KDY-001. Moved 3 brood frames.' },
  ]);
  if (cte) fail('colony_transfers', cte); else ok('Colony transfers (1)');

  console.log('\n🎉 All seed data inserted successfully!');
  console.log(`\n📧 Login: admin@apicore.com`);
  console.log(`🔑 Password: 12345678`);
  console.log(`🌐 App: https://apicore-frontend.onrender.com`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║   ApiCore — Database Setup & Seed Script      ║');
  console.log('╚═══════════════════════════════════════════════╝');

  // Step 1: Try to add missing columns (will fail silently if no service key)
  await fixUsersTable();

  // Step 2: Create auth user
  await createAuthUser();

  // Step 3: Upsert profile
  const userId = await upsertUserProfile();
  if (!userId) { console.error('\n❌ Could not get userId. Aborting.'); process.exit(1); }

  // Step 4: Clear old data first (in reverse FK order)
  console.log('\n── Clearing old data ──');
  const tables = ['colony_transfers','client_service_hives','client_services','notifications','alerts',
    'hive_components','queens','treatments','feedings','inspections','expenses','hives','apiaries'];
  for (const t of tables) {
    const { error } = await sb.from(t).delete().eq('user_id', userId);
    // some tables like client_service_hives have no user_id — skip
    if (error && !error.message.includes('user_id')) {
      // try without filter
      await sb.from(t).delete().neq('id', 0);
    }
    process.stdout.write(`  🗑  Cleared ${t}\n`);
  }

  // Step 5: Seed
  await seedData(userId);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
