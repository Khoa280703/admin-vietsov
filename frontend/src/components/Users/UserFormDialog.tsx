import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import api from "@/services/api";
import { Loader2 } from "lucide-react";

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  roleId: number;
  isActive: boolean;
}

interface Role {
  id: number;
  name: string;
  description?: string;
}

const userSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().optional(),
  fullName: z.string().min(1, "Full name is required"),
  roleId: z.number().min(1, "Role is required"),
  isActive: z.boolean().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormDialogProps {
  user?: User;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UserFormDialog({ user, onSuccess, onCancel }: UserFormDialogProps) {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const isEdit = !!user;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
      password: "",
      fullName: user?.fullName || "",
      roleId: user?.roleId || 0,
      isActive: user?.isActive ?? true,
    },
  });

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.roles.list();
        setRoles(response.data || []);
      } catch (error) {
        toast.error(t("users.fetchRolesError", "Lỗi khi tải danh sách vai trò"));
      }
    };
    fetchRoles();
  }, [t]);

  const onSubmit = async (data: UserFormData) => {
    try {
      setLoading(true);
      if (isEdit) {
        const updateData: any = {
          username: data.username,
          email: data.email,
          fullName: data.fullName,
          roleId: data.roleId,
          isActive: data.isActive,
        };
        if (data.password) {
          // Note: Backend might need password update endpoint
        }
        await api.users.update(user.id, updateData);
        toast.success(t("users.updateSuccess", "Cập nhật người dùng thành công"));
      } else {
        if (!data.password) {
          toast.error(t("users.passwordRequired", "Mật khẩu là bắt buộc"));
          return;
        }
        await api.users.create({
          username: data.username,
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          roleId: data.roleId,
        });
        toast.success(t("users.createSuccess", "Tạo người dùng thành công"));
      }
      onSuccess();
    } catch (error: any) {
      toast.error(
        error.response?.data?.error ||
          (isEdit
            ? t("users.updateError", "Lỗi khi cập nhật người dùng")
            : t("users.createError", "Lỗi khi tạo người dùng"))
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">{t("users.username", "Tên đăng nhập")}</Label>
        <Input
          id="username"
          {...register("username")}
          disabled={loading}
          className={errors.username ? "border-red-500" : ""}
        />
        {errors.username && (
          <p className="text-sm text-red-500">{errors.username.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t("users.email", "Email")}</Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          disabled={loading}
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">
          {t("users.password", "Mật khẩu")} {isEdit && `(${t("users.optional", "tùy chọn")})`}
        </Label>
        <Input
          id="password"
          type="password"
          {...register("password")}
          disabled={loading}
          className={errors.password ? "border-red-500" : ""}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">{t("users.fullName", "Họ tên")}</Label>
        <Input
          id="fullName"
          {...register("fullName")}
          disabled={loading}
          className={errors.fullName ? "border-red-500" : ""}
        />
        {errors.fullName && (
          <p className="text-sm text-red-500">{errors.fullName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="roleId">{t("users.role", "Vai trò")}</Label>
        <Select
          value={watch("roleId")?.toString() || ""}
          onValueChange={(value) => setValue("roleId", parseInt(value))}
          disabled={loading}
        >
          <SelectTrigger className={errors.roleId ? "border-red-500" : ""}>
            <SelectValue placeholder={t("users.selectRole", "Chọn vai trò")} />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id.toString()}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.roleId && (
          <p className="text-sm text-red-500">{errors.roleId.message}</p>
        )}
      </div>

      {isEdit && (
        <div className="space-y-2">
          <Label htmlFor="isActive">{t("users.status", "Trạng thái")}</Label>
          <Select
            value={watch("isActive") ? "true" : "false"}
            onValueChange={(value) => setValue("isActive", value === "true")}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">{t("users.active", "Hoạt động")}</SelectItem>
              <SelectItem value="false">{t("users.inactive", "Vô hiệu hóa")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

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

