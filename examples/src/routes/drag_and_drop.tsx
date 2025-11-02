import { createFileRoute, Link } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState, type FC } from 'react';
import { useTree, type TreeDataNode } from '../../../src/tree_hook/use_tree';
import { createFlatTree, createNameTree } from '../data/generate_names';

export const Route = createFileRoute('/drag_and_drop')({
  component: RouteComponent,
});

interface TreeNode {
  id: string;
  name: string;
  pets?: string[];
}

function RouteComponent() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedState, setExpandedState] = useState<Record<string, boolean>>({});

  const [treeData, setTreeData] = useState<Record<string, TreeNode>>(() => createFlatTree(createNameTree(100)));

  const selectNode = useCallback((node: TreeNode) => {
    setSelectedNodeId(node.id);
  }, []);

  const { visibleList: visibleNodes, navigateWithKey } = useTree({
    data: treeData['root'],
    getChildren: (node) => node.pets?.map((id) => treeData[id]),
    expandedState,
    onExpandedStateChange: setExpandedState,
    onSelection: selectNode,
    showRoot: false,
  });

  const moveNode = useCallback(
    (nodeId: string, currentParentId: string, newParentId: string) => {
      setTreeData((state) => {
        const currentParent = { ...state[currentParentId] };

        currentParent.pets = currentParent.pets!.filter((id) => id !== nodeId);

        const newParent = { ...state[newParentId] };
        if (!newParent.pets) {
          newParent.pets = [];
        }
        newParent.pets = [...newParent.pets, nodeId];

        return {
          ...state,
          root: { ...state.root },
          [currentParentId]: currentParent,
          [newParentId]: newParent,
        };
      });

      // Open the new parent if it's not open currently
      if (!expandedState[newParentId]) {
        setExpandedState((state) => ({
          ...state,
          [newParentId]: true,
        }));
      }
    },
    [expandedState]
  );

  return (
    <div>
      <Link to="/">Go Back Home</Link>
      <div role="tree" style={{ height: '600px', overflow: 'auto' }}>
        {visibleNodes.map((node, i) => {
          return (
            <TreeItem
              key={node.id}
              node={node}
              selectedNodeId={selectedNodeId}
              navigateWithKey={(e) => navigateWithKey(e, i)}
              onNodeMoved={moveNode}
            />
          );
        })}
      </div>
    </div>
  );
}

const TreeItem: FC<{
  node: TreeDataNode<TreeNode>;
  selectedNodeId: string | null;
  navigateWithKey: (e: React.KeyboardEvent) => void;
  onNodeMoved: (nodeId: string, currentParentId: string, newParentId: string) => void;
}> = ({ node, selectedNodeId, navigateWithKey, onNodeMoved }) => {
  const isSelected = selectedNodeId === node.id;
  const nodeRef = useRef<HTMLDivElement>(null);

  // Focus will follow selected.
  // This also works in virtualized lists when nodes are scrolled back into view.
  useEffect(() => {
    if (isSelected && nodeRef.current) {
      nodeRef.current.focus();
    }
  }, [isSelected]);

  const startDrag = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData('app/node-id', node.id);
      e.dataTransfer.setData('app/parent-id', node.parentId ?? '');
    },
    [node]
  );

  const drop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      const nodeId = e.dataTransfer.getData('app/node-id');
      const parentId = e.dataTransfer.getData('app/parent-id');
      onNodeMoved(nodeId, parentId, node.id);
    },
    [node, onNodeMoved]
  );

  return (
    <div
      ref={nodeRef}
      tabIndex={-1}
      onClick={node.select}
      role="tree-item"
      aria-expanded={node.isExpanded}
      aria-selected={selectedNodeId !== null && isSelected}
      key={node.id}
      style={{
        paddingLeft: `${node.level * 16 + 8}px`,
        display: 'flex',
        height: '30px',
        alignItems: 'center',
        border: node.id === selectedNodeId ? '1px dashed blue' : undefined,
        width: '100%',
      }}
      onKeyDown={navigateWithKey}
      onDragStart={startDrag}
      onDragEnter={(e) => e.preventDefault()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={drop}
      draggable="true"
    >
      {node.hasChildren ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            node.toggleExpanded();
          }}
          style={{ display: 'inline-block', width: '20px', height: '25px', marginRight: '8px' }}
        >
          {node.isExpanded ? '-' : '+'}
        </button>
      ) : (
        <div style={{ width: '20px' }}></div>
      )}
      <span>{node.name}</span>
    </div>
  );
};
