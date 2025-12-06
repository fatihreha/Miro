// @deno-types="npm:@google/generative-ai"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: 100 requests per user per day
const RATE_LIMIT = 100;
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in ms

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, userId } = await req.json();

    // Validate request
    if (!prompt || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing prompt or userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting check
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: usageData, error: usageError } = await supabase
      .from('ai_usage')
      .select('request_count, last_reset')
      .eq('user_id', userId)
      .single();

    const now = Date.now();
    let requestCount = 0;

    if (usageData) {
      const lastReset = new Date(usageData.last_reset).getTime();
      if (now - lastReset < RATE_LIMIT_WINDOW) {
        requestCount = usageData.request_count;
        if (requestCount >= RATE_LIMIT) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded. Try again tomorrow.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        // Reset counter if window expired
        requestCount = 0;
      }
    }

    // Increment usage counter
    await supabase.from('ai_usage').upsert({
      user_id: userId,
      request_count: requestCount + 1,
      last_reset: requestCount === 0 ? new Date().toISOString() : usageData?.last_reset
    });

    // Server-side API key (SECURE!)
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return new Response(
      JSON.stringify({ result: text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Gemini API Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
