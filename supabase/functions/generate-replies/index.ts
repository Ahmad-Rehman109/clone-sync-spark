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

    // IMPROVED: Handle conversation context with validation
    let contextPrompt = '';
    
    if (conversationContext && Array.isArray(conversationContext) && conversationContext.length > 0) {
      // Filter out empty messages and limit to last 5 messages
      const validMessages = conversationContext
        .filter((msg: Message) => msg && msg.text && msg.text.trim() !== '')
        .slice(-5); // Only take last 5 messages for context
      
      if (validMessages.length > 0) {
        contextPrompt = 'Previous conversation:\n' + validMessages
          .map((msg: Message, i: number) => {
            const speaker = msg.speaker === 'them' ? 'THEM' : 'YOU';
            return `${speaker}: "${msg.text}"`;
          })
          .join('\n') + '\n\n';
      }
    }

    // Build the prompt
    const systemPrompt = `You are a witty and empathetic reply generator. ${contextPrompt ? 'Analyze the conversation context and relationship dynamics.' : 'Generate contextually appropriate replies.'}

${contextPrompt}The message that needs a reply: "${inputText}"

Generate 3 distinct replies in these exact tones:
1. FUNNY: Playful, light-hearted, uses emojis strategically (1-2 emojis max)
2. BOLD: Confident, direct, assertive without being rude
3. MATURE: Thoughtful, diplomatic, emotionally intelligent

Rules:
- Each reply should be concise (1-2 sentences, max 100 characters)
- Replies must feel natural and conversational
- Consider the relationship context ${contextPrompt ? 'from previous messages' : ''}
- Include a brief explanation (max 50 words) for why each reply works

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "replies": [
    { "tone": "Funny", "text": "reply text here", "explain": "brief explanation" },
    { "tone": "Bold", "text": "reply text here", "explain": "brief explanation" },
    { "tone": "Mature", "text": "reply text here", "explain": "brief explanation" }
  ]
}`;

    // Call Groq API
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    if (!GROQ_API_KEY) {
      console.error('GROQ_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'AI service not configured. Please add GROQ_API_KEY in Supabase secrets.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Calling Groq AI...');
    const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Fast and good quality
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates witty, contextual replies. Always respond with valid JSON only.'
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
      console.error('Groq API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (aiResponse.status === 401) {
        return new Response(JSON.stringify({ error: 'Invalid API key. Please check your GROQ_API_KEY.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'AI generation failed. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    console.log('Groq AI response received');
    
    // Parse the response
    let replies;
    try {
      const content = aiData.choices[0].message.content;
      const parsed = JSON.parse(content);
      
      if (!parsed.replies || !Array.isArray(parsed.replies) || parsed.replies.length !== 3) {
        throw new Error('Invalid response format from AI');
      }
      
      replies = parsed.replies;
      
      // Validate each reply has required fields
      for (const reply of replies) {
        if (!reply.tone || !reply.text || !reply.explain) {
          throw new Error('Missing required fields in reply');
        }
      }
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('AI content:', aiData.choices?.[0]?.message?.content);
      
      // Fallback replies
      replies = [
        {
          tone: "Funny",
          text: "Haha, let me think about that one! 😄",
          explain: "Light-hearted stall while keeping the conversation going"
        },
        {
          tone: "Bold",
          text: "I'm interested. Tell me more.",
          explain: "Direct and shows engagement without overcommitting"
        },
        {
          tone: "Mature",
          text: "That's an interesting point. Let me consider it.",
          explain: "Thoughtful and shows you're taking it seriously"
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
        conversation_context: conversationContext || [],
        replies: replies,
      });

    console.log('Replies generated successfully');
    return new Response(JSON.stringify({ replies }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-replies function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ 
      error: 'Failed to generate replies',
      details: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
