import { Link } from "react-router-dom";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Upgrade = () => {
  const handleUpgrade = () => {
    toast("Payments coming soon! For now, enjoy free usage.", {
      icon: "🎉",
    });
  };

  const features = [
    "Unlimited AI-generated replies",
    "Priority AI model (faster & better)",
    "Advanced tone packs",
    "Export full history",
    "No daily limits",
    "Premium support",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link to="/app">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>

            <h1 className="font-bold">Upgrade</h1>

            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Beta Banner */}
        <div className="mb-8 p-4 bg-primary/10 border border-primary/20 rounded-xl text-center animate-fade-in">
          <p className="text-primary font-medium">
            🎉 MVP Beta - All features currently FREE for testing
          </p>
        </div>

        {/* Hero */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">Coming Soon</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold">
            Unlock unlimited replies
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get unlimited access to AI-powered reply generation with premium features
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Monthly Plan */}
          <div className="backdrop-blur-lg bg-card/50 border border-border rounded-2xl p-8 space-y-6 relative">
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 rounded-full bg-muted text-sm font-medium">
                Coming Soon
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2">Monthly</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">$5</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleUpgrade}
              disabled
            >
              Coming Soon
            </Button>
          </div>

          {/* Annual Plan */}
          <div className="backdrop-blur-lg bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/30 rounded-2xl p-8 space-y-6 relative">
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <span className="px-3 py-1 rounded-full bg-success/20 text-success text-sm font-medium">
                Save 50%
              </span>
              <span className="px-3 py-1 rounded-full bg-muted text-sm font-medium">
                Coming Soon
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2">Annual</h3>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold">$30</span>
                <span className="text-muted-foreground">/year</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Just $2.50/month
              </p>
            </div>

            <Button
              className="w-full"
              onClick={handleUpgrade}
              disabled
            >
              Coming Soon
            </Button>
          </div>
        </div>

        {/* Features List */}
        <div className="backdrop-blur-lg bg-card/50 border border-border rounded-2xl p-8">
          <h3 className="text-xl font-bold mb-6">Premium Features</h3>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-success" />
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upgrade;
