const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const JSON_SCHEMA = `{
  "aankoopprijs": number | null,
  "oppervlakte_m2": number | null,
  "locatie": string | null,
  "huurpotentie_lt": number | null,
  "huurpotentie_st_adr": number | null,
  "bezetting_st_pct": number | null,
  "renovatiekosten": number | null,
  "notariskosten": number | null,
  "makelaarskosten": number | null,
  "imt_pct": number | null,
  "imi_jaarlijks": number | null,
  "energielabel": string | null,
  "bouwjaar": number | null,
  "aantal_slaapkamers": number | null,
  "opmerking": string | null
}`;

const SYSTEM_PROMPT = `Je bent een vastgoed-analist die advertenties van woningen analyseert. 
Je krijgt de tekst van een vastgoedadvertentie en moet hieruit gestructureerde data extraheren.

Analyseer de advertentie en schat realistisch de waarden voor elke veld. Als een veld niet te bepalen is, gebruik null.

Schat huurpotentie_lt (lange termijn maandhuur) gebaseerd op locatie en m² (typisch €10-15/m² in Portugal).
Schat huurpotentie_st_adr (korte termijn dagprijs) gebaseerd op locatie en slaapkamers (typisch €50-150/nacht).
Schat bezetting_st_pct realistisch (typisch 50-70% voor vakantieverhuur).
Schat renovatiekosten als het pand renovatie nodig heeft (0 als nieuwbouw of gerenoveerd).
Notariskosten zijn typisch €1500-3000 in Portugal.
Makelaarskosten zijn typisch 3-5% of 0 als niet van toepassing.
IMT percentage hangt af van prijs en type (typisch 1-8% voor woningen in Portugal).
IMI is typisch 0.3-0.45% van de belastbare waarde per jaar.

Geef ALLEEN de JSON terug, geen andere tekst.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, url } = await req.json();

    if (!content) {
      console.log('No content provided');
      return new Response(
        JSON.stringify({ success: false, error: 'Content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing listing from URL:', url);
    console.log('Content length:', content.length);

    const projectRef = Deno.env.get('SUPABASE_URL')?.match(/https:\/\/([^.]+)/)?.[1] || '';
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    console.log('Project ref:', projectRef);
    console.log('Has Lovable API key:', !!lovableApiKey);

    // Use Lovable AI proxy for Gemini
    const response = await fetch('https://ai.lovable.dev/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`,
        'x-supabase-project-ref': projectRef,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: SYSTEM_PROMPT 
          },
          { 
            role: 'user', 
            content: `Analyseer deze vastgoedadvertentie en geef de data terug in dit exacte JSON-formaat:
${JSON_SCHEMA}

Advertentie URL: ${url || 'Onbekend'}

Advertentie tekst:
${content.substring(0, 8000)}` 
          }
        ],
      }),
    });

    console.log('AI API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      return new Response(
        JSON.stringify({ success: false, error: `AI analysis failed: ${response.status} - ${errorText}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    console.log('AI Response received');

    const aiContent = aiResponse.choices?.[0]?.message?.content || '';
    console.log('AI content length:', aiContent.length);
    
    // Extract JSON from response
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in AI response:', aiContent.substring(0, 500));
      return new Response(
        JSON.stringify({ success: false, error: 'Could not extract JSON from AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const parsedJson = JSON.parse(jsonMatch[0]);
      console.log('Successfully parsed JSON');
      
      return new Response(
        JSON.stringify({ success: true, data: parsedJson }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON in AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error analyzing listing:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
