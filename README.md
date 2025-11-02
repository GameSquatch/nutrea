# Nutrea

[![build_and_test](https://github.com/ewilliams-zoot/nutrea/actions/workflows/build_and_test.yml/badge.svg?branch=main)](https://github.com/ewilliams-zoot/nutrea/actions/workflows/build_and_test.yml)

A kind of headless tree hook library focused on efficiency and flexibility.

## Why?

There have been many tree libraries that do a fantastic job. However, when it comes to trees that contain hundreds of thousands of nodes, need to update frequently, support accessibility, and are efficient while giving you all these things, there aren't many choices. That's where this library can hopefully help.

## Library Opinions

This library is unopinionated on purpose. In a way, you could call it "headless", since it is just a hook and requires the developer to create the UI. There are also no opinions about the structure of your tree data, since making any assumptions or picking a stance could have performance implications. For example, if your tree data is not nested (like a flat list or map), and this library had forced developers to pass a nested structure just to flatten it again, that would be wasteful. However, with sensible defaults, you can pass this hook a nested structure and it will just work, given the nodes have an `id` and `children` fields. If your structure is different, no problem, you will just have to specify how to obtain the nodes' id and children.

This library also does not manage expanded or selected states for you, but offers conveniences to work with those things. For example, each node in the returned list has methods like `select()` and `toggleExpanded()`. These types of methods combined with callback props to notify when values have changed, allow the developer to completely manage and handle their own states.

Another opinion not forced by this library is virtualization. If you want to virtualize the results, that will be up to you. For very large lists, it is very much recommended though.

Data management is left completely to the user as well, meaning this hook is not going think of the data you give it as the "initial" data. It treats the data as its source of truth, so when that reference equality changes, it _will_ rebuild the tree list.

## Demos and Examples

Some basic examples are shown below. View some [working demos here](https://gamesquatch.github.io/nutrea/).

The code for the demos is [located here](https://github.com/gamesquatch/nutrea/tree/main/examples/src/routes). You can also pull the repo and run the demos.

I hope to expand this list of examples as time goes on, but these should be sufficient to get the idea.

## Features

- Filtering
- The hook returns a key down/up callback for keyboard navigation, which will call the next node to be selected through the `onSelection` prop.
- Sorting
- Custom data structure support through optional `id` and `children` accessor props

## Getting Started

```sh
npm i nutrea
```

### Very Basic Tree

A basic tree with no virtualization or key navigation. The data structure here is nested with default field names that the library supports: `id` and `children`. This component is managing its own expanded and selected states.

```jsx
import { useTree } from "nutrea";

const BasicTree = memo(function BasicTree() {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  // Expanded state is a Record<string, boolean> map
  const [expandedState, setExpandedState] = useState({});

  const [treeData] = useState({
    id: "root",
    name: "Root",
    children: [
      {
        id: "folder",
        name: "Folder",
      },
      {
        id: "folder2",
        name: "Folder Two",
        children: [
          {
            id: "nestedItem",
            name: "Nested Item",
          },
        ],
      },
    ],
  });

  const expandAllExample = useCallback(() => {
    const newState = {};
    const traverse = (node) => {
      if (node.children) {
        newState[node.id] = true;
        node.children.forEach(traverse);
      }
    };
    traverse(treeData);
    setExpandedState(newState);
  }, [treeData]);

  const collapseAllExample = useCallback(() => {
    setExpandedState({});
  }, []);

  const selectNode = useCallback((node) => {
    setSelectedNodeId(node.id);
  }, []);

  const { visibleList: visibleNodes } = useTree({
    data: treeData,
    expandedState,
    onExpandedStateChange: setExpandedState,
    onSelection: selectNode,
  });

  return (
    <div role="tree" ref={scrollableRef} style={{ height: "600px", overflow: "auto" }}>
      {visibleNodes.map((node) => {
        return (
          <div
            onClick={node.select}
            role="tree-item"
            aria-expanded={node.isExpanded}
            aria-selected={selectedNodeId !== null && node.isSelected(selectedNodeId)}
            key={node.id}
            style={{
              paddingLeft: `${node.level * 16 + 8}px`,
              display: "flex",
              height: "30px",
              alignItems: "center",
              border: node.id === selectedNodeId ? "1px dashed blue" : undefined,
            }}
          >
            <span
              onClick={
                node.hasChildren
                  ? (e) => {
                      e.stopPropagation();
                      node.toggleExpanded();
                    }
                  : undefined
              }
              style={{ display: "inline-block", width: "20px", height: "25px" }}
            >
              {node.hasChildren ? (node.isExpanded ? "-" : "+") : undefined}
            </span>
            {node.name}
          </div>
        );
      })}
    </div>
  );
});
```

## APIs

### useTree Hook Props

`useTree(props)`

- `props.data`: The data that makes up your tree. This can be in any form you like, but if it's not in a hierarchical JSON-like structure (i.e. "nested"), with children defined in a `children` field and the id defined in an `id` field, you will also need to specify `getId` and `getChildren` as described below.
- `props.getId`: A function that is passed a node from your `data` and must return a string representing the `id` of your tree node. So if your tree data node object contains a field called `uniqueId`, this function would be passed like so:

  ```ts
  useTree({
    getId: ({ uniqueId }) => uniqueId,
  });
  ```

- `props.getChildren`: Similar to `getId`, this tells the hook how to obtain children objects from your `data`. If this is not given, the tree hook will try finding them using a `children` field. This must return a list of objects, so if your tree data is a flat map or flat list, where each parent node contains a list of children _ids_, you will have to map those ids into the objects they associate to. The tree hook will cache this list, so when expanded state changes, its not re-running `getChildren`. Example:
  ```ts
  const [data] = useState({
    root: {
      id: "root",
      childIds: ["a", "b"],
    },
    a: { id: "a" },
    b: { id: "b" },
  });
  useTree({
    data: data.root,
    getChildren: (node) => node.childIds?.map((childId) => data[childId]),
  });
  ```
- `props.expandedState`: An object where the keys are node ids and the values are booleans. A value of `true` will tell the hook to traverse into that node's children and attempt to build them into the result list. The result of expanding a node will therefore include its children in the list so they can be rendered as you want. The reverse is true when a node is collapsed (expanded value if `false`).
- `props.onExpandedStateChange`: This is entirely optional, especially if you are managing your own expanded state. If there are areas of code where it's more convenient to call the `toggleExpanded` method (described in the next section) on a node, rather than your own setter for expaned state, you can pass your setter to this property. Otherwise, defining the `expandedState` as a react state and passing that into the hook achieves the same thing. This callback is passed the entire new expanded state _after_ the change has been applied.
- `props.onSelection`: This is similar to `onExpandedStateChange`, as it's optional and only here when it's more convenient to call the `select` method on a node. This callback will be passed the node on which `select` was called.
- `props.showRoot`: Tree data needs a root object, but it's not always desired to display that root object, as it may not even have relevant display properties. This optional flag, which defaults to `true`, allows you to hide the root and start the list of nodes using its direct children obtained via a `children` field or the `getChildren` prop.
- `props.searchTerm`: When the tree hook receives a value in this property other than an empty string, the traversal will include all nodes who's `name` field match this value _and_ any of those matched node's ancestors up to the root. If your tree nodes don't have a `name` field, use the `searchMatch` prop described below to specify how matching should be applied. Note that passing a valid `searchTerm` will bypass expanded state entirely and traverse your whole tree. If you have many nodes, it may be smart to debounce any filter input changes to this state or apply a minimum character count before setting this state.
- `props.searchMatch`: As described in `searchTerm`, if your nodes don't contain a `name` field, use this prop to define how the `searchTerm` should be matched against your nodes. This prop is a function that is passed a node from your data and the current `searchTerm` value and should return a boolean indicating whether the search term matched a node. Example:

  ```ts
  useTree({
    data: { id: 'root', nodeType: 'directory'},
    searchTerm: 'directory',
    searchMatch: ({ nodeType }, searchTerm) => nodeType === searchTerm
  }),
  ```

- `props.childSort`: By default, the nodes are going to be in a depth first traversal order, based on the order of the children. If you want to sort based on a field's value or something else, pass this prop into the hook. This prop is a comparator function that is passed to the `Array.prototype.sort` method of the obained children list from a `children` field or via `getChildren`. The results of `childSort` are cached, so changes to expanded state won't result in heavy computations to resort a list that is already sorted.

### Node Type Returned in List

The hook will return a list of the original data augmented with some additional properties and methods. If your original data contains fields with the same names, they will be overwritten by the augmented data. If this becomes an issue or a concern, I may move the original data under a field in the resulting node, which will be safe from overwrites. The fields are defined as such:

- `id`: The id will be assigned using your data's `id` field, if it has one, or the value returned from the function given to the `getId` hook prop, so this will never be overwritten.
- `level`: The node's level within the tree structure. I.e. the root node will be at `level` 0. If the `showRoot` prop is set to `false`, the root's direct children will start at a `level` of 0.
- `parentId`: As the list is built, we attach a `parentId` to every node except for the root node. This id is obtained the same way as the `id` field is. Passing a `showRoot` value of `false` does not change this. I.e. direct children of the root will still have a `parentId` of the root's `id`.
- `toggleExpanded`: A method that calls the `onExpanedStateChange` callback prop passed to the hook with the new expanded state after toggling the current node's expanded value.
- `isExpanded`: A boolean property that is `true` when the node is expanded and `false` when it's not.
- `select`: A method that calls the `onSelection` callback prop passed to the hook with the node that was just selected.
- `isSelected`: A method that is given an id and returns `true` or `false` if the id matches this node's `id` field. This is a method and not a field, because the hook does not rebuild the list when selected state changes, so using a field here would get stale. I am wrestling with the usefulness of this method and may remove it, since users can just compare with their own selected state to tell when a node is selected anyways.
- `hasChildren`: A field that indicates whether a node has children, which is `true` when:
  1.  The node data does not contain any children data
  2.  The node has children data but the list is empty

  Children are obtained via the `getChildren` prop passed to the hook or via a field in the original data named `children`.
