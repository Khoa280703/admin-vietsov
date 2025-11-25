import * as React from "react";
import { ChevronRight, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible";

interface TreeNode {
  id: number;
  name: string;
  slug: string;
  children?: TreeNode[];
}

interface TreeSelectProps {
  value?: string;
  onValueChange: (value: string, node: TreeNode) => void;
  options: TreeNode[];
  placeholder?: string;
  disabled?: boolean;
}

const TreeNodeItem: React.FC<{
  node: TreeNode;
  level: number;
  selectedId?: number;
  onSelect: (node: TreeNode) => void;
}> = ({ node, level, selectedId, onSelect }) => {
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
          isSelected && "bg-accent font-medium"
        )}
        style={{ paddingLeft: `${12 + level * 20}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="flex items-center justify-center w-4 h-4 hover:bg-accent rounded"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}
        <span
          className="flex-1 cursor-pointer hover:bg-accent rounded px-1 py-0.5 -mx-1"
          onClick={() => onSelect(node)}
        >
          {node.name}
        </span>
        {isSelected && <Check className="h-4 w-4 text-primary" />}
      </div>
      {hasChildren && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent>
            <div>
              {node.children?.map((child) => (
                <TreeNodeItem
                  key={child.id}
                  node={child}
                  level={level + 1}
                  selectedId={selectedId}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

export const TreeSelect: React.FC<TreeSelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder = "Chọn danh mục",
  disabled = false,
}) => {
  const [open, setOpen] = React.useState(false);
  const selectedNode = React.useMemo(() => {
    const findNode = (nodes: TreeNode[]): TreeNode | null => {
      for (const node of nodes) {
        if (node.id.toString() === value) {
          return node;
        }
        if (node.children) {
          const found = findNode(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findNode(options);
  }, [options, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedNode ? selectedNode.name : placeholder}
          <ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50 rotate-90" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <div className="max-h-[300px] overflow-y-auto p-2">
          {options.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Không có danh mục nào
            </div>
          ) : (
            options.map((node) => (
              <TreeNodeItem
                key={node.id}
                node={node}
                level={0}
                selectedId={value ? parseInt(value) : undefined}
                onSelect={(node) => {
                  onValueChange(node.id.toString(), node);
                  setOpen(false);
                }}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

