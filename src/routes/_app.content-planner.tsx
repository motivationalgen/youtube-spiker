import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CalendarDays, Plus, ChevronLeft, ChevronRight, Trash2, Timer, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/content-planner")({
  component: ContentPlannerPage,
  head: () => ({
    meta: [
      { title: "Content Planner — YouTube Growth Suite" },
      { name: "description", content: "Plan and schedule your YouTube content" },
    ],
  }),
});

interface PlanItem {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  notes: string;
  savedAt: number;
}

const LOCAL_KEY = "ygs_content_plans";
const TTL_MS = 2 * 60 * 60 * 1000;

function getLocalPlans(): PlanItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const items: PlanItem[] = JSON.parse(raw);
    const cutoff = Date.now() - TTL_MS;
    const valid = items.filter((i) => i.savedAt > cutoff);
    if (valid.length !== items.length) localStorage.setItem(LOCAL_KEY, JSON.stringify(valid));
    return valid;
  } catch { return []; }
}

function saveLocalPlan(item: Omit<PlanItem, "id" | "savedAt">): PlanItem {
  const plans = getLocalPlans();
  const newPlan: PlanItem = { ...item, id: crypto.randomUUID(), savedAt: Date.now() };
  plans.push(newPlan);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(plans));
  return newPlan;
}

function removeLocalPlan(id: string) {
  const plans = getLocalPlans().filter((p) => p.id !== id);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(plans));
}

function ContentPlannerPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString("default", { month: "long" });

  const loadPlans = useCallback(async () => {
    if (user) {
      const { data } = await supabase
        .from("content_plans")
        .select("*")
        .order("plan_date", { ascending: true });
      if (data) {
        setPlans(data.map((r: any) => ({
          id: r.id,
          date: r.plan_date,
          title: r.title,
          notes: r.notes || "",
          savedAt: new Date(r.created_at).getTime(),
        })));
      }
    } else {
      setPlans(getLocalPlans());
    }
  }, [user]);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const dateStr = (day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const plansForDay = (day: number) => plans.filter((p) => p.date === dateStr(day));

  const handleAdd = async () => {
    if (!selectedDate || !newTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (user) {
      await supabase.from("content_plans").insert({
        user_id: user.id,
        plan_date: selectedDate,
        title: newTitle.trim(),
        notes: newNotes.trim() || null,
      });
    } else {
      saveLocalPlan({ date: selectedDate, title: newTitle.trim(), notes: newNotes.trim() });
    }
    setNewTitle("");
    setNewNotes("");
    setDialogOpen(false);
    await loadPlans();
    toast.success("Content plan added!");
  };

  const handleDelete = async (id: string) => {
    if (user) {
      await supabase.from("content_plans").delete().eq("id", id);
    } else {
      removeLocalPlan(id);
    }
    await loadPlans();
    toast.success("Plan removed");
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Content Planner</h1>
        <p className="text-muted-foreground mt-1">Plan and schedule your upcoming content</p>
        {!user && (
          <div className="flex items-center gap-2 mt-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
            <Timer className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-300 flex-1">
              Guest mode — plans expire in 2 hours. <Link to="/register" className="underline font-medium">Sign up</Link> to save permanently.
            </p>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> {monthName} {year}
            </span>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />;
              const dayPlans = plansForDay(day);
              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;
              return (
                <Dialog key={day} open={dialogOpen && selectedDate === dateStr(day)} onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (open) setSelectedDate(dateStr(day));
                }}>
                  <DialogTrigger asChild>
                    <button
                      className={`relative min-h-[60px] rounded-md border p-1 text-left text-xs transition-colors hover:bg-accent ${
                        isToday ? "border-primary bg-primary/5" : "border-border"
                      }`}
                      onClick={() => setSelectedDate(dateStr(day))}
                    >
                      <span className={`font-medium ${isToday ? "text-primary" : ""}`}>{day}</span>
                      {dayPlans.length > 0 && (
                        <div className="mt-0.5 space-y-0.5">
                          {dayPlans.slice(0, 2).map((p) => (
                            <div key={p.id} className="truncate rounded bg-primary/10 px-1 text-[10px] text-primary">
                              {p.title}
                            </div>
                          ))}
                          {dayPlans.length > 2 && (
                            <div className="text-[10px] text-muted-foreground">+{dayPlans.length - 2} more</div>
                          )}
                        </div>
                      )}
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{new Date(dateStr(day) + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {dayPlans.length > 0 && (
                        <div className="space-y-2">
                          {dayPlans.map((p) => (
                            <div key={p.id} className="flex items-start gap-2 rounded-lg border p-2">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{p.title}</p>
                                {p.notes && <p className="text-xs text-muted-foreground mt-0.5">{p.notes}</p>}
                              </div>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => handleDelete(p.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="space-y-3 border-t pt-3">
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input placeholder="Video title or idea" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Notes (optional)</Label>
                          <Textarea placeholder="Additional notes..." value={newNotes} onChange={(e) => setNewNotes(e.target.value)} className="min-h-[60px]" />
                        </div>
                        <Button onClick={handleAdd} className="w-full">
                          <Plus className="mr-2 h-4 w-4" /> Add Plan
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
