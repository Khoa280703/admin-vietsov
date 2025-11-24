import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import api from "@/services/api";
import { CategoryFormDialog } from "@/components/Categories/CategoryFormDialog";
import { CategoryTree } from "@/components/Categories/CategoryTree";
import { Plus, Search, FolderTree } from "lucide-react";
import { CategoryType } from "@/types/category";

export function CategoriesPage() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [parentCategoryForChild, setParentCategoryForChild] = useState<any | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const type = typeFilter !== "all" ? (typeFilter as CategoryType) : undefined;
      const response = await api.categories.list(type);
      setCategories(response.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.error || t("categories.fetchError", "Lỗi khi tải danh sách danh mục"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [typeFilter]);

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    fetchCategories();
  };

  const handleEditSuccess = () => {
    setIsCreateDialogOpen(false);
    setEditingCategory(null);
    setParentCategoryForChild(null);
    fetchCategories();
  };

  const handleAddChild = (parentCategory: Category) => {
    setParentCategoryForChild(parentCategory);
    setEditingCategory(null);
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("categories.confirmDelete", "Bạn có chắc chắn muốn xóa danh mục này?"))) {
      return;
    }
    try {
      await api.categories.delete(id);
      toast.success(t("categories.deleteSuccess", "Xóa danh mục thành công"));
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.error || t("categories.deleteError", "Lỗi khi xóa danh mục"));
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FolderTree className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{t("categories.title", "Quản lý danh mục")}</h1>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingCategory(null)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("categories.create", "Tạo danh mục")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCategory
                  ? t("categories.editCategory", "Chỉnh sửa danh mục")
                  : t("categories.createCategory", "Tạo danh mục mới")}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? t("categories.editDescription", "Cập nhật thông tin danh mục")
                  : t("categories.createDescription", "Điền thông tin để tạo danh mục mới")}
              </DialogDescription>
            </DialogHeader>
            <CategoryFormDialog
              category={editingCategory || undefined}
              parentCategory={parentCategoryForChild || undefined}
              categories={categories}
              onSuccess={editingCategory ? handleEditSuccess : handleCreateSuccess}
              onCancel={() => {
                setIsCreateDialogOpen(false);
                setEditingCategory(null);
                setParentCategoryForChild(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("categories.searchPlaceholder", "Tìm kiếm danh mục...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t("categories.filterByType", "Lọc theo loại")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("categories.allTypes", "Tất cả loại")}</SelectItem>
            <SelectItem value="event">{t("categories.type.event", "Sự kiện")}</SelectItem>
            <SelectItem value="news_type">{t("categories.type.news_type", "Loại tin tức")}</SelectItem>
            <SelectItem value="other">{t("categories.type.other", "Khác")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tree View */}
      <div className="border rounded-lg p-4">
        {loading ? (
          <div className="text-center text-gray-500 py-8">{t("categories.loading", "Đang tải...")}</div>
        ) : categories.length === 0 ? (
          <div className="text-center text-gray-500 py-8">{t("categories.noCategories", "Không có danh mục nào")}</div>
        ) : (
          <CategoryTree
            categories={categories}
            searchTerm={searchTerm}
            onEdit={(category) => {
              setEditingCategory(category);
              setParentCategoryForChild(null);
              setIsCreateDialogOpen(true);
            }}
            onDelete={handleDelete}
            onAddChild={handleAddChild}
          />
        )}
      </div>
    </div>
  );
}

