-- Add recibo_verde field to rooms table (per unit/room track if green receipt is issued)
ALTER TABLE public.rooms ADD COLUMN recibo_verde boolean NOT NULL DEFAULT false;

-- Add borg (deposit) field to tenants table (track how much deposit was paid)
ALTER TABLE public.tenants ADD COLUMN borg numeric DEFAULT 0;

-- Add index for better query performance
CREATE INDEX idx_rooms_recibo_verde ON public.rooms(recibo_verde) WHERE recibo_verde = true;