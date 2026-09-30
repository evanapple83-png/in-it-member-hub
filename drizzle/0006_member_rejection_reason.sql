-- Redesign toegang: optionele toelichting van de coordinator bij een afgewezen aanvraag.
-- Wordt getoond op /wachten. Nullable, dus bestaande rijen blijven ongewijzigd.

alter table members add column if not exists rejection_reason text;
