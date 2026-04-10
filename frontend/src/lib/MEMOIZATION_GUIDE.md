# Memoization & Performance Optimization Guide

This guide outlines memoization strategies to prevent unnecessary re-renders.

## When to Use Memoization

1. **List Item Components** - Wrap with React.memo
2. **Expensive Calculations** - Use useMemo
3. **Callback Props** - Wrap with useCallback
4. **Expensive Renders** - Consider React.memo for large components

## Best Practices

### 1. React.memo for List Items
```tsx
interface ItemProps {
  item: Item;
  onSelect: (id: string) => void;
}

const ListItem = memo<ItemProps>(({ item, onSelect }) => {
  return (
    <div onClick={() => onSelect(item.id)}>
      {item.title}
    </div>
  );
});
ListItem.displayName = 'ListItem';

export default ListItem;
```

### 2. useCallback for Props
```tsx
function ParentComponent() {
  const handleSelectItem = useCallback((id: string) => {
    // Handle selection
  }, []);

  return <ListItem onSelect={handleSelectItem} />;
}
```

### 3. useMemo for Derived Data
```tsx
const sortedItems = useMemo(
  () => items.sort((a, b) => b.date - a.date),
  [items],
);
```

## Critical Components for Memoization

1. **StaggeredMenu** - Navigation items list
2. **DataTable** - Row components and pagination
3. **Avatar lists** - AvatarCircles rendering multiple avatars
4. **Market agents page** - Listing grid items

## Performance Impact

- Prevent unnecessary renders of child components
- Reduce render time from O(n) to O(1) for stable lists
- Target: 50% reduction in re-renders for list-heavy pages

## Verification

```bash
# Use React DevTools Profiler to verify:
1. Enable "Highlight updates when components render"
2. Check Components tab for memo() wrapped components
3. Profile heavy lists to confirm memoization effectiveness
```

## Common Pitfalls

❌ **Don't:**
- Memoize all components indiscriminately
- Create new objects/arrays as memo dependencies
- Use memo without proper dependency arrays

✅ **Do:**
- Memoize list items and expensive components
- Stabilize dependencies with useCallback/useMemo
- Use displayName for easier debugging
