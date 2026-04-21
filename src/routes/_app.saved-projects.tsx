import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { FolderOpen, Search, Tags, Type } from "lucide-react";

export const Route = createFileRoute("/_app/saved-projects")({
  component: SavedProjectsPage,
  head: () => ({
    meta: [
      { title: "Saved Projects — YouTube Growth Suite" },
      { name: "description", content: "View and manage your saved content" },
    ],
  }),
});

function SavedProjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Saved Projects</h1>
        <p className="text-muted-foreground mt-1">
          All your saved keywords, tags, and titles in one place
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Keywords", icon: Search, count: 0 },
          { label: "Tags", icon: Tags, count: 0 },
          { label: "Titles", icon: Type, count: 0 },
        ].map((cat) => (
          <Card key={cat.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <cat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold">{cat.count}</p>
                <p className="text-xs text-muted-foreground">{cat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No saved projects yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1 max-w-sm">
            Start using the Keyword Research, Tag Generator, or Title Generator tools and save your results here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
