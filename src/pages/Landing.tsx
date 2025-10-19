import { Link } from "react-router-dom";
import { Sparkles, Menu, Copy, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">ReplyMe</span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-4">
              <Link to="/app">
                <Button variant="ghost">Try App</Button>
              </Link>
              <Link to="/auth">
                <Button>Sign Up</Button>
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2 animate-slide-up">
              <Link to="/app" className="block">
                <Button variant="ghost" className="w-full">Try App</Button>
              </Link>
              <Link to="/auth" className="block">
                <Button className="w-full">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">AI-Powered Reply Suggestions</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 animate-scale-in">
            Turn awkward texts into{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              confident replies
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in">
            Paste any message and get 3 perfect comeback options in different tones.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up">
            <Link to="/app">
              <Button size="lg" className="w-full sm:w-auto min-h-[48px]">
                Try 3 replies — free
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto min-h-[48px]">
              Watch Demo
            </Button>
          </div>

          {/* Demo Card */}
          <div className="max-w-4xl mx-auto backdrop-blur-lg bg-card/50 border border-border rounded-2xl p-6 shadow-2xl animate-scale-in">
            <div className="space-y-4 mb-6">
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 max-w-[80%]">
                  <p className="text-sm">Hey! Are you free this weekend?</p>
                </div>
              </div>
            </div>
            
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-tone-funny/20 to-tone-funny/5 border border-tone-funny/30 rounded-xl p-4">
                <span className="inline-block px-3 py-1 rounded-full bg-tone-funny/20 text-tone-funny text-xs font-medium mb-2">
                  Funny
                </span>
                <p className="text-sm">Only if you're buying coffee ☕️</p>
              </div>
              
              <div className="bg-gradient-to-br from-tone-bold/20 to-tone-bold/5 border border-tone-bold/30 rounded-xl p-4">
                <span className="inline-block px-3 py-1 rounded-full bg-tone-bold/20 text-tone-bold text-xs font-medium mb-2">
                  Bold
                </span>
                <p className="text-sm">I could make some time. What's up?</p>
              </div>
              
              <div className="bg-gradient-to-br from-tone-mature/20 to-tone-mature/5 border border-tone-mature/30 rounded-xl p-4">
                <span className="inline-block px-3 py-1 rounded-full bg-tone-mature/20 text-tone-mature text-xs font-medium mb-2">
                  Mature
                </span>
                <p className="text-sm">Let me check my schedule and get back to you!</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            How It Works
          </h2>
          
          <div className="grid sm:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                <Copy className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">1. Paste Message</h3>
              <p className="text-muted-foreground">Copy the text you received</p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold">2. Get 3 Tones</h3>
              <p className="text-muted-foreground">Receive Funny, Bold, and Mature replies</p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center mx-auto">
                <Zap className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold">3. Copy & Share</h3>
              <p className="text-muted-foreground">Use instantly or share</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            Why ReplyMe?
          </h2>
          
          <div className="grid sm:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="backdrop-blur-lg bg-card/50 border border-border rounded-2xl p-6">
              <Sparkles className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Context-Aware Replies</h3>
              <p className="text-muted-foreground">Uses last 5 messages to understand the conversation</p>
            </div>
            
            <div className="backdrop-blur-lg bg-card/50 border border-border rounded-2xl p-6">
              <Zap className="w-10 h-10 text-accent mb-4" />
              <h3 className="text-xl font-semibold mb-2">3 Perfect Tones</h3>
              <p className="text-muted-foreground">Always get options that fit your style</p>
            </div>
            
            <div className="backdrop-blur-lg bg-card/50 border border-border rounded-2xl p-6">
              <Shield className="w-10 h-10 text-success mb-4" />
              <h3 className="text-xl font-semibold mb-2">Privacy First</h3>
              <p className="text-muted-foreground">Your data is secure and never shared</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-semibold">ReplyMe</span>
            </div>
            
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Built for Gen Z. Privacy-first.
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t border-border md:hidden">
        <Link to="/app">
          <Button className="w-full min-h-[48px]">
            Try ReplyMe Free
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Landing;
