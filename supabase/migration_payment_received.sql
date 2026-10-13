-- Who paid cash + which finance staff received it (for fee receipts).
alter table public.payments
  add column if not exists received_from text,
  add column if not exists received_by text;
