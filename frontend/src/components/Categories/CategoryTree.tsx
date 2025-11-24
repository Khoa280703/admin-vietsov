import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronRight, ChevronDown, Folder, MoreVertical, Edit, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type { Category } from "@/types/category";

interface CategoryTreeProps {
  categories: Category[];
  searchTerm?: string;
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
  onAddChild: (parentCategory: Category) => void;
}

function CategoryNode({
  category,
  level = 0,
  searchTerm,
  onEdit,
  onDelete,
  onAddChild,
}: {
  category: Category;
  level?: number;
  searchTerm?: string;
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
  onAddChild: (parentCategory: Category) => void;
}) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;
  const matchesSearch = !searchTerm || 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase());

  // If searching, show all matching nodes and their children
  const shouldShow = matchesSearch || (searchTerm && hasChildren && 
    category.children?.some(child => 
      child.name.toLowerCase().includes(searchTerm.toLowerCase())
    ));

  if (!shouldShow && searchTerm) {
    return null;
  }

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 py-2 px-3 rounded hover:bg-gray-50 group",
          level > 0 && "ml-4"
        )}
        style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="w-6" />
        )}
        <Folder className="h-4 w-4 text-gray-500" />
        <div className="flex-1">
          <div className="font-medium">{category.name}</div>
          {category.description && (
            <div className="text-sm text-gray-500">{category.description}</div>
          )}
          <div className="flex gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              {t(`categories.type.${category.type}`, category.type)}
            </span>
            {!category.isActive && (
              <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-800">
                Inactive
              </span>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-transparent hover:border-gray-300"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onAddChild(category)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("categories.addChild", "Thêm danh mục con")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(category)}>
              <Edit className="mr-2 h-4 w-4" />
              {t("categories.edit", "Chỉnh sửa")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(category.id)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              {t("categories.delete", "Xóa")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {category.children!.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              level={level + 1}
              searchTerm={searchTerm}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryTree({ categories, searchTerm, onEdit, onDelete, onAddChild }: CategoryTreeProps) {
  // Filter root categories (no parent)
  const rootCategories = categories.filter((cat) => !cat.parentId);

  return (
    <div className="space-y-1">
      {rootCategories.map((category) => (
        <CategoryNode
          key={category.id}
          category={category}
          searchTerm={searchTerm}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddChild={onAddChild}
        />
      ))}
    </div>
  );
}

