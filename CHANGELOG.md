# Change Log

## 1.0.3

- Make `expandedState` optional

When you omit the expanded state, it will assume the tree is statically always expanded.

## 1.0.2

- Make `onExpandedStateChange` prop optional
- Make `onSelection` prop optional

Both of these props are now optional, but will throw a helpful error when their
associated `toggleExpanded` or `select` node methods are called.
