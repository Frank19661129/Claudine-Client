# Claudine UI Prototypes

Twee volledig werkende HTML/CSS prototypes voor de Claudine Client redesign.

## 📁 Bestanden

- **prototype-paperless-style.html** - Gebaseerd op Paperless-NGX
- **prototype-evernote-style.html** - Geïnspireerd door Evernote
- **PROTOTYPES_README.md** - Dit bestand

## 🚀 Hoe te gebruiken

Open de HTML bestanden direct in je browser:

```bash
# Open Paperless style
open prototype-paperless-style.html

# Open Evernote style
open prototype-evernote-style.html

# Of via file:// URL
file:///home/frank/claudine/claudine-client/prototype-paperless-style.html
file:///home/frank/claudine/claudine-client/prototype-evernote-style.html
```

## 📊 Vergelijking

### 1️⃣ Paperless-NGX Style

**Filosofie:** Ultra-functioneel, geen franje, maximale informatie

**Karakteristieken:**
- ✅ Dark green top bar (#1a5632) - professioneel, herkenbaar
- ✅ Compacte sidebar (220px) met counters
- ✅ Table-based layout - alle info in één oogopslag
- ✅ Minimale whitespace - information density
- ✅ Functionele grouping (Views, Filters, Beheren)
- ✅ Inline actions (24px buttons)
- ✅ Grijs/wit kleurenschema - focus op inhoud
- ✅ Checkboxes voor bulk acties
- ✅ Sortable columns
- ✅ Status/Priority badges met kleuren

**Best voor:**
- Power users die veel data willen zien
- Scan-heavy workflows
- Bulk operations
- Dense information display

**Layout:**
```
┌─────────────────────────────────────────────┐
│ [Dark Green Top Bar]                        │ 48px
├──────────┬──────────────────────────────────┤
│ Sidebar  │ Content                          │
│ 220px    │ - Header (48px)                  │
│          │ - Filter bar (40px)              │
│ Sections:│ - Table (dense, 10px padding)    │
│ - Views  │                                  │
│ - Saved  │ Rows: ~40px height               │
│ - Manage │ All info visible                 │
└──────────┴──────────────────────────────────┘
```

---

### 2️⃣ Evernote Style

**Filosofie:** Visueel aangenamer, maar nog steeds werkbaar

**Karakteristieken:**
- ✅ Clean white top bar (52px) - modern, licht
- ✅ Spacious sidebar (240px) met icons
- ✅ Card-based grid layout - visuele hiërarchie
- ✅ Meer breathing room - comfortable spacing
- ✅ Gradient accents (blue, green) - warmte
- ✅ Hover effects en transitions - interactiviteit
- ✅ Icon-first design - snellere scanning
- ✅ View switcher (Cards/List/Table)
- ✅ Cleaner typography - beter leesbaar
- ✅ Subtiele shadows - depth

**Best voor:**
- Visual thinkers
- Focus op enkele items per keer
- Less technical users
- Presentation/demo contexts

**Layout:**
```
┌─────────────────────────────────────────────┐
│ [White Top Bar with Logo & Search]          │ 52px
├──────────┬──────────────────────────────────┤
│ Sidebar  │ Content                          │
│ 240px    │ - Header (64px) + icon           │
│          │ - Toolbar (44px) filters/views   │
│ Sections:│ - Card Grid                      │
│ - Work   │                                  │
│ - Quick  │ Cards: 340px min-width           │
│ - Org    │ All details visible per card     │
└──────────┴──────────────────────────────────┘
```

---

## 🎨 Design Vergelijking

| Aspect | Paperless | Evernote |
|--------|-----------|----------|
| **Top Bar** | Dark green, 48px | White, 52px |
| **Sidebar** | 220px, gray bg | 240px, white bg |
| **Layout** | Table-first | Card-first |
| **Spacing** | Tight (8-10px) | Comfortable (12-16px) |
| **Colors** | Functional (gray/green) | Softer (blue/slate) |
| **Typography** | 13px body | 14px body |
| **Badges** | Compact (11px) | Larger (12px) |
| **Actions** | Always visible | Hover reveal |
| **Density** | High | Medium |

---

## 🔍 Details per Prototype

### Paperless Style - Features

**Top Bar:**
- Logo: "✓ Claudine" (minimaal)
- Search: Dark bg met rgba overlay
- Notifications: Badge counter
- User menu: Compact dropdown

**Sidebar:**
- **Views:** Chat (15), Taken (12), Notities (42), Monitor (0)
- **Opgeslagen Filters:** Vandaag (4), Hoge prio (7), Te laat (2)
- **Beheren:** Personen, Labels, Instellingen
- Counter badges: Green (#1a5632) voor items, gray voor zero

**Content:**
- Header: Title + subtitle ("127 taken totaal, 12 open")
- Filter bar: Multi-select dropdowns (Status, Prioriteit, Gedelegeerd)
- Table: Sortable columns, checkboxes, inline data
- Actions: 24px buttons (✓ ✎ ×)

**Colors:**
- Primary: #1a5632 (dark green)
- Background: #f8f9fa (light gray)
- Borders: #dee2e6 (gray)
- Text: #212529 (near black)

---

### Evernote Style - Features

**Top Bar:**
- Logo: Icon "C" + "Claudine" (branded)
- Search: Large input with icon (420px)
- Notifications: Clean icon button
- User menu: Avatar + name + dropdown

**Sidebar:**
- **Werkruimte:** Chat, Taken, Notities, Monitor
- **Snelle Filters:** Vandaag, Hoge prio, Deadline, Voltooid
- **Organiseren:** Mijn taken, Gedelegeerd, Labels, Instellingen
- Counter badges: Navy (#1a365d) voor items, gray voor zero

**Content:**
- Header: Icon + title + detailed subtitle
- Toolbar: Filter buttons + view switcher (Cards/List/Table)
- Card Grid: 340px min cards, responsive grid
- Actions: 28px hover buttons (✓ ✎ ×)

**Colors:**
- Primary: #1a365d (navy blue)
- Secondary: #2563eb (blue)
- Background: #f7f9fc (very light blue)
- Accents: Gradients (blue, green)

---

## ⚖️ Welke kiezen?

### Kies **Paperless** als je wilt:
- ✅ Maximale information density
- ✅ Power user workflows
- ✅ Bulk operations (select all, etc.)
- ✅ Professional/corporate look
- ✅ Focus op efficiëntie boven vorm

### Kies **Evernote** als je wilt:
- ✅ Visueel aantrekkelijker design
- ✅ Betere first-time user experience
- ✅ Flexibele views (cards/list/table)
- ✅ Modern, friendly look
- ✅ Focus op één taak per keer

---

## 💡 Aanbevelingen

### Hybride Aanpak (Beste van beide):

**Van Paperless nemen:**
1. Compacte sidebar (220px)
2. Counters bij alle items
3. Dark accent color (maar navy i.p.v. green)
4. Functionele grouping
5. Dense spacing waar mogelijk

**Van Evernote nemen:**
1. Clean white top bar (maar 44px i.p.v. 52px)
2. View switcher (Cards/List/Table)
3. Hover actions (cleaner)
4. Better iconography
5. Subtle transitions

**Resultaat:**
- Professional maar niet saai
- Functioneel maar niet kaal
- Information-dense maar niet claustrofobisch
- Modern maar niet speels

---

## 🛠️ Implementatie Notes

### Shared Principles (beide prototypes):
1. **Dedicated Views** - Geen multi-column chaos
2. **Functional First** - Alle acties bereikbaar
3. **Minimal Whitespace** - Efficient ruimtegebruik
4. **Counters Everywhere** - Altijd feedback
5. **Consistent Spacing** - Predictable layout

### Tech Stack (beiden gebruiken):
- Vanilla CSS (no framework)
- System fonts (performance)
- Minimal JavaScript (prototypes are static)
- Responsive grid (CSS Grid)
- Flexbox voor alignment

### Accessibility (beiden hebben):
- Semantic HTML
- Focus states
- Keyboard navigable
- Color contrast compliant
- Hover tooltips

---

## 📏 Measurements Reference

### Paperless:
- Top bar: 48px
- Sidebar: 220px
- Content header: 48px
- Filter bar: 40px
- Table row: ~40px
- Button: 24x24px
- Spacing: 8-12px

### Evernote:
- Top bar: 52px
- Sidebar: 240px
- Content header: 64px
- Toolbar: 44px
- Card height: variable
- Button: 28x28px
- Spacing: 12-16px

---

## 🎯 Next Steps

1. **Kies een richting** (of hybride)
2. **Verfijn de gekozen style**
3. **Extend naar andere views:**
   - Chat view
   - Notes view
   - Monitor view
   - Settings
4. **Add interactions** (modals, dropdowns, etc.)
5. **Implement in React** met Tailwind
6. **Test met echte data**

---

## 📝 Feedback Vragen

1. Welke overall look spreekt je meer aan?
2. Wat vind je van de information density?
3. Is de sidebar te breed/smal?
4. Prefereer je table of cards voor taken?
5. Mis je bepaalde features/acties?
6. Hoe voelt de kleurenschema?
7. Zijn de buttons groot/klein genoeg?
8. Werkbaar voor dagelijks gebruik?

---

**Beide prototypes zijn volledig functioneel en kunnen direct getest worden!**

Open ze naast elkaar en vergelijk:
- Information density
- Visual hierarchy
- Usability
- Aesthetics
- Werkbaarheid

**Veel plezier met testen!** 🚀
