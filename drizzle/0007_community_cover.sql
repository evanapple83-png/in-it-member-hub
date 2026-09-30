-- Redesign beheer: optionele omslagfoto per groep (upload via Vercel Blob).
-- Nullable, dus bestaande groepen houden hun vaste uitsnede van de IN-IT-afbeelding.

alter table communities add column if not exists cover_image_url text;
