import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lightbulb, Copy, Bookmark, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { saveLocalItem, saveDbItem } from "@/lib/storage";

export const Route = createFileRoute("/_app/video-ideas")({
  component: VideoIdeasPage,
  head: () => ({
    meta: [
      { title: "Video Ideas — YouTube Growth Suite" },
      { name: "description", content: "Get viral video ideas for your niche" },
    ],
  }),
});

const niches = ["Gaming", "Tech", "Education", "Lifestyle", "Finance", "Cooking", "Fitness", "Travel", "Music", "Beauty"] as const;

const ideasByNiche: Record<string, { idea: string; potential: "High" | "Medium" | "Low" }[]> = {
  Gaming: [
    { idea: "I Played the Hardest Game Ever Made for 24 Hours", potential: "High" },
    { idea: "Top 10 Hidden Gems on Steam You've Never Heard Of", potential: "High" },
    { idea: "Building a $500 Budget Gaming PC in 2025", potential: "Medium" },
    { idea: "Rating Every Game I Played This Year", potential: "Medium" },
    { idea: "What Happens When You Only Play Free-to-Play Games", potential: "High" },
    { idea: "The Evolution of Open World Games (2000-2025)", potential: "Medium" },
    { idea: "I Let My Chat Control My Game — Chaos Ensued", potential: "High" },
    { idea: "Beginner vs Pro: Same Game, Different Experience", potential: "Low" },
  ],
  Tech: [
    { idea: "I Used Only AI Tools for a Week — Here's What Happened", potential: "High" },
    { idea: "Top 10 Apps That Will Double Your Productivity", potential: "High" },
    { idea: "Is This $200 Phone Better Than a Flagship?", potential: "Medium" },
    { idea: "The Future of Wearable Tech in 2025", potential: "Medium" },
    { idea: "Smart Home Setup Tour Under $500", potential: "High" },
    { idea: "Comparing Every Cloud Storage — Which Is Actually Worth It?", potential: "Medium" },
    { idea: "Building a Home Lab Server for Beginners", potential: "Low" },
    { idea: "5 Tech Gadgets That Changed My Daily Routine", potential: "High" },
  ],
  Education: [
    { idea: "How to Learn Any Skill in 30 Days (Proven Method)", potential: "High" },
    { idea: "The Study Technique That Got Me Straight A's", potential: "High" },
    { idea: "Why Schools Don't Teach You About Money", potential: "Medium" },
    { idea: "5 Books That Changed How I Think", potential: "Medium" },
    { idea: "How to Take Notes Like a Genius", potential: "High" },
    { idea: "The Science of Memory: How to Remember Everything", potential: "High" },
    { idea: "Online Courses vs University — Which Is Better?", potential: "Medium" },
    { idea: "How I Learned a New Language in 3 Months", potential: "Low" },
  ],
  Lifestyle: [
    { idea: "My Morning Routine That Changed My Life", potential: "High" },
    { idea: "30-Day Minimalism Challenge Results", potential: "Medium" },
    { idea: "How I Organize My Entire Life (Systems & Tools)", potential: "High" },
    { idea: "A Day in My Life as a Full-Time Creator", potential: "Medium" },
    { idea: "10 Habits I Quit That Made Me Happier", potential: "High" },
    { idea: "Apartment Tour: Living in a Tiny Space", potential: "Medium" },
    { idea: "How to Build a Capsule Wardrobe on a Budget", potential: "Low" },
    { idea: "Weekly Meal Prep That Actually Saves Money", potential: "High" },
  ],
  Finance: [
    { idea: "How I Save 50% of My Income (Exact Breakdown)", potential: "High" },
    { idea: "Investing for Beginners: Start With Just $100", potential: "High" },
    { idea: "5 Side Hustles That Actually Pay Well in 2025", potential: "High" },
    { idea: "The Biggest Money Mistakes People Make in Their 20s", potential: "Medium" },
    { idea: "How Credit Cards Actually Work (And How to Win)", potential: "Medium" },
    { idea: "Building an Emergency Fund: Step by Step", potential: "Low" },
    { idea: "Passive Income Ideas That Aren't Scams", potential: "High" },
    { idea: "How I Budget Using the 50/30/20 Rule", potential: "Medium" },
  ],
  Cooking: [
    { idea: "5-Minute Meals That Actually Taste Amazing", potential: "High" },
    { idea: "I Tried Gordon Ramsay's Recipes for a Week", potential: "High" },
    { idea: "Meal Prep Sunday: 7 Days of Lunches", potential: "Medium" },
    { idea: "Cooking Challenge: Only $20 for a Full Dinner Party", potential: "High" },
    { idea: "The Only Pasta Recipe You'll Ever Need", potential: "Medium" },
    { idea: "Beginner's Guide to Spices and Seasonings", potential: "Low" },
    { idea: "Rating Viral TikTok Recipes — Are They Worth It?", potential: "High" },
    { idea: "One-Pot Meals for Busy Weeknights", potential: "Medium" },
  ],
  Fitness: [
    { idea: "30-Day Transformation: What Actually Happened", potential: "High" },
    { idea: "Home Workout Routine (No Equipment Needed)", potential: "High" },
    { idea: "I Walked 10,000 Steps Every Day for 30 Days", potential: "Medium" },
    { idea: "The Truth About Protein Supplements", potential: "Medium" },
    { idea: "5 Exercises You're Doing Wrong (And How to Fix Them)", potential: "High" },
    { idea: "Beginner Gym Guide: Your First 30 Days", potential: "High" },
    { idea: "Stretching Routine for People Who Sit All Day", potential: "Medium" },
    { idea: "How I Lost 20 Pounds Without a Strict Diet", potential: "Low" },
  ],
  Travel: [
    { idea: "How to Travel for Almost Free (Budget Hacks)", potential: "High" },
    { idea: "Top 10 Underrated Destinations in 2025", potential: "High" },
    { idea: "Packing Like a Pro: Carry-On Only for 2 Weeks", potential: "Medium" },
    { idea: "Solo Travel Tips Every Beginner Needs", potential: "Medium" },
    { idea: "I Traveled to 5 Countries in 7 Days", potential: "High" },
    { idea: "The Best Street Food Around the World", potential: "Medium" },
    { idea: "Digital Nomad Life: Working While Traveling", potential: "Low" },
    { idea: "Hidden Gems in [Your Country] You Must Visit", potential: "High" },
  ],
  Music: [
    { idea: "How to Produce a Song From Scratch (Beginner Guide)", potential: "High" },
    { idea: "I Wrote a Song in Every Genre", potential: "High" },
    { idea: "Top 10 Free Music Production Tools", potential: "Medium" },
    { idea: "How to Build a Home Studio Under $300", potential: "Medium" },
    { idea: "Reacting to My Old Music (Cringe Warning)", potential: "High" },
    { idea: "Music Theory in 10 Minutes", potential: "Medium" },
    { idea: "How to Get Your Music on Spotify", potential: "Low" },
    { idea: "Mixing and Mastering Tips for Beginners", potential: "Medium" },
  ],
  Beauty: [
    { idea: "5-Minute Everyday Makeup Routine", potential: "High" },
    { idea: "Drugstore vs High-End: Can You Tell the Difference?", potential: "High" },
    { idea: "Skincare Routine That Cleared My Skin", potential: "High" },
    { idea: "Testing Viral Beauty Hacks — Do They Work?", potential: "Medium" },
    { idea: "My Holy Grail Products of 2025", potential: "Medium" },
    { idea: "How to Match Your Foundation Perfectly", potential: "Low" },
    { idea: "Hair Care Routine for Healthy, Shiny Hair", potential: "Medium" },
    { idea: "Beginner Makeup Kit: Everything You Need", potential: "High" },
  ],
};

const potentialColors = {
  High: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Low: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function VideoIdeasPage() {
  const { user } = useAuth();
  const [niche, setNiche] = useState<string>("");
  const [ideas, setIdeas] = useState<{ idea: string; potential: "High" | "Medium" | "Low" }[]>([]);

  const handleGenerate = () => {
    if (!niche) {
      toast.error("Select a niche first");
      return;
    }
    setIdeas(ideasByNiche[niche] || []);
    toast.success(`Generated ${(ideasByNiche[niche] || []).length} video ideas!`);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  const handleSave = async (text: string) => {
    if (user) {
      await saveDbItem({ type: "title", content: text, meta: { source: "video-idea", niche } });
    } else {
      saveLocalItem({ type: "title", content: text, meta: { source: "video-idea", niche } });
    }
    toast.success("Idea saved!");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Video Idea Generator</h1>
        <p className="text-muted-foreground mt-1">Get trending video ideas for your niche</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4" /> Select Your Niche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={niche} onValueChange={setNiche}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a niche..." />
            </SelectTrigger>
            <SelectContent>
              {niches.map((n) => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleGenerate} className="w-full">
            <Sparkles className="mr-2 h-4 w-4" /> Generate Ideas
          </Button>
        </CardContent>
      </Card>

      {ideas.length > 0 && (
        <div className="space-y-2">
          {ideas.map((item, i) => (
            <Card key={i} className="group">
              <CardContent className="flex items-center gap-3 p-3">
                <span className="text-sm text-muted-foreground font-mono w-6">{i + 1}.</span>
                <p className="flex-1 text-sm font-medium">{item.idea}</p>
                <Badge className={potentialColors[item.potential]} variant="secondary">
                  {item.potential}
                </Badge>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(item.idea)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSave(item.idea)}>
                    <Bookmark className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
