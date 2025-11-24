import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import { MoreVertical, Eye, Edit, Trash2, Send, Check, X, Globe } from "lucide-react";
import type { Article, ArticleStatus } from "@/types/article";

interface ArticleActionsProps {
  article: Article;
  onUpdate: () => void;
}

export function ArticleActions({ article, onUpdate }: ArticleActionsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role?.name === "admin";
  const isOwner = user?.id === article.authorId;

  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const canEdit = isAdmin || isOwner;
  const canDelete = isAdmin || isOwner;
  const canSubmit = isOwner && article.status === "draft";
  const canApprove = isAdmin && (article.status === "submitted" || article.status === "under_review");
  const canReject = isAdmin && (article.status === "submitted" || article.status === "under_review");
  const canPublish =
    isAdmin || (isOwner && article.status === "approved");

  const handleDelete = async () => {
    if (!confirm(t("articles.confirmDelete", "Bạn có chắc chắn muốn xóa bài viết này?"))) {
      return;
    }
    try {
      await api.articles.delete(article.id);
      toast.success(t("articles.deleteSuccess", "Xóa bài viết thành công"));
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.error || t("articles.deleteError", "Lỗi khi xóa bài viết"));
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await api.articles.submit(article.id);
      toast.success(t("articles.submitSuccess", "Gửi bài viết thành công"));
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.error || t("articles.submitError", "Lỗi khi gửi bài viết"));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      await api.articles.approve(article.id, notes || undefined);
      toast.success(t("articles.approveSuccess", "Duyệt bài viết thành công"));
      setIsApproveDialogOpen(false);
      setNotes("");
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.error || t("articles.approveError", "Lỗi khi duyệt bài viết"));
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!notes.trim()) {
      toast.error(t("articles.notesRequired", "Vui lòng nhập lý do từ chối"));
      return;
    }
    try {
      setLoading(true);
      await api.articles.reject(article.id, notes);
      toast.success(t("articles.rejectSuccess", "Từ chối bài viết thành công"));
      setIsRejectDialogOpen(false);
      setNotes("");
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.error || t("articles.rejectError", "Lỗi khi từ chối bài viết"));
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      setLoading(true);
      await api.articles.publish(article.id);
      toast.success(t("articles.publishSuccess", "Xuất bản bài viết thành công"));
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.error || t("articles.publishError", "Lỗi khi xuất bản bài viết"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={loading}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => navigate(`/articles/${article.id}`)}>
            <Eye className="mr-2 h-4 w-4" />
            {t("articles.view", "Xem")}
          </DropdownMenuItem>
          {canEdit && (
            <DropdownMenuItem onClick={() => navigate(`/articles/${article.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              {t("articles.edit", "Chỉnh sửa")}
            </DropdownMenuItem>
          )}
          {canSubmit && (
            <DropdownMenuItem onClick={handleSubmit} disabled={loading}>
              <Send className="mr-2 h-4 w-4" />
              {t("articles.submit", "Gửi duyệt")}
            </DropdownMenuItem>
          )}
          {canApprove && (
            <DropdownMenuItem onClick={() => setIsApproveDialogOpen(true)} disabled={loading}>
              <Check className="mr-2 h-4 w-4" />
              {t("articles.approve", "Duyệt")}
            </DropdownMenuItem>
          )}
          {canReject && (
            <DropdownMenuItem onClick={() => setIsRejectDialogOpen(true)} disabled={loading}>
              <X className="mr-2 h-4 w-4" />
              {t("articles.reject", "Từ chối")}
            </DropdownMenuItem>
          )}
          {canPublish && (
            <DropdownMenuItem onClick={handlePublish} disabled={loading}>
              <Globe className="mr-2 h-4 w-4" />
              {t("articles.publish", "Xuất bản")}
            </DropdownMenuItem>
          )}
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-red-600" disabled={loading}>
                <Trash2 className="mr-2 h-4 w-4" />
                {t("articles.delete", "Xóa")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("articles.approve", "Duyệt bài viết")}</DialogTitle>
            <DialogDescription>
              {t("articles.approveDescription", "Bạn có muốn duyệt bài viết này không?")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="approve-notes">{t("articles.notes", "Ghi chú")} ({t("common.optional", "tùy chọn")})</Label>
              <Textarea
                id="approve-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("articles.notesPlaceholder", "Nhập ghi chú (nếu có)")}
                rows={3}
                disabled={loading}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)} disabled={loading}>
                {t("common.cancel", "Hủy")}
              </Button>
              <Button onClick={handleApprove} disabled={loading}>
                {t("articles.approve", "Duyệt")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("articles.reject", "Từ chối bài viết")}</DialogTitle>
            <DialogDescription>
              {t("articles.rejectDescription", "Vui lòng nhập lý do từ chối bài viết")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reject-notes">{t("articles.rejectReason", "Lý do từ chối")} *</Label>
              <Textarea
                id="reject-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("articles.rejectReasonPlaceholder", "Nhập lý do từ chối...")}
                rows={4}
                disabled={loading}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} disabled={loading}>
                {t("common.cancel", "Hủy")}
              </Button>
              <Button onClick={handleReject} disabled={loading || !notes.trim()}>
                {t("articles.reject", "Từ chối")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

