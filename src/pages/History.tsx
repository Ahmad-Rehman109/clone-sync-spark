import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Heart, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HistoryItem {
  id: string;
  date: string;
  inputText: string;
  replies: Array<{ tone: string; text: string }>;
  isFavorite: boolean;
}

const History = () => {
  const [filter, setFilter] = useState<"all" | "favorites">("all");
  const [history] = useState<HistoryItem[]>([
    {
      id: "1",
      date: "Today, 2:30 PM",
      inputText: "Hey! Are you free this weekend?",
      replies: [
        { tone: "Funny", text: "Only if you're bringing snacks 🍿😄" },
        { tone: "Bold", text: "I could make some time. What did you have in mind?" },
        { tone: "Mature", text: "Let me check my schedule and get back to you!" }
      ],
      isFavorite: true
    }
  ]);

  const filteredHistory = filter === "favorites"
    ? history.filter(item => item.isFavorite)
    : history;

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

            <h1 className="font-bold">History</h1>

            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Filter */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "favorites" ? "default" : "outline"}
            onClick={() => setFilter("favorites")}
          >
            Favorites
          </Button>
        </div>

        {/* History List */}
        <div className="space-y-4">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="backdrop-blur-lg bg-card/50 border border-border rounded-2xl p-6 space-y-4 animate-fade-in"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.date}
                    </p>
                    <p className="font-medium mb-4">{item.inputText}</p>
                    
                    <details className="space-y-2">
                      <summary className="cursor-pointer text-sm text-primary hover:underline">
                        View replies
                      </summary>
                      <div className="mt-4 space-y-2">
                        {item.replies.map((reply, index) => (
                          <div
                            key={index}
                            className="bg-muted/50 rounded-lg p-3"
                          >
                            <span className="text-xs font-medium text-muted-foreground">
                              {reply.tone}
                            </span>
                            <p className="text-sm mt-1">{reply.text}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={item.isFavorite ? "text-destructive" : ""}
                    >
                      <Heart className={`w-5 h-5 ${item.isFavorite ? "fill-current" : ""}`} />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 space-y-2">
              <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">
                {filter === "favorites" ? "No favorites yet" : "No history yet"}
              </h3>
              <p className="text-muted-foreground">
                {filter === "favorites"
                  ? "Favorite replies will appear here"
                  : "Generate your first reply to get started"}
              </p>
              <Link to="/app">
                <Button className="mt-4">Generate Reply</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
