import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import api from "@/services/api";
import { Loader2 } from "lucide-react";
import { CategoryType, type Category } from "@/types/category";
import { generateSlug } from "@/utils/validation";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  type: z.nativeEnum(CategoryType),
  parentId: z.number().optional().nullable(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  order: z.number().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormDialogProps {
  category?: Category;
  parentCategory?: Category; // For adding child category
  categories: Category[];
  onSuccess: () => void;
  onCancel: () => void;
}

// Flatten categories for dropdown
function flattenCategories(categories: Category[], excludeId?: number, level = 0): Array<Category & { displayName: string }> {
  const result: Array<Category & { displayName: string }> = [];
  for (const cat of categories) {
    if (cat.id !== excludeId) {
      result.push({
        ...cat,
        displayName: "  ".repeat(level) + cat.name,
      });
      if (cat.children && cat.children.length > 0) {
        result.push(...flattenCategories(cat.children, excludeId, level + 1));
      }
    }
  }
  return result;
}

export function CategoryFormDialog({
  category,
  parentCategory,
  categories,
  onSuccess,
  onCancel,
}: CategoryFormDialogProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const isEdit = !!category;
  const isAddChild = !!parentCategory && !category;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || "",
      slug: category?.slug || "",
      type: category?.type || parentCategory?.type || CategoryType.OTHER,
      parentId: category?.parentId || (parentCategory ? parentCategory.id : null),
      description: category?.description || "",
      isActive: category?.isActive ?? true,
      order: category?.order || 0,
    },
  });

  const nameValue = watch("name");
  const slugValue = watch("slug");

  // Auto-generate slug from name
  useEffect(() => {
    if (!isEdit && nameValue && !slugValue) {
      setValue("slug", generateSlug(nameValue));
    }
  }, [nameValue, slugValue, isEdit, setValue]);

  const onSubmit = async (data: CategoryFormData) => {
    try {
      setLoading(true);
      const payload: any = {
        name: data.name,
        slug: data.slug,
        type: data.type,
        description: data.description,
        isActive: data.isActive,
        order: data.order,
      };
      if (data.parentId) {
        payload.parentId = data.parentId;
      }
      
      if (isEdit) {
        await api.categories.update(category.id, payload);
        toast.success(t("categories.updateSuccess", "Cập nhật danh mục thành công"));
      } else {
        await api.categories.create(payload);
        toast.success(t("categories.createSuccess", "Tạo danh mục thành công"));
      }
      onSuccess();
    } catch (error: any) {
      toast.error(
        error.response?.data?.error ||
          (isEdit
            ? t("categories.updateError", "Lỗi khi cập nhật danh mục")
            : t("categories.createError", "Lỗi khi tạo danh mục"))
      );
    } finally {
      setLoading(false);
    }
  };

  const flatCategories = flattenCategories(categories, category?.id);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t("categories.name", "Tên danh mục")}</Label>
        <Input
          id="name"
          {...register("name")}
          disabled={loading}
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">{t("categories.slug", "Slug")}</Label>
        <Input
          id="slug"
          {...register("slug")}
          disabled={loading}
          className={errors.slug ? "border-red-500" : ""}
        />
        {errors.slug && (
          <p className="text-sm text-red-500">{errors.slug.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">{t("categories.typeLabel", "Loại")}</Label>
        <Select
          value={watch("type")}
          onValueChange={(value) => setValue("type", value as CategoryType)}
          disabled={loading}
        >
          <SelectTrigger className={errors.type ? "border-red-500" : ""}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={CategoryType.EVENT}>{t("categories.type.event", "Sự kiện")}</SelectItem>
            <SelectItem value={CategoryType.NEWS_TYPE}>{t("categories.type.news_type", "Loại tin tức")}</SelectItem>
            <SelectItem value={CategoryType.OTHER}>{t("categories.type.other", "Khác")}</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && (
          <p className="text-sm text-red-500">{errors.type.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="parentId">
          {t("categories.parent", "Danh mục cha")} ({t("common.optional", "tùy chọn")})
        </Label>
        <Select
          value={watch("parentId")?.toString() || "none"}
          onValueChange={(value) => setValue("parentId", value === "none" ? null : parseInt(value))}
          disabled={loading || isAddChild} // Disable when adding child (parent is fixed)
        >
          <SelectTrigger>
            <SelectValue placeholder={t("categories.selectParent", "Chọn danh mục cha")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("categories.noParent", "Không có")}</SelectItem>
            {flatCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isAddChild && parentCategory && (
          <p className="text-sm text-gray-500">
            {t("categories.addingChildTo", "Đang thêm danh mục con vào")}: <strong>{parentCategory.name}</strong>
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("categories.description", "Mô tả")}</Label>
        <Textarea
          id="description"
          {...register("description")}
          disabled={loading}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="order">{t("categories.order", "Thứ tự")}</Label>
        <Input
          id="order"
          type="number"
          {...register("order", { valueAsNumber: true })}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="isActive">{t("categories.status", "Trạng thái")}</Label>
        <Select
          value={watch("isActive") ? "true" : "false"}
          onValueChange={(value) => setValue("isActive", value === "true")}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">{t("categories.active", "Hoạt động")}</SelectItem>
            <SelectItem value="false">{t("categories.inactive", "Vô hiệu hóa")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          {t("common.cancel", "Hủy")}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("common.saving", "Đang lưu...")}
            </>
          ) : (
            isEdit ? t("common.save", "Lưu") : t("common.create", "Tạo")
          )}
        </Button>
      </div>
    </form>
  );
}

