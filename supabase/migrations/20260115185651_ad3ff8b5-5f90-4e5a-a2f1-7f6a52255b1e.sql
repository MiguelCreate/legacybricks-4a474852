-- Create saved_listings table for Favorites feature
CREATE TABLE public.saved_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  url TEXT,
  naam TEXT NOT NULL,
  locatie TEXT,
  vraagprijs NUMERIC,
  oppervlakte_m2 NUMERIC,
  kamers INTEGER,
  status TEXT DEFAULT 'nieuw', -- nieuw, bezocht, bod_gedaan, gekocht, afgewezen
  notities TEXT,
  bron TEXT, -- idealista, funda, etc.
  foto_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own saved listings"
  ON public.saved_listings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved listings"
  ON public.saved_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved listings"
  ON public.saved_listings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved listings"
  ON public.saved_listings FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_saved_listings_updated_at
  BEFORE UPDATE ON public.saved_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();