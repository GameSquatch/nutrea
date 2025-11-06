import { useTree } from "../src/index";
import { expect, test } from "vitest";
import { renderHook } from "@testing-library/react";

type TreeNode = {
  id: string;
  name: string;
  children?: TreeNode[];
};

const treeData: TreeNode = {
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
} as const;

test("Collapsed nodes are not included", () => {
  const expandedState: Record<string, boolean> = {
    root: true,
  };

  const { result } = renderHook((initialProps) => useTree<TreeNode>({ ...initialProps }), {
    initialProps: {
      data: treeData,
      expandedState,
    },
  });

  expect(result.current.visibleList.length).toBe(3);
});

test("Not specifying expanded states defaults to all expanded", () => {
  const { result } = renderHook((initialProps) => useTree<TreeNode>({ ...initialProps }), {
    initialProps: {
      data: treeData,
    },
  });

  expect(result.current.visibleList.length).toBe(4);
});

test("All expanded to be included", () => {
  const expandedState: Record<string, boolean> = {
    root: true,
    folder2: true,
  };

  const { result } = renderHook((initialProps) => useTree<TreeNode>({ ...initialProps }), {
    initialProps: {
      data: treeData,
      expandedState,
    },
  });

  expect(result.current.visibleList.length).toBe(4);
});

test("Show root excludes root node when all are expanded", () => {
  const expandedState: Record<string, boolean> = {
    root: true,
    folder2: true,
  };

  const { result } = renderHook((initialProps) => useTree<TreeNode>({ ...initialProps }), {
    initialProps: {
      data: treeData,
      expandedState,
      showRoot: false,
    },
  });

  expect(result.current.visibleList.length).toBe(3);
  expect(result.current.visibleList[0].id).toBe("folder");
});

test("Passing new expanded state updates list", () => {
  let expandedState: Record<string, boolean> = {
    root: true,
  };

  const { result, rerender } = renderHook((initialProps) => useTree<TreeNode>({ ...initialProps }), {
    initialProps: {
      data: treeData,
      expandedState,
      onExpandedStateChange: (newState: Record<string, boolean>) => {
        expandedState = newState;
      },
    },
  });

  expect(result.current.visibleList.length).toBe(3);

  const folder2 = result.current.visibleList.find((node) => node.id === "folder2");
  folder2!.toggleExpanded();

  rerender({
    data: treeData,
    expandedState: { ...expandedState },
    onExpandedStateChange: () => {},
  });

  expect(result.current.visibleList.length).toBe(4);
});

test("Expanded state change callback not called when state is not passed", () => {
  let mutVal = "hello";

  const { result } = renderHook((initialProps) => useTree<TreeNode>({ ...initialProps }), {
    initialProps: {
      data: treeData,
      onExpandedStateChange: () => {
        mutVal = "world";
      },
    },
  });

  expect(mutVal).toBe("hello");

  const folder2 = result.current.visibleList.find((node) => node.id === "folder2");
  folder2!.toggleExpanded();

  expect(mutVal).toBe("hello");
});

test("Calling node select invokes callback", () => {
  const expandedState: Record<string, boolean> = {
    root: true,
  };
  let selectedId = "";

  const { result } = renderHook((initialProps) => useTree<TreeNode>({ ...initialProps }), {
    initialProps: {
      data: treeData,
      expandedState,
      onSelection: (node: TreeNode) => {
        selectedId = node.id;
      },
    },
  });

  const folder2 = result.current.visibleList.find((node) => node.id === "folder2");
  folder2!.select();

  expect(selectedId).toBe("folder2");
});

test("Using filter reduces the list", () => {
  const { result } = renderHook(
    (initialProps: { data: TreeNode; searchTerm: string; searchMatch: (node: TreeNode, term: string) => boolean }) =>
      useTree<TreeNode>({ ...initialProps }),
    {
      initialProps: {
        data: treeData,
        searchTerm: "Two",
        searchMatch: (node, term) => node.name.includes(term),
      },
    }
  );

  expect(result.current.visibleList.length).toBe(2);
});

test("Passing childSort reorganizes children", () => {
  const expandedState: Record<string, boolean> = {
    root: true,
  };

  const { result } = renderHook(
    (initialProps: {
      data: TreeNode;
      expandedState: Record<string, boolean>;
      showRoot: boolean;
      childSort: (nodeA: TreeNode, nodeB: TreeNode) => number;
    }) => useTree<typeof treeData>({ ...initialProps }),
    {
      initialProps: {
        data: treeData,
        expandedState,
        showRoot: false,
        childSort: (nodeA, nodeB) => nodeB.name.localeCompare(nodeA.name),
      },
    }
  );

  expect(result.current.visibleList[0].name).toBe("Folder Two");
});

type CustomTreeNode = { qx: string; label: string; childrenQx?: string[] };
const customTreeData: Record<string, CustomTreeNode> = {
  root: {
    qx: "root",
    label: "Root",
    childrenQx: ["folder", "folder2"],
  },
  folder: {
    qx: "folder",
    label: "Folder",
  },
  folder2: {
    qx: "folder2",
    label: "Folder Two",
    childrenQx: ["nestedItem"],
  },
  nestedItem: {
    qx: "nestedItem",
    label: "Nested Item",
  },
} as const;

test("Using custom data with accessor props builds a full list", () => {
  const { result } = renderHook(
    (initialProps: {
      data: CustomTreeNode;
      getId: (node: CustomTreeNode) => string;
      getChildren: (node: CustomTreeNode) => CustomTreeNode[] | undefined;
    }) => useTree<CustomTreeNode>({ ...initialProps }),
    {
      initialProps: {
        data: customTreeData.root,
        getId: (node) => node.qx,
        getChildren: (node) => node.childrenQx?.map((id) => customTreeData[id]),
      },
    }
  );

  expect(result.current.visibleList.length).toBe(4);
});
