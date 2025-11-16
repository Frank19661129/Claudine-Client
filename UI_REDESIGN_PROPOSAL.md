# Claudine Client - UI Redesign Proposal
## Lean, Mean, Clean & Simple

**Datum:** 2025-11-15
**Doel:** Compactere, strakkere UI zonder overbodige ruimte
**Inspiratie:** Evernote + Paperless-NGX

---

## 🎯 Design Principes

1. **Information Density** - Meer content, minder chrome
2. **Functional First** - Geen edge cases, alleen core features
3. **Minimal Whitespace** - Strak, niet claustrofobisch
4. **Visual Hierarchy** - Door contrast en grootte, niet door ruimte
5. **Consistent Spacing** - 4px, 8px, 12px, 16px (geen 24px, 32px)

---

## 📐 Layout Vergelijking

### VOOR (Huidige staat):
```
┌─────────────────────────────────────────────────────────────────────┐
│  Header (64px hoog, veel padding)                      [User Menu]  │
├──────────────┬──────────────────────────────────────────────────────┤
│              │                                                       │
│  Sidebar     │                                                       │
│  (320px)     │         Chat Area                                    │
│              │         (veel whitespace)                            │
│  [Big        │                                                       │
│   Button]    │                                                       │
│              │                                                       │
│  Conversation│                                                       │
│  (grote      │                                                       │
│   cards,     │                                                       │
│   veel       │                                                       │
│   spacing)   │                                                       │
│              │                                                       │
└──────────────┴──────────────────────────────────────────────────────┘
```

### NA (Nieuwe opzet):
```
┌─────────────────────────────────────────────────────────────────────┐
│ [≡] Claudine               🔍 Search        [🔔3] [frank ▾]         │ 40px
├────────┬────────────────────┬───────────────────────────────────────┤
│        │                    │                                       │
│ VIEWS  │ CONVERSATIONS (15) │  Property Listings                    │
│        │                    │  ───────────────────────────          │
│ ⭐ Chat│ Property Listings  │  A curated selection of available...  │
│ 📋 Task│ Modern house wit...│                                       │
│ 📝 Note│ 2m ago             │  5347 Silver Lake Dr.                 │
│ 📊 Mon │ ─────────────────  │  • 3 bed, 2 bath                      │
│        │ Dog Sitting        │  • 1,980 sqft                         │
│ RECEN  │ Food: Feed twice...│                                       │
│        │ 10m ago  [Travel]  │  [Image: house photo]                 │
│ Budget │ ─────────────────  │                                       │
│ Report │ To-Do List         │  784 N Terrace Ln.                    │
│ Email  │ Prep for client... │  • 4 bed, 4.5 bath                    │
│        │ 2h ago             │                                       │
└────────┴────────────────────┴───────────────────────────────────────┘
 200px     280px               Rest (fluid)
```

---

## 🏗️ Component Breakdown

### 1. **Header** - 40px (was 64px)

**Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│ [≡] Claudine    🔍 Search conversations...   [🔔3] [frank ▾]   │
└────────────────────────────────────────────────────────────────┘
```

**Specificaties:**
- Height: `40px` (was 64px)
- Padding: `8px 16px` (was 24px)
- Font-size titel: `16px` (was 20px)
- Hamburger menu voor mobile (later)
- Notification badge: small, only when count > 0
- User menu: compact dropdown

**Code changes:**
```tsx
// src/components/Header.tsx
<header className="h-10 bg-white border-b border-gray-200 px-4 flex items-center justify-between">
  <div className="flex items-center gap-3">
    <button className="text-navy text-xl">≡</button>
    <h1 className="text-base font-medium text-navy tracking-wide">Claudine</h1>
  </div>

  <div className="flex-1 max-w-md mx-4">
    <input
      type="search"
      placeholder="Search..."
      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md"
    />
  </div>

  <div className="flex items-center gap-2">
    {notesCount > 0 && (
      <button className="relative p-1.5">
        🔔
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
          {notesCount}
        </span>
      </button>
    )}
    <button className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 rounded">
      <span className="text-sm">{user?.full_name || 'User'}</span>
      <span className="text-xs">▾</span>
    </button>
  </div>
</header>
```

---

### 2. **Sidebar** - 200px collapsible (was 320px)

**Layout:**
```
┌──────────────┐
│ VIEWS        │ ← Section header (uppercase, 11px, gray)
│              │
│ ⭐ Chat      │ ← Icon + label, 32px height
│ 📋 Tasks  12 │ ← With counter badge
│ 📝 Notes   5 │
│ 📊 Monitor   │
│              │
│ RECENT       │ ← Section divider
│              │
│ Budget       │ ← Recent conversations (max 5)
│ Report       │
│ Email Draft  │
└──────────────┘
  200px wide
```

**Specificaties:**
- Width: `200px` (was 320px)
- Item height: `32px` (was 48px)
- Font-size: `14px` (was 16px)
- Padding: `4px 12px` (was 16px)
- Section headers: `11px uppercase, text-gray-500`
- Counter badges: small, right-aligned

**Code:**
```tsx
// Sidebar component
<aside className="w-50 bg-gray-50 border-r border-gray-200 flex flex-col">
  {/* Section: Views */}
  <div className="p-3">
    <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-2 px-3">Views</h3>
    <nav className="space-y-0.5">
      <NavItem icon="⭐" label="Chat" active />
      <NavItem icon="📋" label="Tasks" count={12} />
      <NavItem icon="📝" label="Notes" count={5} />
      <NavItem icon="📊" label="Monitor" />
    </nav>
  </div>

  {/* Section: Recent */}
  <div className="p-3 border-t border-gray-200">
    <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-2 px-3">Recent</h3>
    <nav className="space-y-0.5">
      <NavItem label="Budget Report" />
      <NavItem label="Email Draft" />
      <NavItem label="Meeting Notes" />
    </nav>
  </div>
</aside>

// NavItem component
const NavItem = ({ icon, label, count, active }) => (
  <button className={`
    w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md
    transition-colors
    ${active ? 'bg-white text-navy font-medium shadow-sm' : 'text-gray-700 hover:bg-white/50'}
  `}>
    {icon && <span className="text-base">{icon}</span>}
    <span className="flex-1 text-left truncate">{label}</span>
    {count > 0 && (
      <span className="bg-accent/20 text-accent text-xs px-1.5 py-0.5 rounded-full">
        {count}
      </span>
    )}
  </button>
);
```

---

### 3. **Conversation List** - 280px (was full width in sidebar)

**Layout:**
```
┌─────────────────────────────┐
│ CONVERSATIONS (15)          │ ← Header met counter
│ [+ New]                     │ ← Compact button, 28px
├─────────────────────────────┤
│ Property Listings           │ ← Title, 14px bold
│ A curated selection of...  │ ← Snippet, 12px, gray, truncated
│ 2m ago         [Property]   │ ← Time + tag, 11px
├─────────────────────────────┤
│ Dog Sitting                 │
│ Food: Feed twice per day... │
│ 10m ago        [Travel]     │
├─────────────────────────────┤
│ To-Do List                  │
│ Prep for client meeting...  │
│ 2h ago                      │
└─────────────────────────────┘
```

**Specificaties:**
- Width: `280px` (fixed)
- Item height: `64px` (was 80px)
- Padding: `8px 12px` (was 16px)
- Title: `14px bold` (was 16px)
- Snippet: `12px, 2 lines max` (was 14px)
- Meta: `11px gray` (was 12px)
- Spacing: `1px border` between items (geen margin)

**Code:**
```tsx
// ConversationList component
<div className="w-70 bg-white border-r border-gray-200 flex flex-col">
  {/* Header */}
  <div className="px-3 py-2 border-b border-gray-200">
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-xs uppercase tracking-wider text-gray-500">
        Conversations ({conversations.length})
      </h2>
    </div>
    <button className="w-full bg-navy text-white text-sm px-3 py-1.5 rounded-md hover:bg-navy/90">
      + New Conversation
    </button>
  </div>

  {/* List */}
  <div className="flex-1 overflow-y-auto">
    {conversations.map(conv => (
      <button
        key={conv.id}
        className="w-full px-3 py-2 border-b border-gray-100 hover:bg-gray-50 text-left transition-colors"
      >
        <h3 className="text-sm font-medium text-navy truncate mb-1">
          {conv.title}
        </h3>
        <p className="text-xs text-gray-600 line-clamp-2 mb-1">
          {conv.latest_message?.content || 'No messages yet'}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{formatTime(conv.updated_at)}</span>
          {conv.mode !== 'chat' && (
            <span className="bg-gray-100 px-1.5 py-0.5 rounded">
              {conv.mode}
            </span>
          )}
        </div>
      </button>
    ))}
  </div>
</div>
```

---

### 4. **Chat Detail Area** - Fluid width

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│ Property Listings                    [📎] [⋯]            │ 36px header
├──────────────────────────────────────────────────────────┤
│                                                           │
│  A curated selection of available listings...            │ ← Content area
│                                                           │   More space!
│  5347 Silver Lake Dr.                                    │
│  • 3 bed, 2 bath                                         │
│  • 1,980 sqft                                            │
│                                                           │
│  [Large image]                                           │
│                                                           │
│                                                           │
│                                                           │
├──────────────────────────────────────────────────────────┤
│ Type a message...                              [Send]    │ 48px input
└──────────────────────────────────────────────────────────┘
```

**Specificaties:**
- Header: `36px` (was 56px)
- Content padding: `16px` (was 24px)
- Message bubble: max-width `700px` (was 800px)
- Message padding: `8px 12px` (was 12px 16px)
- Font-size: `14px` (was 15px)
- Line-height: `1.5` (was 1.6)
- Input height: `48px` (was 64px)

**Code:**
```tsx
// Chat detail area
<div className="flex-1 flex flex-col bg-white">
  {/* Header */}
  <div className="h-9 px-4 border-b border-gray-200 flex items-center justify-between">
    <h2 className="text-sm font-medium text-navy truncate">
      {conversation.title}
    </h2>
    <div className="flex items-center gap-2">
      <button className="p-1 hover:bg-gray-100 rounded">📎</button>
      <button className="p-1 hover:bg-gray-100 rounded">⋯</button>
    </div>
  </div>

  {/* Messages */}
  <div className="flex-1 overflow-y-auto p-4 space-y-3">
    {messages.map(msg => (
      <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className={`
          max-w-lg px-3 py-2 rounded-lg text-sm
          ${msg.role === 'user'
            ? 'bg-navy text-white'
            : 'bg-gray-100 text-gray-900'
          }
        `}>
          <p className="whitespace-pre-wrap">{msg.content}</p>
          <p className="text-xs mt-1 opacity-70">
            {formatTime(msg.created_at)}
          </p>
        </div>
      </div>
    ))}
  </div>

  {/* Input */}
  <div className="h-12 px-4 border-t border-gray-200 flex items-center gap-2">
    <input
      type="text"
      placeholder="Type a message..."
      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
    />
    <button className="px-4 py-2 bg-navy text-white text-sm rounded-md hover:bg-navy/90">
      Send
    </button>
  </div>
</div>
```

---

### 5. **Tasks Page** - Compact Table

**Voor:**
- Rij hoogte: 60-80px
- Veel padding
- Grote action buttons

**Na:**
```
┌────────────────────────────────────────────────────────────────────────┐
│ Tasks (127)                                    [Filters ▾] [+ New]     │ 40px
├────┬──────────────────────────┬────────┬──────────┬──────────┬────────┤
│ ID │ Title                    │ Status │ Priority │ Due      │ Actions│ 32px
├────┼──────────────────────────┼────────┼──────────┼──────────┼────────┤
│ T1 │ Finish report            │ ⏳ Open│ 🔴 High  │ Today    │ ✓ ✎ ×  │ 36px
│ T2 │ Review contract          │ ✅ Done│ 🟡 Med   │ Nov 20   │ ✓ ✎ ×  │
│ T3 │ Call supplier            │ ⏳ Open│ 🟢 Low   │ Nov 25   │ ✓ ✎ ×  │
└────┴──────────────────────────┴────────┴──────────┴──────────┴────────┘
```

**Specificaties:**
- Header: `40px` (was 64px)
- Table header: `32px` (was 40px)
- Row height: `36px` (was 60px)
- Font-size: `13px` (was 14px)
- Action buttons: `24px` circle (was 32px)
- Padding: `6px 12px` (was 12px 16px)

---

### 6. **Notes Page** - Compact Grid

**Voor:**
- Card padding: 24px
- Card spacing: 24px gaps
- Title: 18px
- 3 columns max

**Na:**
```
┌──────────────────────────────────────────────────────────────────────┐
│ Notes (42)    [🔍 Search]  [Categories ▾]              [+ New]       │ 40px
├──────────────────────┬──────────────────────┬──────────────────────┤
│ Meeting Notes        │ Budget 2024          │ Project Ideas        │
│ [Work] [Important]   │ [Finance]            │ [Planning]           │
│                      │                      │                      │
│ Discussed quarterly  │ Revenue: €250k       │ - Mobile app         │
│ targets and team...  │ Costs: €180k         │ - API redesign       │
│                      │ Profit: €70k         │ - Documentation      │
│ Nov 10               │ Nov 8                │ Nov 5                │
│              [✎] [×] │              [✎] [×] │              [✎] [×] │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ ...                  │ ...                  │ ...                  │
└──────────────────────┴──────────────────────┴──────────────────────┘
```

**Specificaties:**
- Grid: `4 columns` (was 3)
- Card padding: `12px` (was 24px)
- Gap: `12px` (was 24px)
- Title: `14px bold` (was 18px)
- Content: `13px, max 4 lines` (was 14px, 6 lines)
- Tags: `11px` (was 12px)

---

## 🎨 Spacing System (Strict)

**NU gebruiken we:**
- 4px, 6px, 8px, 10px, 12px, 16px, 20px, 24px, 32px, 48px

**NIEUWE spacing (restrictief):**
```typescript
const spacing = {
  0: '0',
  1: '4px',   // Minimal (icon padding, badge)
  2: '8px',   // Tight (list items, card padding)
  3: '12px',  // Normal (section padding)
  4: '16px',  // Comfortable (main content)
  6: '24px',  // Spacious (between major sections)
} as const;

// Verboden: 20px, 28px, 32px, 40px, 48px (tenzij fixed height)
```

**Gebruik:**
- Between items in list: `1px border` of `0.5 (2px)`
- Card padding: `2 (8px)` of `3 (12px)`
- Section spacing: `4 (16px)`
- Major sections: `6 (24px)` alleen waar echt nodig

---

## 📏 Typography System

**Voor (te groot):**
```css
h1: 28px
h2: 20px
h3: 18px
body: 15px
small: 14px
```

**Na (compact):**
```css
h1: 20px  (page title)
h2: 16px  (section title)
h3: 14px  (card title)
body: 14px (default)
small: 12px (metadata)
tiny: 11px (labels, counters)
```

---

## 🎯 Core Features Only (Geen Edge Cases)

### **Chat Page**
✅ Send message
✅ See conversation history
✅ Create new conversation
✅ Delete conversation
✅ Auto-generate title
❌ Edit message (komt later)
❌ Reply to specific message (komt later)
❌ Rich text formatting (komt later)
❌ File attachments (komt later)
❌ Search in conversation (komt later)

### **Tasks Page**
✅ Create task
✅ Edit task (inline)
✅ Complete task
✅ Delete task
✅ Filter by status/priority
✅ Sort by column
❌ Bulk actions (komt later)
❌ Recurring tasks (komt later)
❌ Sub-tasks (komt later)
❌ Time tracking (komt later)

### **Notes Page**
✅ Create note
✅ Edit note
✅ Delete note
✅ Categories/tags
✅ Search notes
❌ Rich formatting (komt later)
❌ Note linking (komt later)
❌ Version history (komt later)
❌ Collaborative editing (komt later)

---

## 🔄 Migration Plan

### Phase 1: Core Layout (1-2 days)
- [ ] Reduce header height 64px → 40px
- [ ] Reduce sidebar width 320px → 200px
- [ ] Add conversation list panel (280px)
- [ ] Adjust spacing system (12px max in most places)

### Phase 2: Component Refinement (1-2 days)
- [ ] Compact conversation list items
- [ ] Tighter message bubbles
- [ ] Smaller input area
- [ ] Reduce button sizes

### Phase 3: Tasks & Notes (1 day)
- [ ] Compact table rows (36px)
- [ ] Smaller action buttons (24px)
- [ ] Notes grid 4 columns
- [ ] Reduce card padding

### Phase 4: Polish (1 day)
- [ ] Review all spacing
- [ ] Remove unused features
- [ ] Test responsive behavior
- [ ] Performance check

---

## 📊 Space Savings

**Before:**
- Sidebar: 320px
- Header: 64px
- Wasted whitespace: ~30%

**After:**
- Sidebar: 200px (62% of before)
- Conversation list: 280px (dedicated)
- Header: 40px (62% of before)
- Content area: +200px wider
- Information density: +45%

**Net result:**
- Chat content area: **+200px wider**
- Conversations visible: **50% more** (fits more items)
- Overall cleaner, more professional look

---

## 🎨 Visual Mock-up (ASCII)

### Chat Page - Full Layout
```
┌─────────────────────────────────────────────────────────────────────────┐
│ [≡] Claudine        🔍 Search...           [🔔3] [frank ▾]              │ 40
├────────┬─────────────────────┬──────────────────────────────────────────┤
│ VIEWS  │ CONVERSATIONS (15)  │ Property Listings            [📎] [⋯]   │ 36
│        │                     ├──────────────────────────────────────────┤
│ ⭐ Chat│ [+ New]             │                                          │
│ 📋 Task│                     │ A curated selection of available         │
│ 📝 Note│ Property Listings   │ listings, separated by bedrooms.         │
│ 📊 Mon │ Modern house with...│                                          │
│        │ 2m ago              │ 5347 Silver Lake Dr.                     │
│ RECENT │ ─────────────────── │ • 3 bed, 2 bath                          │
│        │ Dog Sitting         │ • 1,980 sqft                             │
│ Budget │ Food: Feed twice... │                                          │
│ Report │ 10m ago   [Travel]  │ [████████████████████]                   │
│ Email  │ ─────────────────── │ [██ Large Image ████]                    │
│ Draft  │ To-Do List          │ [████████████████████]                   │
│        │ Prep for client...  │                                          │
│        │ 2h ago              │ 784 N Terrace Ln.                        │
│        │ ─────────────────── │ • 4 bed, 4.5 bath                        │
│        │ Meeting Notes       │ • 3,472 sqft                             │
│        │ Discussed targets...│                                          │
│        │ 5h ago              │                                          │
│        │                     ├──────────────────────────────────────────┤
│        │                     │ Type a message...              [Send]    │ 48
└────────┴─────────────────────┴──────────────────────────────────────────┘
 200px      280px                    Rest (fluid, ~1000px+)
```

### Tasks Page - Compact Table
```
┌─────────────────────────────────────────────────────────────────────────┐
│ [≡] Claudine        🔍 Search...           [🔔3] [frank ▾]              │ 40
├────────┬────────────────────────────────────────────────────────────────┤
│ VIEWS  │ Tasks (127)             [Status ▾] [Priority ▾]    [+ New]    │ 40
│        ├────┬──────────────────┬────────┬──────────┬────────┬─────────┤
│ ⭐ Chat│ ID │ Title            │ Status │ Priority │ Due    │ Actions │ 32
│ 📋 Task│────┼──────────────────┼────────┼──────────┼────────┼─────────┤
│ 📝 Note│ T1 │ Finish report    │ ⏳ Open│ 🔴 High  │ Today  │ ✓ ✎ ×   │ 36
│ 📊 Mon │ T2 │ Review contract  │ ✅ Done│ 🟡 Med   │ Nov 20 │ ✓ ✎ ×   │ 36
│        │ T3 │ Call supplier    │ ⏳ Open│ 🟢 Low   │ Nov 25 │ ✓ ✎ ×   │ 36
│ RECENT │ T4 │ Update website   │ ⏳ Open│ 🟡 Med   │ Nov 30 │ ✓ ✎ ×   │ 36
│        │ T5 │ Team meeting     │ ✅ Done│ 🟢 Low   │ Nov 15 │ ✓ ✎ ×   │ 36
│ Budget │ T6 │ Budget review    │ ⏳ Open│ 🔴 High  │ Dec 1  │ ✓ ✎ ×   │ 36
│ Report │ T7 │ Hire developer   │ ⏳ Open│ 🟡 Med   │ Dec 10 │ ✓ ✎ ×   │ 36
└────────┴────┴──────────────────┴────────┴──────────┴────────┴─────────┘
```

### Notes Page - Compact Grid
```
┌─────────────────────────────────────────────────────────────────────────┐
│ [≡] Claudine        🔍 Search...           [🔔3] [frank ▾]              │ 40
├────────┬────────────────────────────────────────────────────────────────┤
│ VIEWS  │ Notes (42)          [🔍 Search] [Categories ▾]     [+ New]    │ 40
│        ├──────────────┬──────────────┬──────────────┬──────────────────┤
│ ⭐ Chat│ Meeting Notes│ Budget 2024  │ Project Ideas│ Tech Stack       │
│ 📋 Task│ [Work] [Imp] │ [Finance]    │ [Planning]   │ [Dev]            │
│ 📝 Note│              │              │              │                  │
│ 📊 Mon │ Discussed Q4 │ Revenue: 250k│ - Mobile app │ React 18         │
│        │ targets...   │ Costs: 180k  │ - API v2     │ TypeScript       │
│ RECENT │              │ Profit: 70k  │ - Docs       │ Capacitor        │
│        │ Nov 10   ✎ × │ Nov 8    ✎ × │ Nov 5    ✎ × │ Nov 3        ✎ × │
│ Budget ├──────────────┼──────────────┼──────────────┼──────────────────┤
│ Report │ Hiring Plan  │ Marketing    │ Customer     │ Legal Docs       │
│ Email  │ [HR]         │ [Sales]      │ Feedback     │ [Legal]          │
└────────┴──────────────┴──────────────┴──────────────┴──────────────────┘
```

---

## 🚀 Implementation Priority

### Must Have (Week 1)
1. Header height reduction
2. Sidebar width reduction
3. 3-column layout (sidebar | list | detail)
4. Spacing system enforcement
5. Typography size reduction

### Should Have (Week 2)
6. Compact conversation items
7. Compact task rows
8. Notes grid adjustment
9. Button size reduction
10. Remove unused features

### Nice to Have (Week 3)
11. Collapsible sidebar
12. Keyboard shortcuts
13. Dark mode prep (structure)
14. Mobile responsive tweaks

---

## 🎯 Success Metrics

**Before:**
- Visible conversations: 8-10
- Visible tasks: 10-12
- Content width: ~900px

**After (Target):**
- Visible conversations: 12-15 (50% improvement)
- Visible tasks: 15-18 (50% improvement)
- Content width: ~1100px (22% improvement)
- Overall information density: +45%

---

## 📝 Notes

- Keep GS.ai branding (navy + gold)
- Maintain accessibility (contrast, click targets)
- Test on 1920x1080, 1440x900, 1366x768
- Ensure mobile responsiveness (later phase)
- No animations (keep it snappy)

---

**End of Redesign Proposal**
