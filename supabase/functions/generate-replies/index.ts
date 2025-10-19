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

    if (!inputText || !conversationContext) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
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

    // Build conversation prompt
    const contextPrompt = conversationContext
      .map((msg: Message, i: number) => {
        const speaker = msg.speaker === 'them' ? 'THEM' : 'YOU';
        return `[Message ${i + 1}] ${speaker}: "${msg.text}"`;
      })
      .join('\n');

    const systemPrompt = `You are a witty reply generator specializing in comebacks. Analyze the full conversation flow and relationship dynamics to generate contextually appropriate replies.

Rules:
- ALWAYS read ALL previous messages for context
- Consider the tone and emotion of the entire conversation
- Generate 3 distinct replies in these exact tones:
  1. FUNNY: Playful, light-hearted, uses emojis strategically
  2. BOLD: Confident, direct, assertive without being rude
  3. MATURE: Thoughtful, diplomatic, emotionally intelligent
- Each reply should feel like a natural response to the LATEST message while respecting the conversation history
- Keep replies concise (1-2 sentences)
- Include a brief "explain" for why each reply works

Conversation History:
${contextPrompt}

The message needing a reply is: "${inputText}"

Respond in JSON format:
{
  "replies": [
    { "tone": "Funny", "text": "reply text", "explain": "brief explanation" },
    { "tone": "Bold", "text": "reply text", "explain": "brief explanation" },
    { "tone": "Mature", "text": "reply text", "explain": "brief explanation" }
  ]
}`;

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
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
        messages: [{ role: 'user', content: systemPrompt }],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits depleted. Please contact support.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'AI generation failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');
    
    const content = aiData.choices[0].message.content;
    
    // Parse JSON from AI response
    let replies;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        replies = parsed.replies;
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback to mock replies
      replies = [
        {
          tone: "Funny",
          text: "Only if you're bringing snacks 🍿😄",
          explain: "Light-hearted and playful, uses emojis to keep things casual"
        },
        {
          tone: "Bold",
          text: "I could make some time. What did you have in mind?",
          explain: "Confident and direct, shows interest without being too eager"
        },
        {
          tone: "Mature",
          text: "Let me check my schedule and get back to you!",
          explain: "Thoughtful and responsible, sets clear expectations"
        }
      ];
    }

    // Increment daily usage
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
        conversation_context: conversationContext,
        replies: replies,
      });

    console.log('Replies generated successfully');
    return new Response(JSON.stringify({ replies }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-replies function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
