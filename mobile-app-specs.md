# Tavvy Mobile App Design Specifications

## Navigation Structure (Bottom Tab Bar)
1. **Home** - House icon (filled when active)
2. **Universes** - Planet/Saturn icon
3. **Pros** - Wrench/tools icon
4. **Atlas** - Book/map icon
5. **Apps** - Grid dots icon

## Color Palette
- **Navy Header**: #0F1233 (dark navy)
- **Background (Light)**: #F9F7F2 (cream/beige)
- **Primary Accent**: #0F1233 (navy)
- **Teal/Cyan**: #14B8A6 (Universes header)
- **Green**: #10B981 (Pros theme, success)
- **Blue**: #3B82F6 (primary buttons)
- **Purple**: #8B5CF6 (The Vibe signal)
- **Orange**: #F97316 (Heads Up signal, RV & Camping)
- **Pink/Magenta**: #EC4899 (Happening Now)
- **Red**: #EF4444 (Rides)
- **Yellow**: #F59E0B (Quick Finds)

## Signal Colors (Review System)
- **The Good (Positive)**: #3B82F6 (Blue)
- **The Vibe (Neutral)**: #8B5CF6 (Purple)
- **Heads Up (Negative)**: #F97316 (Orange)

---

## Screen 1: HOME

### Header
- Navy background (#0F1233)
- Tavvy logo (white, centered)
- Hamburger menu icon (right)

### View Toggle (Standard/Map)
- Pill-shaped toggle below header
- "Standard" and "Map" options
- Active state: navy background, white text
- Inactive state: transparent, gray text

### Title
- "Find a place that fits your moment"
- Large, bold, navy text
- Two lines

### Search Bar
- White background with subtle border
- Search icon (gray)
- Placeholder: "What are you in the mood for?"
- Rounded corners (16px)

### Category Icon Row
- Horizontal scroll
- Icons: Restaurants (fork/knife), Cafes (coffee), Bars (beer), Gas (fuel pump), Shopping (bag), Hotels (bed), RV & Camping (campfire)
- Each icon in colored rounded square
- Label below each icon

### Hint Text
- "Signals are Tavvy reviews — compare places in seconds"
- Small, gray text

### Stories Row
- Circular avatars with gradient border
- Horizontal scroll
- User/place stories

### What's Happening Now
- Section header with "See All" link
- Horizontal carousel
- Cards with image, gradient overlay, title

### Trending Near You
- Section header with "See All" link
- Horizontal carousel (70% width cards)
- Cards show:
  - Full-bleed image
  - Type badge (top-left): Restaurant 🍽️, Coffee ☕, Pro ⭐
  - Name (bold, white)
  - Category • Location

### Explore Tavvy
- Section header with "See All" link
- Subtitle: "Curated worlds of experiences"
- Horizontal carousel
- Universe cards with image, icon badge, title, subtitle
- "Coming Soon" badge for placeholders

### Did You Know
- Yellow/cream card
- Lightbulb icon
- Educational tip about signals

### Top Contributors
- Leaderboard card
- Rank, name, taps, badge, streak
- Top 5 users

---

## Screen 2: UNIVERSES

### Header
- Teal/cyan gradient background (#14B8A6 to #0D9488)
- "Universes" title (white, bold)
- Subtitle: "Explore worlds with many places inside"
- Profile icon (right)

### Search Bar
- White background
- "Find a universe..."
- Full width with rounded corners

### Category Pills
- Horizontal scroll
- "All" (active, teal), "Airports", "Theme Parks", "National Parks"
- Rounded pill shape

### Featured Universe
- Large card
- Full-width image
- "Popular" badge (fire icon)
- Name, location, place count

### Nearby Universes
- Section header with "See Map" link
- Horizontal scroll
- Cards with image, name, place count, signal count

### Popular Destinations
- Grid of destination cards

---

## Screen 3: PROS (Tavvy Pros)

### Header
- "Tavvy Pros" title (black)
- "Find Pros" button (green, filled)
- "I'm a Pro" button (outline)

### Promo Banner
- Light green background
- "Are you a Pro? Save $400 · Only 487 spots left!"
- Sparkle icon

### Hero Section
- "Find Trusted Local"
- "Home Service Pros" (green text)
- Subtitle about connecting with verified pros

### Search Form
- Service search input: "What service do you need? (e.g. Plumber)"
- Location input: "City or ZIP code"
- "Search" button (green, full width)

### Trust Badges
- "Verified Pros" (checkmark)
- "Community Reviews" (star)
- "Fast Response" (clock)

### Start a Project CTA
- Green card
- Plus icon
- "Start a Project"
- "Get quotes from multiple pros in minutes"

### Browse by Service
- Grid of service icons
- Home, Plumbing, Electrical, etc.

---

## Screen 4: ATLAS

### Header
- "Atlas" title (centered, bold)
- Search icon (left)

### Category Pills
- "All (13)" (active, teal)
- "Family & Kids (10)"
- "Restaurants (3)"

### Article Count
- "13 articles"

### Article Grid (2 columns)
- Card with image
- Title (bold)
- Author avatar, name
- Read time

### Article Detail
- Back button, Aa, bookmark, share icons
- Hero image
- Title (large, bold)
- Author info with "Follow" button
- Read time, views
- Audio player (play button, progress, duration)
- Article content

---

## Screen 5: APPS

### Header
- Navy background
- Tavvy logo (centered)
- Hamburger menu

### Theme Toggle
- "Light" / "Dark" pill toggle

### Title
- "Apps"
- Subtitle: "Tools & shortcuts"

### Login Buttons
- "Personal Login" (outline, green icon)
- "Pro Login" (outline, briefcase icon)

### App Grid (3 columns)
Row 1:
- Pros (blue, wrench icon)
- Realtors (green, house icon)
- Cities (blue, buildings icon)

Row 2:
- Atlas (purple/blue, book icon)
- RV & Camping (orange, sun/campfire icon)
- Universes (teal, planet icon)

Row 3:
- Rides (red, train icon)
- Experiences (purple, leaf icon)
- Happening Now (pink, sparkles icon)

Row 4:
- Wallet (purple/blue, wallet icon)
- Quick Finds (yellow, lightning icon)
- Saved (pink/coral, heart icon)

Row 5:
- Account (gray, person icon)
- [empty]
- Create (green, plus icon)

### Footer
- "More tools coming soon" (gray text)

---

## Place Details Screen

### Hero
- Full-width image
- Back button, Tavvy logo, heart, share icons
- Name overlay (bottom)
- Category, price ($$), distance

### Quick Actions Row
- Open (clock icon, green text)
- Call Business (phone icon)
- 0 Photos (camera icon)
- < 1 min Drive (car icon)

### Tab Bar
- Reviews (active, underlined)
- Info
- Photos

### Community Signals Card
- "Community Signals" header
- Three signal rows:
  - The Good (blue) - "Be the first to tap!"
  - The Vibe (purple) - "Be the first to tap!"
  - Heads Up (orange) - "Be the first to tap!"

### Been Here Card
- "Been here?" header
- "Share your experience to help others."
- Quick Tap pills: "Good Vibes", "Friendly Staff", etc.
- "Write Full Review" button (blue)

---

## Map View

### Header
- Back arrow
- Search bar: "Search places or locations"

### Category Pills
- "All", "Restaurants" (active, blue), "Cafes", "Bars", "Gas"

### Map
- OpenStreetMap tiles
- User location (blue dot)
- Weather/layer controls (right side)

### Bottom Sheet
- Draggable handle
- Category title with close button
- Filter pills: Filter icon, "Sort by", "Open now", "Cuisine", "Price", "Distance"
- Place cards with:
  - Photo (with gradient overlay)
  - Name, category, location
  - 2x2 Signal grid (4 signal pills)

---

## Design Tokens

### Typography
- Font: System font (-apple-system, SF Pro)
- Title: 28-32px, bold
- Section header: 18-20px, semibold
- Body: 14-16px, regular
- Caption: 12px, regular

### Spacing
- Page padding: 16-20px
- Card padding: 16px
- Section gap: 24-32px
- Item gap: 12-16px

### Border Radius
- Cards: 16px
- Buttons: 12px
- Pills: 20px (full round)
- Icons: 12-16px

### Shadows
- Cards: 0 4px 16px rgba(0,0,0,0.06)
- Elevated: 0 8px 24px rgba(0,0,0,0.12)
