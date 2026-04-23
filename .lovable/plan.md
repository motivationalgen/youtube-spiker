

# Dashboard, Responsiveness, Content Planner & Description Generator Enhancements

## 1. Dashboard — Add All Tools to Home Page

Update `src/routes/_app.dashboard.tsx` to list all 7 tools (not just 3):
- Keyword Research, Tag Generator, Title Generator, Description Generator, Video Ideas, Content Planner, Thumbnail Tool
- Use a responsive grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Each tool card keeps its icon, title, description, and color

## 2. Responsive Fixes Across Pages

**`src/routes/_app.saved-projects.tsx`**:
- Make the header flex wrap on mobile (`flex-wrap`)
- Stats grid: `grid-cols-1 sm:grid-cols-3`
- Item cards: stack content vertically on mobile, show action buttons always on touch (not just hover)
- Export button moves below title on small screens

**`src/routes/_app.dashboard.tsx`**:
- Stats grid already responsive; ensure tool grid uses `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

**`src/routes/_app.content-planner.tsx`**:
- Calendar day cells: reduce `min-h` on mobile
- Day labels: abbreviate to single letters on mobile (`S M T W T F S`)

**`src/routes/_app.description-generator.tsx`**:
- Remove `max-w-3xl` constraint so it fills available width on mobile
- Output card header: stack title and buttons vertically on small screens

**General**: Ensure all tool pages use full width on mobile with proper padding.

## 3. Content Planner — List Option in Notes

Update `src/routes/_app.content-planner.tsx`:
- Add a "List" toggle button (icon: `List`) next to the Notes textarea
- When toggled ON, the textarea input converts each new line into a bullet point (`• `) automatically
- Store notes as-is (with bullet prefixes) in DB/localStorage
- Display notes with bullet formatting in the plan item view
- Button toggles between "List mode" and "Text mode" with visual indicator

## 4. Description Generator — Video Duration & Word Count (Registered Users)

Update `src/routes/_app.description-generator.tsx`:
- Add two new fields visible only to registered users (`user` is truthy):
  - **Video Duration**: number input (minutes) — used to generate proportional timestamps in the output (e.g., a 20-min video gets timestamps spread across 0:00–20:00)
  - **Word Count Target**: number input — the generator adjusts output length to approximate this word count by adding/reducing filler sections
- Timestamps in the generated description use `MM:SS` format derived from the duration input
- When user is not logged in, these fields are hidden and the current static timestamps remain
- Update `generateDescription()` to accept optional `durationMinutes` and `targetWords` params

## Files to Modify
- `src/routes/_app.dashboard.tsx` — add all 7 tools
- `src/routes/_app.saved-projects.tsx` — responsive layout fixes
- `src/routes/_app.content-planner.tsx` — list toggle in notes, mobile responsiveness
- `src/routes/_app.description-generator.tsx` — duration/word count fields, responsive layout

