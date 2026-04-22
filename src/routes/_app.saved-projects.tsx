import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Search, Tags, Type, Trash2, Copy, Clock, LogIn, Timer } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "@tanstack/react-router";
import {
  getLocalItems,
  removeLocalItem,
  getDbItems,
  removeDbItem,
  getTimeRemaining,
  type SavedItem,
} from "@/lib/storage";

export const Route = createFileRoute("/_app/saved-projects")({
  component: SavedProjectsPage,
  head: () => ({
    meta: [
      { title: "Saved Projects — YouTube Growth Suite" },
      { name: "description", content: "View and manage your saved content" },
    ],
  }),
});

const typeConfig = {
  keyword: { label: "Keywords", icon: Search, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  tag: { label: "Tags", icon: Tags, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  title: { label: "Titles", icon: Type, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
};

function SavedProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<SavedItem[]>([]);
  const [filter, setFilter] = useState<"all" | "keyword" | "tag" | "title">("all");
  const [loadingItems, setLoadingItems] = useState(true);
  const [, setTick] = useState(0);

  const loadItems = useCallback(async () => {
    setLoadingItems(true);
    if (user) {
      const dbItems = await getDbItems();
      setItems(dbItems);
    } else {
      setItems(getLocalItems());
    }
    setLoadingItems(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) loadItems();
  }, [authLoading, loadItems]);

  // Countdown timer for guest users - tick every second
  useEffect(() => {
    if (user) return;
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      // Also prune expired
      if (!user) setItems(getLocalItems());
    }, 1000);
    return () => clearInterval(interval);
  }, [user]);

  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);
  const counts = {
    keyword: items.filter((i) => i.type === "keyword").length,
    tag: items.filter((i) => i.type === "tag").length,
    title: items.filter((i) => i.type === "title").length,
  };

  const handleDelete = async (id: string) => {
    if (user) {
      await removeDbItem(id);
    } else {
      removeLocalItem(id);
    }
    await loadItems();
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
        {!user && (
          <div className="flex items-center gap-2 mt-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
            <Timer className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Guest mode — records expire in 2 hours
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                Sign in to keep your saved items permanently.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300">
              <Link to="/register">
                <LogIn className="mr-1.5 h-3.5 w-3.5" />
                Sign Up
              </Link>
            </Button>
          </div>
        )}
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

      {loadingItems ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="h-14 animate-pulse bg-muted/30 p-3" /></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
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
            const countdown = !user ? getTimeRemaining(item.savedAt) : null;
            return (
              <Card key={item.id} className="group">
                <CardContent className="flex items-center gap-3 p-3">
                  <Badge variant="secondary" className={`${cfg.color} text-xs`}>
                    {cfg.label.slice(0, -1)}
                  </Badge>
                  <p className="flex-1 text-sm font-medium truncate">{item.content}</p>
                  {countdown && (
                    <span className={`flex items-center gap-1 text-xs font-mono whitespace-nowrap ${
                      countdown.expired ? "text-destructive" : "text-amber-600 dark:text-amber-400"
                    }`}>
                      <Clock className="h-3 w-3" />
                      {countdown.text}
                    </span>
                  )}
                  {user && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      ✓ Saved permanently
                    </span>
                  )}
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
