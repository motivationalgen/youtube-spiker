import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tags, Copy, X, Bookmark } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/tag-generator")({
  component: TagGeneratorPage,
  head: () => ({
    meta: [
      { title: "Tag Generator — YouTube Growth Suite" },
      { name: "description", content: "Generate SEO-optimized YouTube tags" },
    ],
  }),
});

function generateTags(topic: string) {
  const t = topic.toLowerCase();
  const primary = [t, `${t} tutorial`, `${t} 2024`, `${t} tips`, `${t} guide`];
  const secondary = [
    `best ${t}`, `${t} for beginners`, `learn ${t}`, `${t} explained`,
    `${t} how to`, `${t} review`, `${t} tricks`,
  ];
  const longTail = [
    `how to ${t} step by step`, `${t} tutorial for beginners 2024`,
    `best way to learn ${t}`, `${t} tips and tricks for beginners`,
    `complete ${t} guide`, `${t} masterclass free`,
  ];
  return { primary, secondary, longTail };
}

function TagGeneratorPage() {
  const [topic, setTopic] = useState("");
  const [tags, setTags] = useState<{ primary: string[]; secondary: string[]; longTail: string[] } | null>(null);
  const [removedTags, setRemovedTags] = useState<Set<string>>(new Set());

  const handleGenerate = () => {
    if (!topic.trim()) return;
    setTags(generateTags(topic.trim()));
    setRemovedTags(new Set());
  };

  const allTags = tags
    ? [...tags.primary, ...tags.secondary, ...tags.longTail].filter((t) => !removedTags.has(t))
    : [];
  const charCount = allTags.join(",").length;

  const removeTag = (tag: string) => {
    setRemovedTags((prev) => new Set([...prev, tag]));
  };

  const copyAll = () => {
    navigator.clipboard.writeText(allTags.join(", "));
    toast.success("All tags copied!");
  };

  const renderTagGroup = (title: string, groupTags: string[], color: string) => {
    const visible = groupTags.filter((t) => !removedTags.has(t));
    if (visible.length === 0) return null;
    return (
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
        <div className="flex flex-wrap gap-2">
          {visible.map((tag) => (
            <Badge key={tag} variant="secondary" className={`${color} pr-1 text-xs`}>
              {tag}
              <button onClick={() => removeTag(tag)} className="ml-1 hover:opacity-70">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tag Generator</h1>
        <p className="text-muted-foreground mt-1">
          Generate SEO-optimized tags for your YouTube videos
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tags className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Enter your video topic or title..."
                className="pl-9"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
            </div>
            <Button onClick={handleGenerate}>Generate</Button>
          </div>
        </CardContent>
      </Card>

      {tags && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                {allTags.length} tags generated
              </p>
              <Badge variant={charCount > 500 ? "destructive" : "secondary"} className="text-xs">
                {charCount}/500 characters
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyAll}>
                <Copy className="h-3.5 w-3.5 mr-1" /> Copy All
              </Button>
              <Button variant="outline" size="sm" onClick={() => toast.success("Tags saved!")}>
                <Bookmark className="h-3.5 w-3.5 mr-1" /> Save
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-5 space-y-5">
              {renderTagGroup("Primary Tags", tags.primary, "bg-primary/10 text-primary")}
              {renderTagGroup("Secondary Tags", tags.secondary, "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400")}
              {renderTagGroup("Long-tail Tags", tags.longTail, "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400")}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
