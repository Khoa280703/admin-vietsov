import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { AdminLayout } from "./components/Admin/AdminLayout";
import { ArticleEditorMain } from "./components/ArticleEditor/ArticleEditorMain";
import { UsersPage } from "./pages/UsersPage";
import { RolesPage } from "./pages/RolesPage";
import { ArticlesPage } from "./pages/ArticlesPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { TagsPage } from "./pages/TagsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LogsPage } from "./pages/LogsPage";
import { Toaster } from "@/components/ui/sonner";
import "./styles/editor.css";
import "./styles/toolbar.css";
import "./styles/responsive.css";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<ArticleEditorMain />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/articles" element={<ArticlesPage />} />
                  <Route
                    path="/users"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <UsersPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/roles"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <RolesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/categories"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <CategoriesPage />
                      </ProtectedRoute>
                    }
                  />
                        <Route
                          path="/tags"
                          element={
                            <ProtectedRoute requiredRole="admin">
                              <TagsPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/logs"
                          element={
                            <ProtectedRoute requiredRole="admin">
                              <LogsPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
