import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import api from "@/services/api";
import { Loader2 } from "lucide-react";
import { generateSlug } from "@/utils/validation";

const tagSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
});

type TagFormData = z.infer<typeof tagSchema>;

interface Tag {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

interface TagFormDialogProps {
  tag?: Tag;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TagFormDialog({ tag, onSuccess, onCancel }: TagFormDialogProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const isEdit = !!tag;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: tag?.name || "",
      slug: tag?.slug || "",
      description: tag?.description || "",
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

  const onSubmit = async (data: TagFormData) => {
    try {
      setLoading(true);
      if (isEdit) {
        await api.tags.update(tag.id, data);
        toast.success(t("tags.updateSuccess", "Cập nhật thẻ thành công"));
      } else {
        await api.tags.create(data);
        toast.success(t("tags.createSuccess", "Tạo thẻ thành công"));
      }
      onSuccess();
    } catch (error: any) {
      toast.error(
        error.response?.data?.error ||
          (isEdit
            ? t("tags.updateError", "Lỗi khi cập nhật thẻ")
            : t("tags.createError", "Lỗi khi tạo thẻ"))
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t("tags.name", "Tên thẻ")}</Label>
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
        <Label htmlFor="slug">{t("tags.slug", "Slug")}</Label>
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
        <Label htmlFor="description">{t("tags.description", "Mô tả")}</Label>
        <Textarea
          id="description"
          {...register("description")}
          disabled={loading}
          rows={3}
        />
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

