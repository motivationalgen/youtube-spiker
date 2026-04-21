import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Copy, Download, Bookmark, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/keyword-research")({
  component: KeywordResearchPage,
  head: () => ({
    meta: [
      { title: "Keyword Research — YouTube Growth Suite" },
      { name: "description", content: "Find high-ranking YouTube keywords" },
    ],
  }),
});

interface KeywordResult {
  keyword: string;
  volume: number;
  competition: "Low" | "Medium" | "High";
  difficulty: number;
  trend: "up" | "down" | "stable";
}

function generateMockKeywords(topic: string): KeywordResult[] {
  const prefixes = ["how to", "best", "top 10", "ultimate guide", "beginner", "advanced", "free", "easy", "fast", "pro"];
  const suffixes = ["tutorial", "tips", "tricks", "guide", "2024", "for beginners", "explained", "review", "vs", "hack"];
  const results: KeywordResult[] = [];

  results.push({
    keyword: topic,
    volume: Math.floor(Math.random() * 50000) + 10000,
    competition: "High",
    difficulty: Math.floor(Math.random() * 30) + 60,
    trend: "up",
  });

  for (let i = 0; i < 12; i++) {
    const usePrefix = Math.random() > 0.5;
    const kw = usePrefix
      ? `${prefixes[i % prefixes.length]} ${topic}`
      : `${topic} ${suffixes[i % suffixes.length]}`;
    const comp = ["Low", "Medium", "High"][Math.floor(Math.random() * 3)] as KeywordResult["competition"];
    results.push({
      keyword: kw,
      volume: Math.floor(Math.random() * 30000) + 500,
      competition: comp,
      difficulty: Math.floor(Math.random() * 80) + 10,
      trend: ["up", "down", "stable"][Math.floor(Math.random() * 3)] as KeywordResult["trend"],
    });
  }

  return results;
}

function competitionColor(comp: string) {
  if (comp === "Low") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  if (comp === "Medium") return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
}

function difficultyColor(d: number) {
  if (d < 30) return "text-green-600";
  if (d < 60) return "text-yellow-600";
  return "text-red-600";
}

function KeywordResearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KeywordResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setResults(generateMockKeywords(query.trim()));
      setLoading(false);
    }, 800);
  };

  const copyKeyword = (kw: string) => {
    navigator.clipboard.writeText(kw);
    toast.success("Copied to clipboard");
  };

  const copyAll = () => {
    const text = results.map((r) => r.keyword).join("\n");
    navigator.clipboard.writeText(text);
    toast.success("All keywords copied");
  };

  const exportCsv = () => {
    const header = "Keyword,Volume,Competition,Difficulty,Trend\n";
    const rows = results.map((r) => `"${r.keyword}",${r.volume},${r.competition},${r.difficulty},${r.trend}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "keywords.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as CSV");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Keyword Research</h1>
        <p className="text-muted-foreground mt-1">
          Discover high-performing keywords for your YouTube videos
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Enter a topic or keyword..."
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? "Searching..." : "Research"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {results.length} keywords found for "<span className="font-medium text-foreground">{query}</span>"
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyAll}>
                <Copy className="h-3.5 w-3.5 mr-1" /> Copy All
              </Button>
              <Button variant="outline" size="sm" onClick={exportCsv}>
                <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
              </Button>
            </div>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-3 font-medium">Keyword</th>
                    <th className="p-3 font-medium">Volume</th>
                    <th className="p-3 font-medium">Competition</th>
                    <th className="p-3 font-medium">Difficulty</th>
                    <th className="p-3 font-medium">Trend</th>
                    <th className="p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="p-3 font-medium">{r.keyword}</td>
                      <td className="p-3">{r.volume.toLocaleString()}</td>
                      <td className="p-3">
                        <Badge variant="secondary" className={competitionColor(r.competition)}>
                          {r.competition}
                        </Badge>
                      </td>
                      <td className={`p-3 font-semibold ${difficultyColor(r.difficulty)}`}>
                        {r.difficulty}/100
                      </td>
                      <td className="p-3">
                        <TrendingUp className={`h-4 w-4 ${r.trend === "up" ? "text-green-500" : r.trend === "down" ? "text-red-500 rotate-180" : "text-muted-foreground rotate-90"}`} />
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyKeyword(r.keyword)}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.success("Keyword saved!")}>
                            <Bookmark className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
