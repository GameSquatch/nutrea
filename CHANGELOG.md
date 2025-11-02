# Change Log

## 1.0.2

- Make `onExpandedStateChange` prop optional
- Make `onSelection` prop optional

Both of these props are now optional, but will throw a helpful error when their
associated `toggleExpanded` or `select` node methods are called.
