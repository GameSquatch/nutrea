import { createFileRoute, Link } from '@tanstack/react-router';

import { useTree } from '../../../src/tree_hook/use_tree';
import { useCallback, useRef, useState } from 'react';
import { createNameTree } from '../data/generate_names';
import { useVirtualizer } from '@tanstack/react-virtual';

export const Route = createFileRoute('/virtualized')({
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
  const scrollableRef = useRef<HTMLDivElement>(null);

  const [treeData] = useState<TreeNode>(() => createNameTree(500));

  const selectNode = useCallback((node: TreeNode) => {
    setSelectedNodeId(node.id);
  }, []);

  const { visibleList: visibleNodes } = useTree({
    data: treeData,
    getChildren: (node) => node.pets,
    expandedState,
    onExpandedStateChange: setExpandedState,
    onSelection: selectNode,
    showRoot: false,
  });

  const virtual = useVirtualizer({
    getScrollElement: () => scrollableRef.current,
    count: visibleNodes.length,
    estimateSize: () => 30,
    overscan: 5,
  });

  return (
    <div>
      <Link to="/">Go Back Home</Link>
      <div role="tree" ref={scrollableRef} style={{ height: '600px', overflow: 'auto' }}>
        <div style={{ position: 'relative', height: `${virtual.getTotalSize()}px` }}>
          {virtual.getVirtualItems().map((vi) => {
            const node = visibleNodes[vi.index];

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
                  position: 'absolute',
                  left: 0,
                  top: `${vi.start}px`,
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
    </div>
  );
}
