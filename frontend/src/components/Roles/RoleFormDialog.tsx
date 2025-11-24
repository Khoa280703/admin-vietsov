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
// PermissionEditor is embedded in this component

interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: string;
}

const roleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  permissions: z.record(z.array(z.string())),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface RoleFormDialogProps {
  role?: Role;
  onSuccess: () => void;
  onCancel: () => void;
}

const MODULES = [
  { id: "articles", label: "Articles" },
  { id: "users", label: "Users" },
  { id: "categories", label: "Categories" },
  { id: "tags", label: "Tags" },
];

const ACTIONS = [
  { id: "create", label: "Create" },
  { id: "read", label: "Read" },
  { id: "update", label: "Update" },
  { id: "delete", label: "Delete" },
  { id: "approve", label: "Approve" },
  { id: "reject", label: "Reject" },
  { id: "publish", label: "Publish" },
  { id: "submit", label: "Submit" },
];

export function RoleFormDialog({ role, onSuccess, onCancel }: RoleFormDialogProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const isEdit = !!role;

  const parsePermissions = (permissionsString?: string): Record<string, string[]> => {
    if (!permissionsString) return {};
    try {
      return JSON.parse(permissionsString);
    } catch {
      return {};
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: role?.name || "",
      description: role?.description || "",
      permissions: parsePermissions(role?.permissions),
    },
  });

  const permissions = watch("permissions");

  const handlePermissionChange = (module: string, action: string, checked: boolean) => {
    const current = permissions || {};
    const modulePermissions = current[module] || [];
    
    if (checked) {
      if (!modulePermissions.includes(action)) {
        setValue("permissions", {
          ...current,
          [module]: [...modulePermissions, action],
        });
      }
    } else {
      setValue("permissions", {
        ...current,
        [module]: modulePermissions.filter((a) => a !== action),
      });
    }
  };

  const onSubmit = async (data: RoleFormData) => {
    try {
      setLoading(true);
      const permissionsString = JSON.stringify(data.permissions);
      
      if (isEdit) {
        await api.roles.update(role.id, {
          name: data.name,
          description: data.description,
          permissions: permissionsString,
        });
        toast.success(t("roles.updateSuccess", "Cập nhật vai trò thành công"));
      } else {
        await api.roles.create({
          name: data.name,
          description: data.description,
          permissions: permissionsString,
        });
        toast.success(t("roles.createSuccess", "Tạo vai trò thành công"));
      }
      onSuccess();
    } catch (error: any) {
      toast.error(
        error.response?.data?.error ||
          (isEdit
            ? t("roles.updateError", "Lỗi khi cập nhật vai trò")
            : t("roles.createError", "Lỗi khi tạo vai trò"))
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">{t("roles.name", "Tên vai trò")}</Label>
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
        <Label htmlFor="description">{t("roles.description", "Mô tả")}</Label>
        <Textarea
          id="description"
          {...register("description")}
          disabled={loading}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("roles.permissions", "Quyền")}</Label>
        <div className="border rounded-lg p-4 space-y-4 max-h-96 overflow-y-auto">
          {MODULES.map((module) => (
            <div key={module.id} className="space-y-2">
              <h4 className="font-medium text-sm">{module.label}</h4>
              <div className="grid grid-cols-4 gap-2">
                {ACTIONS.map((action) => {
                  const modulePermissions = permissions?.[module.id] || [];
                  const isChecked = modulePermissions.includes(action.id);
                  
                  return (
                    <label
                      key={action.id}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          handlePermissionChange(module.id, action.id, e.target.checked)
                        }
                        disabled={loading}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{action.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
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

