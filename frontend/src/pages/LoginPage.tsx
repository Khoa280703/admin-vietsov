import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Loader2, LogIn } from "lucide-react";
import vietsovLogo from "@/assets/logo/Logo VSP mau moi nhat.png";
import { getDefaultRoute } from "@/utils/navigation";

const loginSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Redirect if already authenticated (after all hooks)
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={getDefaultRoute(user)} replace />;
  }

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const loggedInUser = await login(data.username, data.password);
      toast.success(t("auth.loginSuccess", "Đăng nhập thành công"));
      navigate(getDefaultRoute(loggedInUser ?? user), { replace: true });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || t("auth.loginFailed", "Đăng nhập thất bại");
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-vietsov-gradient-green p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <img src={vietsovLogo} alt="Vietsov Logo" className="h-16 w-auto object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {t("auth.loginTitle", "Đăng nhập")}
          </CardTitle>
          <CardDescription>
            {t("auth.loginDescription", "Nhập thông tin đăng nhập của bạn")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                {t("auth.username", "Tên đăng nhập hoặc Email")}
              </label>
              <Input
                id="username"
                type="text"
                placeholder={t("auth.usernamePlaceholder", "Nhập username hoặc email")}
                {...register("username")}
                disabled={isLoading}
                className={errors.username ? "border-red-500" : ""}
              />
              {errors.username && (
                <p className="text-sm text-red-500">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                {t("auth.password", "Mật khẩu")}
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder={t("auth.passwordPlaceholder", "Nhập mật khẩu")}
                {...register("password")}
                disabled={isLoading}
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("auth.loggingIn", "Đang đăng nhập...")}
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  {t("auth.login", "Đăng nhập")}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

