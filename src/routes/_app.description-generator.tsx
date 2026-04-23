import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Bookmark, FileText, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { saveLocalItem, saveDbItem } from "@/lib/storage";

export const Route = createFileRoute("/_app/description-generator")({
  component: DescriptionGeneratorPage,
  head: () => ({
    meta: [
      { title: "Description Generator — YouTube Growth Suite" },
      { name: "description", content: "Generate SEO-optimized YouTube video descriptions" },
    ],
  }),
});

const tones = ["Professional", "Casual", "Educational", "Entertaining"] as const;

function formatTimestamp(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function generateTimestamps(durationMinutes: number): string {
  const totalSec = durationMinutes * 60;
  const sections = [
    { label: "Introduction", pct: 0 },
    { label: "Overview", pct: 0.08 },
    { label: "Deep Dive", pct: 0.2 },
    { label: "Key Insights", pct: 0.4 },
    { label: "Tips & Tricks", pct: 0.6 },
    { label: "Examples", pct: 0.75 },
    { label: "Summary & Takeaways", pct: 0.9 },
  ];
  return sections
    .map((s) => `${formatTimestamp(Math.round(s.pct * totalSec))} - ${s.label}`)
    .join("\n");
}

function generateDescription(
  title: string,
  keywords: string,
  tone: string,
  durationMinutes?: number,
  targetWords?: number,
): string {
  const kws = keywords.split(",").map((k) => k.trim()).filter(Boolean);
  const hashtags = kws.slice(0, 5).map((k) => `#${k.replace(/\s+/g, "")}`).join(" ");

  const hooks: Record<string, string> = {
    Professional: `In this video, we dive deep into "${title}" — covering everything you need to know to stay ahead.`,
    Casual: `What's up everyone! 🎬 Today we're talking about "${title}" and trust me, you don't want to miss this!`,
    Educational: `Learn everything about "${title}" in this comprehensive guide. Whether you're a beginner or advanced, there's something for everyone.`,
    Entertaining: `🔥 "${title}" — this one's going to blow your mind! Buckle up and let's get into it!`,
  };

  const timestamps = durationMinutes && durationMinutes > 0
    ? generateTimestamps(durationMinutes)
    : `00:00 - Introduction\n01:30 - Overview\n03:00 - Deep Dive\n07:00 - Tips & Tricks\n10:00 - Summary & Takeaways`;

  let body = `${hooks[tone] || hooks.Professional}

📌 What You'll Learn:
• Key insights about ${kws[0] || "this topic"}
• Practical tips and strategies
• Common mistakes to avoid
• Expert recommendations`;

  // Add extra sections to reach word count target
  if (targetWords && targetWords > 150) {
    body += `

🎯 Why This Matters:
Understanding ${kws[0] || "this topic"} is crucial for any creator looking to grow their channel. In this video, we break down the most important aspects and give you actionable steps you can implement right away.`;
  }
  if (targetWords && targetWords > 250) {
    body += `

💡 Pro Tips:
• Stay consistent with your upload schedule
• Engage with your audience in the comments
• Use analytics to track what works best
• Collaborate with other creators in your niche
• Optimize your thumbnails and titles for maximum CTR`;
  }
  if (targetWords && targetWords > 350) {
    body += `

📚 Resources Mentioned:
• Check the pinned comment for all links
• Free templates and guides available on our website
• Join our community for exclusive content and support`;
  }

  body += `

${kws.length > 0 ? `🔍 Keywords: ${kws.join(", ")}` : ""}

⏱️ Timestamps:
${timestamps}

📱 Connect With Me:
→ Instagram: @yourchannel
→ Twitter: @yourchannel
→ Website: https://yourwebsite.com

${hashtags}

👍 If you found this video helpful, don't forget to LIKE, COMMENT, and SUBSCRIBE!`;

  return body;
}

function DescriptionGeneratorPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState<string>("Professional");
  const [duration, setDuration] = useState<string>("");
  const [wordCount, setWordCount] = useState<string>("");
  const [output, setOutput] = useState("");

  const handleGenerate = () => {
    if (!title.trim()) {
      toast.error("Please enter a video title");
      return;
    }
    const dur = duration ? parseInt(duration, 10) : undefined;
    const wc = wordCount ? parseInt(wordCount, 10) : undefined;
    setOutput(generateDescription(title, keywords, tone, dur, wc));
    toast.success("Description generated!");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard!");
  };

  const handleSave = async () => {
    if (!output) return;
    if (user) {
      await saveDbItem({ type: "title", content: output, meta: { source: "description" } });
    } else {
      saveLocalItem({ type: "title", content: output, meta: { source: "description" } });
    }
    toast.success("Description saved!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Description Generator</h1>
        <p className="text-muted-foreground mt-1">Create SEO-optimized YouTube descriptions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Input Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="desc-title">Video Title</Label>
            <Input
              id="desc-title"
              placeholder="e.g. How to Start a YouTube Channel in 2025"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc-keywords">Keywords (comma-separated)</Label>
            <Input
              id="desc-keywords"
              placeholder="e.g. youtube tips, grow channel, content creation"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tones.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {user && (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="desc-duration" className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Video Duration (minutes)
                </Label>
                <Input
                  id="desc-duration"
                  type="number"
                  min="1"
                  max="300"
                  placeholder="e.g. 15"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Timestamps will match your video length</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc-wordcount">Target Word Count</Label>
                <Input
                  id="desc-wordcount"
                  type="number"
                  min="50"
                  max="1000"
                  placeholder="e.g. 300"
                  value={wordCount}
                  onChange={(e) => setWordCount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Adjusts description length accordingly</p>
              </div>
            </div>
          )}

          <Button onClick={handleGenerate} className="w-full">Generate Description</Button>
        </CardContent>
      </Card>

      {output && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex flex-wrap items-center justify-between gap-2">
              <span>Generated Description</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
                </Button>
                <Button variant="outline" size="sm" onClick={handleSave}>
                  <Bookmark className="mr-1.5 h-3.5 w-3.5" /> Save
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
