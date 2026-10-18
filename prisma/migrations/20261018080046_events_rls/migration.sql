-- Turn on Row Level Security for the new tables, like the other tables.
-- There are no policies, so Supabase's public API (anon key) cannot read or write them.
-- The website uses Prisma with the database owner, which is not affected by RLS.
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
