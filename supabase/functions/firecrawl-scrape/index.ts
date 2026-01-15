const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, options } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping URL:', formattedUrl);

    // ALWAYS request screenshot first for guaranteed fallback
    // Then try markdown extraction
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['screenshot', 'markdown'], // Screenshot FIRST for guaranteed fallback
        onlyMainContent: options?.onlyMainContent ?? true,
        waitFor: options?.waitFor || 5000,
        timeout: 60000,
        actions: [
          { type: 'wait', milliseconds: 3000 } // Wait for page to fully load
        ],
      }),
    });

    const data = await response.json();

    // Extract screenshot and markdown from response (check both data structures)
    const screenshot = data?.data?.screenshot || data?.screenshot || '';
    const markdown = data?.data?.markdown || data?.markdown || '';
    const statusCode = data?.data?.metadata?.statusCode || data?.metadata?.statusCode;
    
    console.log('Scrape response - markdown length:', markdown.length, 'screenshot available:', !!screenshot, 'screenshot length:', screenshot?.length || 0);

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      
      // Even on error, if we got a screenshot, use it!
      if (screenshot) {
        console.log('API error but screenshot available, using screenshot fallback');
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: { 
              screenshot,
              usedFallback: true 
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Handle specific Firecrawl errors with user-friendly messages
      const errorCode = data?.code || '';
      const errorMessage = data?.error || `Request failed with status ${response.status}`;
      
      // All engines failed = site blocks all scraping attempts
      if (errorCode === 'SCRAPE_ALL_ENGINES_FAILED' || errorMessage.includes('All scraping engines failed')) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Deze website blokkeert automatische toegang. Gebruik de "Plak Tekst" tab om de advertentietekst handmatig in te voeren.',
            blocked: true,
            requiresManualInput: true
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if markdown looks blocked (captcha, 403, etc.)
    const isBlocked = statusCode === 403 || 
                      markdown.includes('captcha') || 
                      markdown.includes('geo.captcha-delivery.com') ||
                      markdown.includes('Access Denied') ||
                      markdown.includes('Please verify you are human') ||
                      markdown.includes('Checking if the site connection is secure');

    // If markdown is blocked or too short, prefer screenshot
    if (isBlocked || markdown.length < 200) {
      console.log('Markdown blocked or insufficient (length:', markdown.length, '), checking screenshot fallback...');
      
      // If we have a screenshot, use it as fallback
      if (screenshot) {
        console.log('Using screenshot fallback (screenshot length:', screenshot.length, ')');
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: { 
              screenshot,
              usedFallback: true 
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // No screenshot available either - return blocked status
      console.error('Both markdown and screenshot failed');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Deze website blokkeert automatische toegang. Gebruik de "Plak Tekst" tab.',
          blocked: true,
          requiresManualInput: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Success with good markdown content
    console.log('Scrape successful with markdown, content length:', markdown.length);
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: { 
          markdown,
          screenshot, // Include screenshot for potential fallback use
          usedFallback: false 
        } 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
