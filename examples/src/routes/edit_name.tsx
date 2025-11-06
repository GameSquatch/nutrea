import { createFileRoute, Link } from '@tanstack/react-router';
import { useCallback, useRef, useState, type FC } from 'react';
import { createFlatTree, createNameTree, type FlatNode } from '../data/generate_names';
import { useTree, type TreeDataNode } from '../../../src/tree_hook/use_tree';
import { useVirtualizer } from '@tanstack/react-virtual';

export const Route = createFileRoute('/edit_name')({
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
  const scrollableRef = useRef<HTMLDivElement>(null);

  const [treeData, setTreeData] = useState<Record<string, FlatNode>>(() => createFlatTree(createNameTree(500)));

  const updateNodeName = useCallback(
    (node: TreeNode, newName: string) => {
      // Remembering to clone the root node to trigger rebuild
      setTreeData({
        ...treeData,
        root: {
          ...treeData.root,
        },
        [node.id]: {
          ...node,
          name: newName,
        },
      });
    },
    [treeData]
  );

  const selectNode = useCallback((node: FlatNode) => {
    setSelectedNodeId(node.id);
  }, []);

  // Notice we are passing the root node as data. Since our data is a flat map, which makes it much easier
  // and more efficient to update nodes, we have to remember to clone the root node whenever we are
  // updating treeData state.
  const { visibleList: visibleNodes } = useTree({
    data: treeData['root'],
    getChildren: (node) => node.pets?.map((petId) => treeData[petId]),
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
              <TreeItem
                key={node.id}
                node={node}
                selectedNodeId={selectedNodeId}
                start={vi.start}
                onChangeName={(newName) => {
                  updateNodeName(node, newName);
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

const TreeItem: FC<{
  node: TreeDataNode<TreeNode>;
  selectedNodeId: string | null;
  start: number;
  onChangeName: (newName: string) => void;
}> = ({ node, selectedNodeId, start, onChangeName }) => {
  const [isEditing, setIsEditing] = useState(false);
  const isSelected = selectedNodeId === node.id;

  const changeName = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setIsEditing(false);
      onChangeName(e.target.value);
    },
    [onChangeName]
  );

  return (
    <div
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
        position: 'absolute',
        left: 0,
        top: `${start}px`,
        width: '100%',
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
      {isEditing ? (
        <input type="text" onBlur={changeName} defaultValue={node.name} />
      ) : (
        <span onClick={() => isSelected && setIsEditing(true)}>{node.name}</span>
      )}
    </div>
  );
};
