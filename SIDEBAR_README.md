# Responsive Sidebar Implementation

## 📱 Features

### Desktop View (>= 1024px)

- Fixed sidebar on the left (264px wide)
- Always visible
- Main content pushes to the right with `pl-64` padding

### Mobile View (< 1024px)

- Hamburger menu button in top header
- Sidebar slides in from left when opened
- Dark overlay behind sidebar
- Tap overlay to close
- Smooth animations

## 🎨 Components

### Sidebar Component

**Location:** `src/components/sidebar.tsx`

**Features:**

- Logo at top
- Navigation links with active state highlighting
- Icons for each page (Lucide React)
- Settings link at bottom
- Sign out button
- Responsive mobile menu

**Navigation Items:**

- Dashboard - Overview page
- Query Generator - Generate Google Maps queries
- Maps Scraper - Scrape business data
- Email Scraper - Extract & verify emails

**Footer Items:**

- Settings - Account settings
- Sign Out - Logout functionality

### Dashboard Layout

**Location:** `src/app/(dashboard)/layout.tsx`

Wraps all dashboard pages with the sidebar.

## 🔒 Protected Routes

The following routes require authentication:

- `/dashboard` - Main dashboard
- `/query-generator`
- `/maps-scraper`
- `/email-scraper`
- `/settings`

Middleware automatically redirects unauthenticated users to `/login`.

## 🎯 Navigation

### Adding New Pages

To add a new navigation item, edit `src/components/sidebar.tsx`:

```typescript
const navigation = [
  // ... existing items
  {
    name: "New Feature",
    href: "/new-feature",
    icon: YourIcon, // Import from lucide-react
  },
];
```

Then create the page:

- Create folder: `src/app/(dashboard)/new-feature/`
- Create file: `src/app/(dashboard)/new-feature/page.tsx`
- The layout will automatically apply

### Active State

The sidebar automatically highlights the current page based on the pathname.

## 📱 Mobile Behavior

1. **Menu Button**: Tapping the hamburger icon opens the sidebar
2. **Overlay**: Tapping the dark overlay closes the sidebar
3. **Navigation**: Tapping any link closes the sidebar and navigates
4. **Header**: Shows app logo and menu button

## 🎨 Styling

Uses Tailwind CSS with shadcn/ui components:

- `bg-background` - Sidebar background
- `border-r` - Right border
- `bg-primary` - Active link background
- `text-primary-foreground` - Active link text
- `hover:bg-accent` - Hover state

## 🔄 State Management

Mobile menu state is managed locally with React `useState`:

```typescript
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
```

## 📏 Layout Structure

```
┌─────────────────────────────────────┐
│  Sidebar (Desktop)                  │
│  ┌──────────────────────────────┐   │
│  │ Logo                         │   │
│  │ ─────────────────────────    │   │
│  │ Dashboard                    │   │
│  │ Query Generator              │   │
│  │ Maps Scraper                 │   │
│  │ Email Scraper                │   │
│  │                              │   │
│  │ ─────────────────────────    │   │
│  │ Settings                     │   │
│  │ Sign Out                     │   │
│  └──────────────────────────────┘   │
│                                     │
│  Main Content (lg:pl-64)            │
│  ┌──────────────────────────────┐   │
│  │ Page Content                 │   │
│  │                              │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

## 🚀 Getting Started

The sidebar is now automatically included in all dashboard pages. No additional setup needed!

Just visit any dashboard route and you'll see the sidebar.

## 🔧 Customization

### Change Sidebar Width

Edit `src/components/sidebar.tsx`:

```typescript
// Change w-64 to your desired width
className = "w-64 bg-background border-r";
```

And update layout padding in `src/app/(dashboard)/layout.tsx`:

```typescript
// Match the sidebar width
<div className="lg:pl-64">
```

### Change Colors

Active link colors are controlled by:

- `bg-primary` and `text-primary-foreground` (active state)
- `text-muted-foreground` and `hover:bg-accent` (inactive state)

Edit your `tailwind.config.ts` to change theme colors.

### Add Dividers

To group navigation items, add dividers:

```typescript
<div className="border-t my-2" />
```

## 📝 Notes

- Sidebar uses client component (`'use client'`) for interactivity
- Layout is server component for better performance
- All icons from Lucide React
- Responsive breakpoint at `lg` (1024px)
