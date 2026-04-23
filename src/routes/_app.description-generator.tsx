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
import { Copy, Bookmark, FileText } from "lucide-react";
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

function generateDescription(title: string, keywords: string, tone: string): string {
  const kws = keywords.split(",").map((k) => k.trim()).filter(Boolean);
  const hashtags = kws.slice(0, 5).map((k) => `#${k.replace(/\s+/g, "")}`).join(" ");

  const hooks: Record<string, string> = {
    Professional: `In this video, we dive deep into "${title}" — covering everything you need to know to stay ahead.`,
    Casual: `What's up everyone! 🎬 Today we're talking about "${title}" and trust me, you don't want to miss this!`,
    Educational: `Learn everything about "${title}" in this comprehensive guide. Whether you're a beginner or advanced, there's something for everyone.`,
    Entertaining: `🔥 "${title}" — this one's going to blow your mind! Buckle up and let's get into it!`,
  };

  return `${hooks[tone] || hooks.Professional}

📌 What You'll Learn:
• Key insights about ${kws[0] || "this topic"}
• Practical tips and strategies
• Common mistakes to avoid
• Expert recommendations

${kws.length > 0 ? `🔍 Keywords: ${kws.join(", ")}` : ""}

⏱️ Timestamps:
00:00 - Introduction
01:30 - Overview
03:00 - Deep Dive
07:00 - Tips & Tricks
10:00 - Summary & Takeaways

📱 Connect With Me:
→ Instagram: @yourchannel
→ Twitter: @yourchannel
→ Website: https://yourwebsite.com

${hashtags}

👍 If you found this video helpful, don't forget to LIKE, COMMENT, and SUBSCRIBE!`;
}

function DescriptionGeneratorPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState<string>("Professional");
  const [output, setOutput] = useState("");

  const handleGenerate = () => {
    if (!title.trim()) {
      toast.error("Please enter a video title");
      return;
    }
    setOutput(generateDescription(title, keywords, tone));
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
    <div className="space-y-6 max-w-3xl">
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
          <Button onClick={handleGenerate} className="w-full">Generate Description</Button>
        </CardContent>
      </Card>

      {output && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
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
