-- Supabase SQL Editor script
-- Purpose: Add indexes to speed up beekeeper marketplace / "Find Land" queries.
-- Safe to run multiple times.

-- landowner_listings: filter by status + order by created_at
DO $$
BEGIN
  IF to_regclass('public.landowner_listings') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS landowner_listings_status_created_at_idx ON public.landowner_listings (status, created_at DESC)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS landowner_listings_plot_id_idx ON public.landowner_listings (plot_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS landowner_listings_user_id_idx ON public.landowner_listings (user_id)';
  END IF;
END $$;

-- landowner_bids: accepted hive counts + per-user latest status
DO $$
BEGIN
  IF to_regclass('public.landowner_bids') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS landowner_bids_listing_status_idx ON public.landowner_bids (listing_id, status)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS landowner_bids_beekeeper_created_at_idx ON public.landowner_bids (beekeeper_user_id, created_at DESC)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS landowner_bids_beekeeper_listing_created_at_idx ON public.landowner_bids (beekeeper_user_id, listing_id, created_at DESC)';
  END IF;
END $$;

-- landowner_contracts: lookup by bid_id
DO $$
BEGIN
  IF to_regclass('public.landowner_contracts') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS landowner_contracts_bid_id_idx ON public.landowner_contracts (bid_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS landowner_contracts_listing_id_idx ON public.landowner_contracts (listing_id)';
  END IF;
END $$;
