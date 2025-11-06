import { createFileRoute, Link } from '@tanstack/react-router';

import { useTree } from '../../../src/tree_hook/use_tree';
import { useCallback, useState } from 'react';

export const Route = createFileRoute('/basic')({
  component: RouteComponent,
});

interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
}

function RouteComponent() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedState, setExpandedState] = useState<Record<string, boolean>>({});

  const [treeData] = useState<TreeNode>({
    id: 'root',
    name: 'Root',
    children: [
      {
        id: 'folder',
        name: 'Folder',
      },
      {
        id: 'folder2',
        name: 'Folder Two',
        children: [
          {
            id: 'nestedItem',
            name: 'Nested Item',
          },
        ],
      },
    ],
  });

  const selectNode = useCallback((node: TreeNode) => {
    setSelectedNodeId(node.id);
  }, []);

  const { visibleList: visibleNodes } = useTree({
    data: treeData,
    expandedState,
    onExpandedStateChange: setExpandedState,
    onSelection: selectNode,
  });

  return (
    <div>
      <Link to="/">Go Back Home</Link>
      <div role="tree" style={{ height: '600px', overflow: 'auto' }}>
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
                display: 'flex',
                height: '30px',
                alignItems: 'center',
                border: node.id === selectedNodeId ? '1px dashed blue' : undefined,
              }}
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
              {node.name}
            </div>
          );
        })}
      </div>
    </div>
  );
}
