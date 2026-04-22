

# Add Missing Features to YouTube Growth Suite

## What We Have
Dashboard, Keyword Research, Tag Generator, Title Generator, Saved Projects, Settings, Auth (email/password), Dark Mode.

## What's Missing (from the master prompt)

### 1. Description Generator (`/description-generator`)
- Input fields: video title, keywords (comma-separated), tone selector (professional, casual, educational, entertaining)
- Output: a full mock YouTube description with hooks, keywords, hashtags, and social links placeholder
- Copy button, save to projects functionality

### 2. Video Idea Generator (`/video-ideas`)
- Input: niche/category dropdown (Gaming, Tech, Education, Lifestyle, Finance, Cooking, Fitness, etc.)
- Output: 8-10 mock video ideas with estimated potential (High/Medium/Low)
- Save individual ideas, copy functionality

### 3. Content Planner (`/content-planner`)
- Calendar-based monthly view
- Users can add content ideas to specific dates (title + notes)
- Data stored in localStorage for guests (2hr TTL) and database for signed-in users
- New `content_plans` database table with RLS
- Visual indicators for days with planned content

### 4. Thumbnail Tool (`/thumbnail-tool`)
- Input: paste a YouTube video URL
- Extract and display the thumbnail using YouTube's public thumbnail URL pattern (`https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg`)
- Preview at different sizes (large, medium, small)
- Download button for the thumbnail image
- No API key needed -- YouTube thumbnail URLs are publicly accessible

### 5. Settings Page Fix
- Connect to actual auth data (show real email from user session)
- Profile save updates the `profiles` table (display_name)
- Show "Sign out" and "Delete account" options for signed-in users

### 6. Sidebar Update
- Add new tool entries: Description Generator, Video Ideas, Content Planner, Thumbnail Tool
- Group tools logically under "SEO Tools" and "Content Tools"

### 7. Export Functionality
- Add "Export as Text" button on Saved Projects page
- Generates a .txt file download of all saved items

## Database Changes
- New migration: `content_plans` table with columns: `id`, `user_id`, `plan_date`, `title`, `notes`, `created_at`
- RLS policies for authenticated users (CRUD on own rows)
- Local storage fallback for guests with 2hr TTL

## Files to Create
- `src/routes/_app.description-generator.tsx`
- `src/routes/_app.video-ideas.tsx`
- `src/routes/_app.content-planner.tsx`
- `src/routes/_app.thumbnail-tool.tsx`

## Files to Modify
- `src/components/AppSidebar.tsx` -- add new nav items
- `src/routes/_app.settings.tsx` -- connect to auth data
- `src/routes/_app.saved-projects.tsx` -- add export button
- `src/lib/storage.ts` -- add content plan storage helpers

