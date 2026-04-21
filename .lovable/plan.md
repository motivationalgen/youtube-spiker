

# YouTube Growth Suite — Foundation + Core Tools

## Overview
Build a clean SaaS-style web app with authentication, dashboard, sidebar navigation, and 3 core tools (Keyword Research, Tag Generator, Title Generator) using mock/placeholder data. AI and YouTube API integration can be added later.

## 1. App Shell & Layout
- **Sidebar navigation** (collapsible) with sections: Dashboard, Keyword Research, Tag Generator, Title Generator, Saved Projects, Settings
- **Top bar** with search input and user profile avatar/dropdown
- **Design**: Clean white background, dark ash-green accent (`#3a5a40`), rounded cards, soft shadows, smooth hover effects
- Mobile responsive with collapsible sidebar

## 2. Authentication (Lovable Cloud)
- Email + password signup/login
- User profile storage (name, avatar)
- Protected routes — all tools behind auth

## 3. Dashboard (`/dashboard`)
- Welcome message with user's name
- Quick-access cards to each tool
- "Recent activity" section (recently used tools, last saved items)
- Stats cards (total saved keywords, tags, titles)

## 4. Keyword Research Tool (`/keyword-research`)
- **Input**: Keyword/topic text field
- **Output** (mock data for now, ready for API integration later):
  - Search volume estimate
  - Competition level (Low/Medium/High)
  - Keyword difficulty score (0-100)
  - 10-15 related keywords with metrics
  - Trending keywords section
- **Actions**: Save keywords, copy individual/all, export as CSV

## 5. Tag Generator (`/tag-generator`)
- **Input**: Video topic or title
- **Output** (algorithm-based, no AI needed):
  - SEO-optimized tags (mix of short and long-tail)
  - Tags grouped by type (primary, secondary, long-tail)
  - Character count tracker (YouTube 500-char limit)
- **Actions**: Copy all tags, save to project, remove individual tags

## 6. Title Generator (`/title-generator`)
- **Input**: Topic + tone selector (viral, educational, how-to, listicle, clickbait)
- **Output** (template-based for now, AI-ready later):
  - 10 title suggestions based on proven YouTube title patterns
  - CTR score indicator per title (based on power words, length, etc.)
- **Actions**: Save favorites, copy individual titles

## 7. Saved Projects (`/saved-projects`)
- Database-backed storage for all saved content
- Organize by type (keywords, tags, titles)
- Edit and delete saved items
- Simple folder/project grouping

## 8. Settings (`/settings`)
- Profile editing (name, avatar)
- Dark mode toggle
- Account management

## 9. UX Polish
- Toast notifications for all actions (copy, save, delete)
- Copy buttons on every generated item
- Smooth page transitions
- Loading states and skeletons
- Mobile-responsive throughout

