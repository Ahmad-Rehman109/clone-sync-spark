import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, History, Settings, Sparkles, Plus, X, Copy, Share, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Speaker = "them" | "me";

interface Message {
  id: string;
  speaker: Speaker;
  text: string;
}

interface Reply {
  tone: string;
  text: string;
  explain: string;
  color?: string;
}

const App = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", speaker: "them", text: "" }
  ]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error loading profile:', error);
    } else {
      setProfile(data);
    }
  };

  const addMessage = () => {
    if (messages.length >= 10) {
      toast.error("Maximum 10 messages allowed");
      return;
    }
    setMessages([...messages, {
      id: Date.now().toString(),
      speaker: "them",
      text: ""
    }]);
  };

  const deleteMessage = (id: string) => {
    if (messages.length === 1) {
      toast.error("At least one message is required");
      return;
    }
    setMessages(messages.filter(m => m.id !== id));
  };

  const toggleSpeaker = (id: string) => {
    setMessages(messages.map(m =>
      m.id === id ? { ...m, speaker: m.speaker === "them" ? "me" : "them" } : m
    ));
  };

  const updateText = (id: string, text: string) => {
    if (text.length > 1000) {
      toast.error("Message too long (max 1000 characters)");
      return;
    }
    setMessages(messages.map(m =>
      m.id === id ? { ...m, text } : m
    ));
  };

  const totalChars = messages.reduce((sum, m) => sum + m.text.length, 0);

  // Find the generateReplies function in src/pages/MainApp.tsx and replace it with this:

// Replace the generateReplies function in MainApp.tsx with this:

const generateReplies = async () => {


   const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  console.log('Current session:', session);
  console.log('Session error:', sessionError);
  console.log('User:', user);
  
  if (!session) {
    toast.error("Not logged in!");
    navigate('/auth');
    return;
  }
  // Validate messages
  const validMessages = messages.filter(m => m.text.trim());
  if (validMessages.length === 0) {
    toast.error("Please add at least one message");
    return;
  }

  // Check if last message is from "them"
  const lastMessage = validMessages[validMessages.length - 1];
  if (lastMessage.speaker !== 'them') {
    toast.error("The last message should be from 'them' to generate a reply");
    return;
  }

  if (!profile) {
    toast.error("Please wait, loading profile...");
    return;
  }

  if (profile.plan === 'free' && profile.daily_used >= profile.daily_quota) {
    toast.error("Daily quota reached. Upgrade for unlimited!");
    return;
  }

  setLoading(true);

  try {
    // Get the current session token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error("Session expired. Please sign in again.");
      navigate('/auth');
      return;
    }

    console.log('Sending request with', validMessages.length, 'messages');
    
    // Call the edge function with proper auth headers
    const { data, error } = await supabase.functions.invoke('generate-replies', {
      body: {
        conversationContext: validMessages.slice(-5), // Only last 5
        inputText: lastMessage.text,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      console.error('Edge function error:', error);
      throw error;
    }

    if (!data) {
      throw new Error('No data received from server');
    }

    if (data.error) {
      throw new Error(data.error);
    }

    if (data?.replies && Array.isArray(data.replies) && data.replies.length === 3) {
      setReplies(data.replies.map((r: Reply, i: number) => ({
        ...r,
        color: i === 0 ? 'tone-funny' : i === 1 ? 'tone-bold' : 'tone-mature'
      })));
      toast.success("Replies generated! 🎉");
      
      // Reload profile to update quota
      if (user) loadProfile(user.id);
    } else {
      throw new Error('Invalid response format from server');
    }
  } catch (error: any) {
    console.error("Error generating replies:", error);
    
    // User-friendly error messages
    const errorMessage = error.message || 'Unknown error';
    
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      toast.error("Session expired. Please sign in again.");
      navigate('/auth');
    } else if (errorMessage.includes('429') || errorMessage.includes('Rate limit')) {
      toast.error("Too many requests. Please wait a moment and try again.");
    } else if (errorMessage.includes('quota')) {
      toast.error("Daily quota exceeded. Upgrade for unlimited!");
    } else if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
      toast.error("Network error. Please check your connection and try again.");
    } else {
      toast.error("Failed to generate replies. Please try again.");
    }
  } finally {
    setLoading(false);
  }
};

  const copyReply = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const shareReply = (text: string) => {
    if (navigator.share) {
      navigator.share({ text });
    } else {
      copyReply(text);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>

            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-bold">ReplyMe</span>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/history">
                <Button variant="ghost" size="icon">
                  <History className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/settings">
                <Button variant="ghost" size="icon">
                  <Settings className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/upgrade" className="hidden sm:block">
                <Button size="sm">Upgrade</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {/* Conversation Builder */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Build your conversation</h2>
          
          <div className="space-y-3">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.speaker === "me" ? "flex-row-reverse" : ""}`}
              >
                <div className={`flex-1 space-y-2 ${message.speaker === "me" ? "items-end" : ""}`}>
                  <div className="flex gap-2 items-center">
                    <div className="flex rounded-full bg-muted p-1">
                      <button
                        onClick={() => toggleSpeaker(message.id)}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                          message.speaker === "them"
                            ? "bg-background text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        Them
                      </button>
                      <button
                        onClick={() => toggleSpeaker(message.id)}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                          message.speaker === "me"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        Me
                      </button>
                    </div>

                    {messages.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMessage(message.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div
                    className={`${
                      message.speaker === "them"
                        ? "bg-muted rounded-2xl rounded-tl-sm"
                        : "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                    } ${index === messages.length - 1 ? "ring-2 ring-accent" : ""}`}
                  >
                    <Textarea
                      value={message.text}
                      onChange={(e) => updateText(message.id, e.target.value)}
                      placeholder="Type a message..."
                      className="min-h-[60px] border-0 resize-none bg-transparent"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={addMessage}
            variant="outline"
            className="w-full h-12"
            disabled={messages.length >= 10}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Message
          </Button>
        </div>

        {/* Generation Section */}
        <div className="backdrop-blur-lg bg-card/50 border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {profile ? `${profile.daily_used}/${profile.daily_quota}` : "0/10"} free today
            </span>
            <span className="text-sm text-muted-foreground">
              {totalChars}/1000 characters
            </span>
          </div>

          <Progress value={profile ? (profile.daily_used / profile.daily_quota) * 100 : 0} />

          <Button
            onClick={generateReplies}
            disabled={loading || !profile || profile.daily_used >= profile.daily_quota}
            className="w-full h-12 text-lg"
          >
            {loading ? (
              "Generating..."
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Replies
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        {replies.length > 0 && (
          <div className="space-y-4 animate-slide-up">
            <h2 className="text-xl font-semibold">Your replies</h2>
            
            {replies.map((reply, index) => (
              <div
                key={index}
                className={`backdrop-blur-lg bg-gradient-to-br from-${reply.color}/20 to-${reply.color}/5 border border-${reply.color}/30 rounded-2xl p-6 space-y-4`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <span className={`inline-block px-3 py-1 rounded-full bg-${reply.color}/20 text-${reply.color} text-sm font-medium`}>
                      {reply.tone}
                    </span>
                    <p className="text-lg">{reply.text}</p>
                    <details className="text-sm text-muted-foreground">
                      <summary className="cursor-pointer hover:text-foreground">
                        Why this works
                      </summary>
                      <p className="mt-2">{reply.explain}</p>
                    </details>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyReply(reply.text)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareReply(reply.text)}
                  >
                    <Share className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline" size="icon">
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {replies.length === 0 && !loading && (
          <div className="text-center py-12 space-y-2">
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Ready to get started?</h3>
            <p className="text-muted-foreground">
              Add messages above to build your conversation context, then generate replies.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
