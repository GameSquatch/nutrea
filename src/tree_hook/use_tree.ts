import { useCallback, useMemo, useRef, useState } from 'react';

interface UseTreeParams<TData> {
  /**
   * You can use any form of data you like, given you also pass {@link UseTreeParams.getId | getId} and {@link UseTreeParams.getChildren | getChildren}
   */
  data: TData;

  /**
   * Defines how to get the identifier out of your data. If not provided, `id` will be used by default.
   */
  getId?: (dataNode: TData) => string;

  /**
   * Defines how to get the current node's list of children from your data. If not provided, `children` will be used by default.
   */
  getChildren?: (dataNode: TData) => undefined | TData[];

  /**
   * A map of the ids of nodes with a key indicating whether that node is expanded or not.
   */
  expandedState: Record<string, boolean>;

  /**
   * When a node's {@link TreeDataNode.toggleExpanded | toggleExpanded} function is called, it
   * will consequently call this handler with the new expanded state. You should update your
   * expanded state accordingly.
   */
  onExpandedStateChange: (newState: Record<string, boolean>) => void;

  /**
   * When a node's {@link TreeDataNode.select | select} function is called, it will
   * consequently call this handler with the id of the node that was selected. If you have
   * an external selection state, you should call it.
   */
  onSelection: (node: TData) => void;

  /**
   * By default `showRoot` is true. If your root node is not meant to be displayed and is
   * only meant to define the entry point into the tree, then pass `false`.
   */
  showRoot?: boolean;

  /**
   * The string data to search for.
   */
  searchTerm?: string;
  /**
   * The function that will be called for each node in the tree, which is passed the node
   * and the original search term string.
   * @returns
   */
  searchMatch?: (node: TData, searchTerm: string) => boolean;

  /**
   * A compare function to sort chlidren within a parent node. This function is passed directly
   * to the `Array.sort` method.
   */
  childSort?: (nodeA: TData, nodeB: TData) => number;
}

export type TreeDataNode<TData> = TData & {
  /** Unique identifier of a tree node */
  id: string;
  /** The level within the tree structure this node is in */
  level: number;
  /** The id of this node's parent */
  parentId?: string;
  /** Trigger the onExpandedStateChange callback with this node toggled */
  toggleExpanded: () => void;
  /** The expanded state of this node */
  isExpanded: boolean;
  /** Trigger the onSelection callback and pass this node to it */
  select: () => void;
  /** A method to compare the selected id with this node's id. I might remove this */
  isSelected: (selectedId: string) => boolean;
  /** True if not a leaf node and the children list is not empty */
  hasChildren: boolean;
};

/**
 * Traverses your data and creates a list of visible nodes to be rendered.
 */
export const useTree = <TData>({
  data,
  getId,
  getChildren,
  expandedState,
  onExpandedStateChange,
  onSelection,
  showRoot = true,
  searchTerm,
  searchMatch,
  childSort
}: UseTreeParams<TData>): {
  visibleList: TreeDataNode<TData>[];
  /**
   * Will give your tree nodes accessible keyboard navigation when you pass it to your tree node's
   * `onKeyDown` or `onKeyUp` props.
   * The tree node element must be focusable, because keyboard events won't emit from non-focusable
   * elements. Setting a `tabIndex` of `-1` is recommended to prevent sequential tab navigation but allow
   * focus.
   * @returns The next index in the visible list that will be selected by the end of this function.
   */
  navigateWithKey: (e: React.KeyboardEvent, currentIndex: number) => void;
} => {
  const childrenMemoRef = useRef<Record<string, undefined | TData[]>>({});
  const [prevData, setPrevData] = useState(data);

  if (prevData !== data) {
    childrenMemoRef.current = {};
    setPrevData(data);
  }

  /**
   * Uses the given `getId` accessor or `.id` by default.
   */
  const accessId = useCallback(
    (node: TData) => {
      let id: string;
      if (getId) {
        id = getId(node);
      } else {
        id = (node as { id: string }).id;
      }
      return id;
    },
    [getId]
  );

  /**
   * A wrapper to get a child list using the given `getChildren` or `.children` by default.
   */
  const accessChildren = useCallback(
    (node: TData) => {
      let children: undefined | TData[];
      if (getChildren) {
        children = getChildren(node);
      } else {
        children = (node as { children: undefined | TData[] }).children;
      }
      return children;
    },
    [getChildren]
  );

  const getMemoChildren = useCallback(
    (node: TData) => {
      const nodeId = accessId(node);
      // If memoized since the last render, return the previously obtained children.
      if ((getChildren || childSort) && childrenMemoRef.current[nodeId]) {
        return childrenMemoRef.current[nodeId];
      }

      // If not memoized, obtain children through traversal and set memoization.
      const children = accessChildren(node);
      if (childSort) {
        children?.sort(childSort);
      }
      if (getChildren || childSort) {
        childrenMemoRef.current[nodeId] = children;
      }
      return children;
    },
    [accessId, accessChildren, childSort, getChildren]
  );

  const toggleExpanded = useCallback(
    (nodeId: string) => {
      onExpandedStateChange({ ...expandedState, [nodeId]: !expandedState[nodeId] });
    },
    [expandedState, onExpandedStateChange]
  );

  const visibleList = useMemo(() => {
    const result: TreeDataNode<TData>[] = [];
    let searchPath: TreeDataNode<TData>[] = [];

    const traverse = (node: TData, level: number = 0, parentId?: string) => {
      const nodeId = accessId(node);
      const newNode: TreeDataNode<TData> = {
        ...node,
        id: nodeId,
        level,
        parentId,
        toggleExpanded: () => toggleExpanded(nodeId),
        isExpanded: expandedState[nodeId],
        select: () => onSelection(node),
        isSelected: (selectedId: string) => selectedId === nodeId,
        hasChildren: false
      };
      searchPath.push(newNode);

      if (!searchTerm) {
        result.push(newNode);
      } else {
        if (searchMatch && searchMatch(node, searchTerm)) {
          searchPath.forEach((pathNode) => result.push(pathNode));
          searchPath = [];
        } else if (!searchMatch && (node as { name: string }).name.includes(searchTerm)) {
          searchPath.forEach((pathNode) => result.push(pathNode));
          searchPath = [];
        }
      }

      const children = getMemoChildren(node);
      newNode.hasChildren = children !== undefined && children.length > 0;
      // If the node doesn't have children or the node is collapsed, we don't want to traverse any further
      if (children !== undefined && (expandedState[nodeId] || searchTerm)) {
        children.forEach((node) => traverse(node, level + 1, nodeId));
      }
      searchPath.pop();
    };

    // Start traversal at the root or at the root's children, depending on `showRoot`
    if (showRoot) {
      traverse(data);
    } else {
      const children = getMemoChildren(data);
      children?.forEach((child) => traverse(child, 0, accessId(data)));
    }

    return result;
  }, [data, accessId, getMemoChildren, expandedState, toggleExpanded, onSelection, showRoot, searchTerm, searchMatch]);

  const navigateWithKey = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      e.preventDefault();
      const node = visibleList[currentIndex];

      let nextIndex: number = currentIndex;
      switch (e.key) {
        case 'ArrowUp':
          if (currentIndex - 1 >= 0) {
            nextIndex = currentIndex - 1;
          }
          break;
        case 'ArrowDown':
          if (currentIndex + 1 < visibleList.length) {
            nextIndex = currentIndex + 1;
          }
          break;
        case 'ArrowLeft': {
          if (node.isExpanded) {
            node.toggleExpanded();
            break;
          }
          // travel to parent
          const parentId = node.parentId;
          if (parentId) {
            nextIndex = currentIndex - 1;
            while (visibleList[nextIndex].id !== parentId) {
              nextIndex = nextIndex - 1;
            }
          }
          break;
        }
        case 'ArrowRight':
          if (!node.isExpanded) {
            node.toggleExpanded();
            break;
          }
          if (node.hasChildren) {
            nextIndex = currentIndex + 1;
          }
          break;
      }

      visibleList[nextIndex].select();
      return nextIndex;
    },
    [visibleList]
  );

  return { visibleList, navigateWithKey };
};
