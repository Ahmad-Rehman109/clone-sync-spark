import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  speaker: 'them' | 'me';
  text: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { conversationContext, inputText } = await req.json();

    if (!inputText || typeof inputText !== 'string' || inputText.trim() === '') {
      return new Response(JSON.stringify({ error: 'Input text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check and update quota
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return new Response(JSON.stringify({ error: 'Failed to fetch profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Reset quota if needed
    const today = new Date().toISOString().split('T')[0];
    let currentUsed = profile.daily_used;
    
    if (profile.last_reset_date !== today) {
      currentUsed = 0;
      await supabaseClient
        .from('profiles')
        .update({ daily_used: 0, last_reset_date: today })
        .eq('user_id', user.id);
    }

    // Check quota
    if (profile.plan === 'free' && currentUsed >= profile.daily_quota) {
      return new Response(JSON.stringify({ error: 'Daily quota exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // FIXED: Handle conversation context - optional and limited to 5 messages
    let contextPrompt = '';
    
    if (conversationContext && Array.isArray(conversationContext) && conversationContext.length > 0) {
      const validMessages = conversationContext
        .filter((msg: Message) => msg && msg.text && msg.text.trim() !== '')
        .slice(-5); // Only last 5 messages
      
      if (validMessages.length > 0) {
        contextPrompt = 'Previous conversation:\n' + validMessages
          .map((msg: Message) => {
            const speaker = msg.speaker === 'them' ? 'THEM' : 'YOU';
            return `${speaker}: "${msg.text}"`;
          })
          .join('\n') + '\n\n';
      }
    }

    // Build the prompt
    const systemPrompt = `You are a witty reply generator. ${contextPrompt ? 'Use the conversation context below.' : 'Generate contextual replies.'}

${contextPrompt}The message needing a reply: "${inputText}"

Generate 3 distinct replies in these tones:
1. FUNNY: Playful, light-hearted (1-2 emojis max)
2. BOLD: Confident, direct, assertive
3. MATURE: Thoughtful, diplomatic, intelligent

Rules:
- Keep replies concise (1-2 sentences, max 100 characters)
- Natural and conversational
- Brief explanation (max 50 words)

Respond ONLY with valid JSON:
{
  "replies": [
    { "tone": "Funny", "text": "reply here", "explain": "why it works" },
    { "tone": "Bold", "text": "reply here", "explain": "why it works" },
    { "tone": "Mature", "text": "reply here", "explain": "why it works" }
  ]
}`;

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(JSON.stringify({ 
        error: 'AI service not configured.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Calling Lovable AI...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: 'You are a helpful assistant that generates witty replies. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: systemPrompt
          }
        ],
        temperature: 0.8,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (aiResponse.status === 401) {
        return new Response(JSON.stringify({ error: 'Invalid LOVABLE_API_KEY.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'AI generation failed.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    console.log('Lovable AI response received');
    
    // Parse response
    let replies;
    try {
      const content = aiData.choices[0].message.content;
      const parsed = JSON.parse(content);
      
      if (!parsed.replies || !Array.isArray(parsed.replies) || parsed.replies.length !== 3) {
        throw new Error('Invalid response format');
      }
      
      replies = parsed.replies;
      
    } catch (parseError) {
      console.error('Parse error:', parseError);
      
      // Fallback replies
      replies = [
        {
          tone: "Funny",
          text: "Haha, let me think about that! 😄",
          explain: "Light and playful response"
        },
        {
          tone: "Bold",
          text: "I'm interested. Tell me more.",
          explain: "Direct and engaging"
        },
        {
          tone: "Mature",
          text: "That's interesting. Let me consider it.",
          explain: "Thoughtful and measured"
        }
      ];
    }

    // Increment usage
    await supabaseClient
      .from('profiles')
      .update({ daily_used: currentUsed + 1 })
      .eq('user_id', user.id);

    // Save to history
    await supabaseClient
      .from('reply_history')
      .insert({
        user_id: user.id,
        input_text: inputText,
        conversation_context: conversationContext || [],
        replies: replies,
      });

    console.log('Success!');
    return new Response(JSON.stringify({ replies }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate replies',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
