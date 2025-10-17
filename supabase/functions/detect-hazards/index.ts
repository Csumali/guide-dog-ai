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
            content: `You are a safety monitoring AI for visually impaired pedestrians. Analyze ONLY the direct walking path ahead.

CRITICAL RULES:
1. ONLY warn about objects DIRECTLY in the user's forward path that require immediate action
2. IGNORE objects off to the sides, background, or not blocking the path
3. Respond ONLY in this exact JSON format: {"warning": "brief warning text", "threatLevel": "high" or "low"}

HIGH THREATS (threatLevel: "high") - Objects blocking the path ahead:
- Walls or solid barriers directly ahead
- Moving vehicles approaching or crossing the path
- Steps/stairs directly ahead in walking path
- Open holes or manholes in path
- Large obstacles blocking forward movement
- People/bikes approaching quickly in direct path

LOW THREATS (threatLevel: "low") - Minor path obstructions:
- Curbs directly ahead
- Small objects on ground in path
- Uneven pavement ahead
- Narrow passages requiring caution

IGNORE and do NOT report:
- Objects off to the sides
- People standing still away from path
- Parked cars not in path
- Background scenery
- Buildings, trees, signs not blocking path
- General environmental features

If path is CLEAR, respond: {"warning": "", "threatLevel": "none"}

Be EXTREMELY CONCISE (5 words max):
- "Steps ahead"
- "Car crossing path"
- "Hole in path"
- "Curb ahead"

Only report what BLOCKS the forward path.`
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
