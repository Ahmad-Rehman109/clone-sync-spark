import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const Settings = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email || "");
      }
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear your history? This cannot be undone.")) {
      toast.success("History cleared");
    }
  };

  const handleDeleteAccount = () => {
    if (
      confirm(
        "Are you absolutely sure? Your account and all data will be permanently deleted. This cannot be undone."
      )
    ) {
      if (confirm("This is your final warning. Delete account?")) {
        toast.success("Account deleted");
        window.location.href = "/";
      }
    }
  };

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

            <h1 className="font-bold">Settings</h1>

            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Account Section */}
        <div className="backdrop-blur-lg bg-card/50 border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Account</h2>
          
          <div className="space-y-2">
            <Label className="text-muted-foreground">Email</Label>
            <p className="font-medium">{userEmail}</p>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </div>

        {/* Privacy Section */}
        <div className="backdrop-blur-lg bg-card/50 border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Privacy</h2>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="save-history" className="flex-1">
              Save history
              <p className="text-sm text-muted-foreground font-normal">
                Store your generated replies for later
              </p>
            </Label>
            <Switch id="save-history" defaultChecked />
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleClearHistory}
          >
            Clear History
          </Button>
        </div>

        {/* Danger Zone */}
        <div className="backdrop-blur-lg bg-card/50 border-2 border-destructive/50 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
          
          <p className="text-sm text-muted-foreground">
            Once you delete your account, there is no going back. Please be certain.
          </p>

          <Button
            variant="destructive"
            className="w-full"
            onClick={handleDeleteAccount}
          >
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
