import { Badge } from "@/components/ui/badge";
import type { ArticleStatus } from "@/types/article";
import { useTranslation } from "react-i18next";

interface ArticleStatusBadgeProps {
  status: ArticleStatus;
}

export function ArticleStatusBadge({ status }: ArticleStatusBadgeProps) {
  const { t } = useTranslation();
  
  const statusConfig: Record<ArticleStatus, { labelKey: string; className: string }> = {
    draft: {
      labelKey: "articles.status.draft",
      className: "bg-gray-100 text-gray-800",
    },
    submitted: {
      labelKey: "articles.status.submitted",
      className: "bg-blue-100 text-blue-800",
    },
    under_review: {
      labelKey: "articles.status.under_review",
      className: "bg-yellow-100 text-yellow-800",
    },
    approved: {
      labelKey: "articles.status.approved",
      className: "bg-vietsov-green/10 text-vietsov-green border border-vietsov-green/20",
    },
    rejected: {
      labelKey: "articles.status.rejected",
      className: "bg-red-100 text-red-800",
    },
    published: {
      labelKey: "articles.status.published",
      className: "bg-vietsov-green/20 text-vietsov-green border border-vietsov-green/30",
    },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <Badge className={config.className} variant="secondary">
      {t(config.labelKey)}
    </Badge>
  );
}

