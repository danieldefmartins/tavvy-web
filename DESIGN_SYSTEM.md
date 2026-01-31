# Tavvy V2 Design System

Centralized design system matching iOS Tavvy V2. Use this across **ALL pages** for consistency.

## 📦 Installation

```typescript
import { tavvyTheme, getThemeColors, getBrandColor } from '@/styles/tavvyTheme';
```

## 🎨 Colors

### Background Colors
```typescript
tavvyTheme.colors.background.dark          // #000000 (iOS default)
tavvyTheme.colors.background.light         // #FFFFFF
tavvyTheme.colors.background.surface.dark  // #1A1A1A (cards, inputs)
tavvyTheme.colors.background.surface.light // #F5F5F5
```

### Brand Colors
```typescript
tavvyTheme.colors.brand.universes    // #667EEA (Blue)
tavvyTheme.colors.brand.pros         // #8B5CF6 (Purple)
tavvyTheme.colors.brand.atlas        // #6366F1 (Indigo)
tavvyTheme.colors.brand.onthego      // #22D3EE (Cyan)
```

### Status Colors
```typescript
tavvyTheme.colors.status.active   // #EF4444 (Red - Live indicator)
tavvyTheme.colors.status.success  // #10B981 (Green)
tavvyTheme.colors.status.warning  // #F59E0B (Orange)
```

## 📝 Typography

```typescript
tavvyTheme.typography.fontSize['5xl']  // 48px (Page titles)
tavvyTheme.typography.fontSize['2xl']  // 24px (Section headers)
tavvyTheme.typography.fontSize.base    // 16px (Body text)
tavvyTheme.typography.fontWeight.bold  // 700
```

## 📏 Spacing

```typescript
tavvyTheme.spacing.xs    // 4px
tavvyTheme.spacing.lg    // 16px
tavvyTheme.spacing['3xl'] // 32px
```

## 🔄 Helper Functions

### Get Theme Colors
```typescript
const { bg, surface, text, textSecondary } = getThemeColors(isDark);
```

### Get Brand Color
```typescript
const color = getBrandColor('universes'); // Returns #667EEA
```

## 📖 Usage Examples

### Example 1: Page with Dark Background
```typescript
import { tavvyTheme, getThemeColors } from '@/styles/tavvyTheme';

const MyPage = () => {
  const colors = getThemeColors(true); // Force dark mode
  
  return (
    <div style={{ backgroundColor: colors.bg, color: colors.text }}>
      <h1 style={{ 
        fontSize: tavvyTheme.typography.fontSize['5xl'],
        fontWeight: tavvyTheme.typography.fontWeight.bold 
      }}>
        Title
      </h1>
    </div>
  );
};
```

### Example 2: Brand-Specific Button
```typescript
import { getBrandColor, tavvyTheme } from '@/styles/tavvyTheme';

const UniverseButton = () => (
  <button style={{
    backgroundColor: getBrandColor('universes'),
    padding: tavvyTheme.spacing.lg,
    borderRadius: tavvyTheme.borderRadius.lg,
    transition: tavvyTheme.transitions.normal
  }}>
    Explore Universe
  </button>
);
```

## 🎯 Best Practices

1. **Always use the theme** - Never hardcode colors, fonts, or spacing
2. **Use helper functions** - `getThemeColors()` and `getBrandColor()` for convenience
3. **Consistent spacing** - Use theme spacing values, not arbitrary numbers
4. **Brand colors** - Each section (Universes, Pros, Atlas, OnTheGo) has its own color
5. **Dark first** - iOS uses dark mode by default, match that

## 🔧 Updating the Theme

To update colors/styles across the entire app:
1. Edit `/styles/tavvyTheme.ts`
2. All pages using the theme will update automatically
3. No need to touch individual pages!

## 📱 iOS Parity

This design system matches iOS Tavvy V2 exactly:
- Same colors
- Same spacing
- Same typography
- Same brand colors per section

Keep this file in sync with iOS design changes!
