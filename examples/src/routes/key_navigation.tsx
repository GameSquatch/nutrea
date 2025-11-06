import { createFileRoute, Link } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState, type FC } from 'react';
import { useTree, type TreeDataNode } from '../../../src/tree_hook/use_tree';
import { createNameTree } from '../data/generate_names';

export const Route = createFileRoute('/key_navigation')({
  component: RouteComponent,
});

interface TreeNode {
  id: string;
  name: string;
  pets?: TreeNode[];
}

function RouteComponent() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedState, setExpandedState] = useState<Record<string, boolean>>({});

  const [treeData] = useState<TreeNode>(() => createNameTree(100));

  const selectNode = useCallback((node: TreeNode) => {
    setSelectedNodeId(node.id);
  }, []);

  const { visibleList: visibleNodes, navigateWithKey } = useTree({
    data: treeData,
    getChildren: (node) => node.pets,
    expandedState,
    onExpandedStateChange: setExpandedState,
    onSelection: selectNode,
    showRoot: false,
  });

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
}> = ({ node, selectedNodeId, navigateWithKey }) => {
  const isSelected = selectedNodeId === node.id;
  const nodeRef = useRef<HTMLDivElement>(null);

  // Focus will follow selected.
  // This also works in virtualized lists when nodes are scrolled back into view.
  useEffect(() => {
    if (isSelected && nodeRef.current) {
      nodeRef.current.focus();
    }
  }, [isSelected]);

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
