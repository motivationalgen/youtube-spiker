
CREATE TABLE public.content_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_date DATE NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plans" ON public.content_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plans" ON public.content_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plans" ON public.content_plans FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plans" ON public.content_plans FOR DELETE TO authenticated USING (auth.uid() = user_id);
