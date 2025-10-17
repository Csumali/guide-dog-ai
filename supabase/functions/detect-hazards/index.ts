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
    const { imageData } = await req.json();
    
    if (!imageData) {
      throw new Error('No image data provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Analyzing for hazards with Gemini Vision...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a safety monitoring AI for visually impaired pedestrians. Your ONLY job is to detect immediate hazards and threats.

CRITICAL: You must respond ONLY in this exact JSON format:
{"warning": "brief warning text", "threatLevel": "high" or "low"}

HIGH THREATS (threatLevel: "high"):
- Moving vehicles approaching user
- Vehicles backing up nearby
- Open manholes or large holes
- Steps/stairs immediately ahead
- Construction barriers blocking path
- People/bikes approaching quickly

LOW THREATS (threatLevel: "low"):
- Parked cars nearby
- Curbs or small obstacles
- Uneven pavement
- Benches or poles on path
- People standing still nearby

If NO hazards detected, respond: {"warning": "", "threatLevel": "none"}

Be CONCISE. Examples:
- "Car approaching from left"
- "Steps ahead, 3 meters"
- "Bicycle coming fast from right"
- "Open hole 2 meters ahead"

DO NOT describe scenery. ONLY report hazards.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image for immediate hazards or approaching dangers. Respond in JSON format only.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{"warning": "", "threatLevel": "none"}';
    
    console.log('Hazard detection response:', content);

    // Parse JSON response
    let result;
    try {
      result = JSON.parse(content);
    } catch (e) {
      // If not valid JSON, try to extract warning from text
      console.warn('Failed to parse JSON, using text extraction');
      result = {
        warning: content.includes('no hazard') || content.includes('clear') ? '' : content.substring(0, 100),
        threatLevel: content.toLowerCase().includes('vehicle') || content.toLowerCase().includes('car') ? 'high' : 'low'
      };
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in detect-hazards:', error);
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
