import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Type, Copy, Heart, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/title-generator")({
  component: TitleGeneratorPage,
  head: () => ({
    meta: [
      { title: "Title Generator — YouTube Growth Suite" },
      { name: "description", content: "Generate click-worthy YouTube video titles" },
    ],
  }),
});

const tones = [
  { label: "Viral", value: "viral" },
  { label: "Educational", value: "educational" },
  { label: "How-to", value: "howto" },
  { label: "Listicle", value: "listicle" },
  { label: "Clickbait", value: "clickbait" },
];

const templates: Record<string, ((t: string) => string)[]> = {
  viral: [
    (t) => `I Tried ${t} For 30 Days — Here's What Happened`,
    (t) => `${t} Changed My Life (Not Clickbait)`,
    (t) => `Nobody Is Talking About This ${t} Secret`,
    (t) => `Why ${t} Is Blowing Up Right Now`,
    (t) => `I Can't Believe ${t} Actually Works`,
    (t) => `The ${t} Trick That Broke The Internet`,
    (t) => `${t}: What They Don't Want You To Know`,
    (t) => `This ${t} Hack Is Going Viral`,
    (t) => `Stop Everything And Watch This ${t} Video`,
    (t) => `${t} Will Never Be The Same After This`,
  ],
  educational: [
    (t) => `${t} Explained in 10 Minutes`,
    (t) => `Everything You Need to Know About ${t}`,
    (t) => `The Complete ${t} Guide for 2024`,
    (t) => `${t}: A Beginner's Guide`,
    (t) => `Understanding ${t} — Full Breakdown`,
    (t) => `${t} 101: Master the Basics`,
    (t) => `The Science Behind ${t}`,
    (t) => `What Is ${t}? Complete Explanation`,
    (t) => `${t} Deep Dive: Expert Analysis`,
    (t) => `Learn ${t} In Under 15 Minutes`,
  ],
  howto: [
    (t) => `How to ${t} (Step-by-Step)`,
    (t) => `How to ${t} Like a Pro`,
    (t) => `The Easiest Way to ${t}`,
    (t) => `How I ${t} — Full Process Revealed`,
    (t) => `${t}: Complete Tutorial for Beginners`,
    (t) => `How to ${t} in 2024 (Updated Guide)`,
    (t) => `${t} Made Simple — Anyone Can Do This`,
    (t) => `How to ${t} Without Any Experience`,
    (t) => `The Fastest Way to ${t}`,
    (t) => `How to ${t} (FREE Method)`,
  ],
  listicle: [
    (t) => `10 ${t} Tips You Wish You Knew Sooner`,
    (t) => `Top 5 ${t} Mistakes to Avoid`,
    (t) => `7 ${t} Hacks That Actually Work`,
    (t) => `15 ${t} Ideas for 2024`,
    (t) => `3 ${t} Secrets From the Pros`,
    (t) => `Top 10 Best ${t} Tools & Resources`,
    (t) => `5 ${t} Trends You Can't Ignore`,
    (t) => `8 Ways to Improve Your ${t}`,
    (t) => `12 ${t} Examples That Will Inspire You`,
    (t) => `6 ${t} Strategies That Always Work`,
  ],
  clickbait: [
    (t) => `You Won't Believe This ${t} Result (SHOCKING)`,
    (t) => `${t} — THIS Is Why You're Failing`,
    (t) => `STOP Doing ${t} Wrong! (Do THIS Instead)`,
    (t) => `The ${t} Secret Nobody Tells You`,
    (t) => `I Was Today Years Old When I Learned This About ${t}`,
    (t) => `${t}: The Truth Finally Revealed`,
    (t) => `WARNING: ${t} Will Change Everything`,
    (t) => `${t} — You're Doing It All Wrong`,
    (t) => `This ONE ${t} Trick Changes Everything`,
    (t) => `Don't Try ${t} Until You Watch This`,
  ],
};

function calculateCTR(title: string): number {
  let score = 50;
  const powerWords = ["secret", "hack", "free", "best", "ultimate", "shocking", "proven", "easy", "fast", "new", "stop", "warning", "truth"];
  const lower = title.toLowerCase();
  powerWords.forEach((w) => { if (lower.includes(w)) score += 5; });
  if (title.length >= 40 && title.length <= 65) score += 10;
  if (/\d/.test(title)) score += 5;
  if (/[!?]/.test(title)) score += 3;
  if (title.includes("(") && title.includes(")")) score += 4;
  if (title === title.toUpperCase()) score -= 10;
  return Math.min(Math.max(score, 20), 98);
}

function ctrColor(score: number) {
  if (score >= 75) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-600";
}

function TitleGeneratorPage() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("viral");
  const [titles, setTitles] = useState<{ text: string; ctr: number; favorited: boolean }[]>([]);

  const handleGenerate = () => {
    if (!topic.trim()) return;
    const fns = templates[tone] || templates.viral;
    const generated = fns.map((fn) => {
      const text = fn(topic.trim());
      return { text, ctr: calculateCTR(text), favorited: false };
    });
    setTitles(generated);
  };

  const toggleFavorite = (i: number) => {
    setTitles((prev) => prev.map((t, idx) => idx === i ? { ...t, favorited: !t.favorited } : t));
  };

  const copyTitle = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Title copied!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Title Generator</h1>
        <p className="text-muted-foreground mt-1">
          Create click-worthy video titles that boost your CTR
        </p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Type className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Enter your video topic..."
                className="pl-9"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
            </div>
            <Button onClick={handleGenerate}>
              <Sparkles className="h-4 w-4 mr-1" /> Generate
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {tones.map((t) => (
              <button
                key={t.value}
                onClick={() => setTone(t.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  tone === t.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {titles.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {titles.length} titles generated • Tone: <span className="font-medium text-foreground capitalize">{tone}</span>
          </p>

          {titles.map((title, i) => (
            <Card key={i} className="group transition-all hover:shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex-1">
                  <p className="font-medium">{title.text}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-muted-foreground">CTR Score:</span>
                    <span className={`text-xs font-bold ${ctrColor(title.ctr)}`}>{title.ctr}%</span>
                    <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${title.ctr >= 75 ? "bg-green-500" : title.ctr >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${title.ctr}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyTitle(title.text)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      toggleFavorite(i);
                      toast.success(title.favorited ? "Removed from favorites" : "Added to favorites");
                    }}
                  >
                    <Heart className={`h-3.5 w-3.5 ${title.favorited ? "fill-red-500 text-red-500" : ""}`} />
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
