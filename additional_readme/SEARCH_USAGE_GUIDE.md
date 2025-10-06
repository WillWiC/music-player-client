# Search UI - Quick Reference Guide

## 🔍 How to Use the New Search System

### **Header Search Bar**

#### **Quick Search**
1. Click the search bar in the header
2. Start typing your query
3. See instant results in dropdown (top 8 tracks)
4. Click any track to play immediately
5. Click "See all results" to view full search page

#### **Keyboard Shortcuts**
- `↓` - Navigate down in dropdown results
- `↑` - Navigate up in dropdown results
- `Enter` - Play selected track or go to full results
- `Esc` - Close dropdown
- `Ctrl+K` - Focus search bar (future enhancement)

### **Search Page** (`/search`)

#### **Main Features**
- **Tabs**: Switch between Tracks, Albums, Artists
- **Result Counts**: See how many results in each category
- **Recent Searches**: Quick access to your last 10 searches
- **Clear History**: Remove all or individual recent searches

#### **Recent Searches**
- Automatically saved when you search
- Click to instantly re-run the search
- Click `×` to remove individual searches
- Click "Clear all" to remove all history

## 🎨 UI Components

### **Header Search Dropdown**
```
┌─────────────────────────────────────┐
│ [🔍] Search query...           [×]  │
│─────────────────────────────────────│
│ 🎵 Track Name                    ▶  │
│    Artist • Album                    │
│─────────────────────────────────────│
│ 🎵 Another Track                 ▶  │
│    Artist • Album                    │
│─────────────────────────────────────│
│ See all results for "query" →       │
└─────────────────────────────────────┘
```

### **Search Page Layout**
```
┌──────────────────────────────────────────┐
│ Results for "query"                      │
│ Found 20 tracks, 5 albums, 3 artists     │
├──────────────────────────────────────────┤
│ Recent Searches:              Clear all  │
│ [kpop ×] [rock ×] [jazz ×]               │
├──────────────────────────────────────────┤
│ [Tracks (20)] [Albums (5)] [Artists (3)]│
├──────────────────────────────────────────┤
│ 🎵 Track 1      Artist • Album       ▶  │
│ 🎵 Track 2      Artist • Album       ▶  │
│ 🎵 Track 3      Artist • Album       ▶  │
└──────────────────────────────────────────┘
```

## 🔄 Search Flow Diagram

```
┌─────────────┐
│ Type Query  │
│  in Header  │
└──────┬──────┘
       │
       ├──────────────────┬────────────────┐
       ▼                  ▼                ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Dropdown   │   │  Search Page │   │   Context    │
│  Shows Top   │   │  Updates     │   │   Updates    │
│  8 Tracks    │   │  Instantly   │   │   Results    │
└──────────────┘   └──────────────┘   └──────────────┘
       │                  │                │
       └──────────────────┴────────────────┘
                         ▼
              ┌────────────────────┐
              │  Recent Searches   │
              │  Auto-Saved        │
              └────────────────────┘
```

## 💡 Pro Tips

### **Efficiency Tips**
1. **Use Recent Searches** - Click recent searches instead of retyping
2. **Quick Play** - Play from dropdown without leaving current page
3. **Keyboard Navigation** - Use arrow keys for faster browsing
4. **Tab Navigation** - Switch between content types quickly

### **Best Practices**
1. **Specific Queries** - More specific = better results
2. **Artist + Track** - Search "artist track name" for best results
3. **Clear History** - Clean up old searches periodically
4. **Use Tabs** - Check albums/artists tabs for related content

### **Troubleshooting**
- **No results?** - Check spelling or try different keywords
- **Not authenticated?** - Sign in to enable search and playback
- **Slow results?** - Check internet connection
- **Dropdown not showing?** - Wait 300ms after typing

## 📱 Responsive Behavior

### **Desktop (lg+)**
- Full search bar in header
- Dropdown shows on focus
- Search page with all tabs visible
- Recent searches in horizontal pills

### **Tablet (md)**
- Slightly smaller search bar
- Dropdown with scroll
- Tabs stack responsively
- Recent searches wrap to multiple rows

### **Mobile (sm, xs)**
- Compact search bar
- Mobile menu toggle visible
- Tabs scrollable horizontally
- Recent searches in vertical list

## ⚡ Performance Notes

### **Optimization Features**
- **Debounced Input** - 350ms delay before API call
- **Cached Results** - Results stored in memory
- **Lazy Loading** - Components load on demand
- **Memoized Callbacks** - Prevents unnecessary re-renders

### **API Call Reduction**
- Debouncing reduces calls by ~80%
- Recent searches avoid duplicate queries
- Cached results reused when possible
- Smart query deduplication

## 🎯 Common Use Cases

### **Quick Track Play**
1. Type artist/track name in header
2. See results in dropdown
3. Click play button
4. Music starts immediately

### **Browse Search Results**
1. Type query in header
2. Click "See all results"
3. Switch between tabs
4. Explore all content types

### **Revisit Previous Search**
1. Go to search page
2. Click recent search pill
3. Results appear instantly
4. No retyping needed

### **Deep Dive Search**
1. Search from header
2. View tracks tab
3. Switch to albums tab
4. Check out artists tab
5. Navigate to artist/album pages

---

**Quick Start**: Just start typing in the header search bar! 🎵
