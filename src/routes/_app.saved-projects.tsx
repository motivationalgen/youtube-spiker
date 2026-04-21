import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Search, Tags, Type, Trash2, Copy, Clock } from "lucide-react";
import { toast } from "sonner";
import { getSavedItems, removeItem, type SavedItem } from "@/lib/storage";

export const Route = createFileRoute("/_app/saved-projects")({
  component: SavedProjectsPage,
  head: () => ({
    meta: [
      { title: "Saved Projects — YouTube Growth Suite" },
      { name: "description", content: "View and manage your saved content" },
    ],
  }),
});

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

function timeRemaining(ts: number): string {
  const TTL = 2 * 60 * 60 * 1000;
  const remaining = TTL - (Date.now() - ts);
  if (remaining <= 0) return "expiring...";
  const mins = Math.floor(remaining / 60000);
  if (mins < 60) return `${mins}m left`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins}m left`;
}

const typeConfig = {
  keyword: { label: "Keywords", icon: Search, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  tag: { label: "Tags", icon: Tags, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  title: { label: "Titles", icon: Type, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
};

function SavedProjectsPage() {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [filter, setFilter] = useState<"all" | "keyword" | "tag" | "title">("all");

  useEffect(() => {
    setItems(getSavedItems());
  }, []);

  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);
  const counts = {
    keyword: items.filter((i) => i.type === "keyword").length,
    tag: items.filter((i) => i.type === "tag").length,
    title: items.filter((i) => i.type === "title").length,
  };

  const handleDelete = (id: string) => {
    removeItem(id);
    setItems(getSavedItems());
    toast.success("Item removed");
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Saved Projects</h1>
        <p className="text-muted-foreground mt-1">
          All your saved keywords, tags, and titles in one place
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Records auto-expire after 2 hours. Sign in to keep them permanently.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {(["keyword", "tag", "title"] as const).map((type) => {
          const cfg = typeConfig[type];
          return (
            <Card key={type} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setFilter(type)}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${cfg.color}`}>
                  <cfg.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-bold">{counts[type]}</p>
                  <p className="text-xs text-muted-foreground">{cfg.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "keyword", "tag", "title"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {f === "all" ? "All" : typeConfig[f].label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No saved projects yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1 max-w-sm">
              Start using the Keyword Research, Tag Generator, or Title Generator tools and save your results here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const cfg = typeConfig[item.type];
            return (
              <Card key={item.id} className="group">
                <CardContent className="flex items-center gap-3 p-3">
                  <Badge variant="secondary" className={`${cfg.color} text-xs`}>
                    {cfg.label.slice(0, -1)}
                  </Badge>
                  <p className="flex-1 text-sm font-medium truncate">{item.content}</p>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{timeRemaining(item.savedAt)}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(item.content)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
