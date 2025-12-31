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
    const { property } = await req.json();

    if (!property) {
      return new Response(
        JSON.stringify({ success: false, error: 'Property data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate current score based on property data
    const risicoScores = [
      property.risico_juridisch || 1,
      property.risico_markt || 1,
      property.risico_fiscaal || 1,
      property.risico_fysiek || 1,
      property.risico_operationeel || 1,
    ];
    const avgRisico = risicoScores.reduce((a, b) => a + b, 0) / risicoScores.length;
    const risicoFactor = Math.max(0, (5 - avgRisico) / 4); // Lower risk = higher factor

    // Energy label scoring
    const energyScores: Record<string, number> = {
      'A_plus': 10, 'A': 9, 'B': 7, 'C': 5, 'D': 3, 'E': 2, 'F': 1
    };
    const energyScore = property.energielabel ? energyScores[property.energielabel] || 5 : 5;

    // Occupancy scoring for short-term
    const occupancyScore = property.type_verhuur === 'korte_termijn' 
      ? Math.min(10, (property.st_bezetting_percentage || 0) / 10)
      : 7;

    // Calculate weighted score
    const baseScore = (
      (property.gezondheidsscore || 5) * 0.25 +
      energyScore * 0.2 +
      risicoFactor * 10 * 0.25 +
      occupancyScore * 0.15 +
      (property.waardering && property.aankoopprijs 
        ? Math.min(10, (property.waardering / property.aankoopprijs) * 5) 
        : 5) * 0.15
    );
    
    const calculatedScore = Math.round(Math.min(10, Math.max(1, baseScore)) * 10) / 10;

    // Build property context for AI
    const propertyContext = `
Pand: ${property.naam}
Locatie: ${property.locatie} (Portugal)
Status: ${property.status}
Type verhuur: ${property.type_verhuur || 'langdurig'}
Aankoopprijs: €${property.aankoopprijs?.toLocaleString('nl-NL') || 'Onbekend'}
Huidige waardering: €${property.waardering?.toLocaleString('nl-NL') || 'Onbekend'}
Maandelijkse huur: €${property.maandelijkse_huur?.toLocaleString('nl-NL') || 0}
Oppervlakte: ${property.oppervlakte_m2 || 'Onbekend'} m²
Energielabel: ${property.energielabel || 'Onbekend'}
Gezondheidsscore: ${property.gezondheidsscore || 5}/10
Huidige berekende score: ${calculatedScore}/10

Risicoprofiel:
- Juridisch risico: ${property.risico_juridisch || 1}/5
- Marktrisico: ${property.risico_markt || 1}/5
- Fiscaal risico: ${property.risico_fiscaal || 1}/5
- Fysiek risico: ${property.risico_fysiek || 1}/5
- Operationeel risico: ${property.risico_operationeel || 1}/5

Maandelijkse kosten:
- Condominium: €${property.condominium_maandelijks || 0}
- Water: €${property.water_maandelijks || 0}
- Gas: €${property.gas_maandelijks || 0}
- Elektriciteit: €${property.elektriciteit_maandelijks || 0}

${property.type_verhuur === 'korte_termijn' ? `
Short-term verhuur specifiek:
- Gemiddelde dagprijs: €${property.st_gemiddelde_dagprijs || 0}
- Bezettingspercentage: ${property.st_bezetting_percentage || 0}%
` : ''}
`;

    const prompt = `Je bent een ervaren vastgoedadviseur gespecialiseerd in de Portugese markt. Analyseer dit pand en geef een vrijblijvend verbeteringsadvies.

${propertyContext}

Geef je analyse in het volgende JSON-formaat (ALLEEN valid JSON, geen extra tekst):
{
  "score": ${calculatedScore},
  "kernpunten": ["max 3 korte punten waarom deze score"],
  "advies": {
    "prioriteit_1": {
      "titel": "Hoogste prioriteit verbetering",
      "beschrijving": "Korte beschrijving van de aanbeveling",
      "verwachte_impact": "Mogelijke impact op score/waarde",
      "geschatte_kosten": "Indicatie van kosten indien relevant"
    },
    "prioriteit_2": {
      "titel": "Tweede prioriteit",
      "beschrijving": "Korte beschrijving",
      "verwachte_impact": "Mogelijke impact"
    },
    "prioriteit_3": {
      "titel": "Derde prioriteit (nice-to-have)",
      "beschrijving": "Korte beschrijving"
    }
  },
  "markt_context": "Korte observatie over de lokale markt in ${property.locatie} gebaseerd op algemene kennis van de Portugese vastgoedmarkt (bijv. Algarve, Lissabon, Porto trends)",
  "extra_tips": ["1-2 praktische tips voor verhuurbaarheid of rendement"]
}

Focus op:
1. Concrete, uitvoerbare verbeteringen
2. Relevantie voor de Portugese markt
3. Energiebesparing en duurzaamheid (belangrijk in Portugal vanwege subsidies)
4. Verhuuroptimalisatie voor het specifieke type verhuur
5. Wees realistisch over kosten en impact`;

    console.log('Generating advice for property:', property.naam);

    const response = await fetch('https://ai-gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Je bent een Portugese vastgoedexpert. Antwoord ALLEEN met valid JSON, geen extra tekst of markdown.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to generate advice',
          score: calculatedScore 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content || '';
    
    console.log('AI response received');

    // Parse the JSON response
    let advice;
    try {
      // Remove any markdown code blocks if present
      const cleanedContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      advice = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Return a fallback response with the calculated score
      advice = {
        score: calculatedScore,
        kernpunten: [
          "Score gebaseerd op beschikbare data",
          "Energielabel en risicoprofiel meegewogen",
          "Meer data leidt tot nauwkeuriger advies"
        ],
        advies: {
          prioriteit_1: {
            titel: "Vul ontbrekende gegevens aan",
            beschrijving: "Voeg meer details toe aan je pand voor een nauwkeuriger advies",
            verwachte_impact: "Betere analyse en aanbevelingen"
          }
        },
        extra_tips: ["Houd je pandgegevens up-to-date voor de beste inzichten"]
      };
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        advice,
        calculatedScore 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error generating advice:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
