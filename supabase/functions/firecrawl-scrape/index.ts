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

    // Request both markdown AND screenshot for fallback
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown', 'screenshot'], // Request both for fallback
        onlyMainContent: options?.onlyMainContent ?? true,
        waitFor: options?.waitFor || 3000,
        timeout: 30000,
        actions: [
          { type: 'wait', milliseconds: 2000 }
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Request failed with status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract markdown and screenshot from response
    const markdown = data?.data?.markdown || data?.markdown || '';
    const screenshot = data?.data?.screenshot || data?.screenshot || '';
    const statusCode = data?.data?.metadata?.statusCode || data?.metadata?.statusCode;
    
    console.log('Scrape response - markdown length:', markdown.length, 'screenshot available:', !!screenshot);

    // Check if we got blocked (captcha, 403, etc.)
    const isBlocked = statusCode === 403 || 
                      markdown.includes('captcha') || 
                      markdown.includes('geo.captcha-delivery.com') ||
                      markdown.includes('Access Denied') ||
                      markdown.includes('Please verify you are human');

    if (isBlocked || markdown.length < 100) {
      console.log('Markdown blocked or insufficient, checking screenshot fallback...');
      
      // If we have a screenshot, use it as fallback
      if (screenshot) {
        console.log('Using screenshot fallback');
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
      
      // No screenshot available either
      console.error('Both markdown and screenshot failed');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Deze website blokkeert automatische toegang en screenshot fallback is niet beschikbaar.',
          blocked: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Success with markdown
    console.log('Scrape successful with markdown, content length:', markdown.length);
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: { 
          markdown,
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
