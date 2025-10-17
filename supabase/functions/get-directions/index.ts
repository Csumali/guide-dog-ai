import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { origin, destination, mode = 'walking' } = await req.json();
    
    if (!origin || !destination) {
      throw new Error('Origin and destination are required');
    }

    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('GOOGLE_MAPS_API_KEY not configured');
    }

    console.log('Fetching directions from Google Maps API...');
    console.log('Origin:', origin);
    console.log('Destination:', destination);
    console.log('Mode:', mode);

    const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
    url.searchParams.append('origin', origin);
    url.searchParams.append('destination', destination);
    url.searchParams.append('mode', mode);
    url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Maps API error:', response.status, errorText);
      throw new Error(`Google Maps API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 'OK') {
      console.error('Google Maps API status:', data.status);
      throw new Error(`Directions not available: ${data.status}`);
    }

    console.log('Directions retrieved successfully');

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-directions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
