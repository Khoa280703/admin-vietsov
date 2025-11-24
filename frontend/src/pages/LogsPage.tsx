import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import api from "@/services/api";
import { toast } from "sonner";
import { LogsTable } from "@/components/Logs/LogsTable";
import { LogFilters } from "@/components/Logs/LogFilters";
import { LogStatistics } from "@/components/Logs/LogStatistics";
import { ExportLogs } from "@/components/Logs/ExportLogs";
import type { Log, LogFilters as LogFiltersType, LogStats } from "@/types/log";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogsPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [filters, setFilters] = useState<LogFiltersType>({
    page: 1,
    limit: 50,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await api.logs.list(filters);
      setLogs(response.data || []);
      setPagination(response.pagination || pagination);
    } catch (error: any) {
      toast.error(error.response?.data?.error || t("logs.fetchError", "Lỗi khi tải logs"));
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.logs.getStats();
      setStats(data);
    } catch (error: any) {
      // Silently fail - statistics are optional
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filters]);

  const handleFilterChange = (newFilters: Partial<LogFiltersType>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{t("logs.title", "Quản lý Logs")}</h1>
        </div>
        <ExportLogs filters={filters} />
      </div>

      {/* Statistics */}
      {stats && <LogStatistics stats={stats} />}

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <LogFilters filters={filters} onFilterChange={handleFilterChange} />
        </div>

        {/* Logs Table */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>{t("logs.logsList", "Danh sách Logs")}</CardTitle>
              <CardDescription>
                {t("logs.logsListDesc", "Tổng cộng")} {pagination.total} {t("logs.logs", "logs")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LogsTable
                logs={logs}
                loading={loading}
                pagination={pagination}
                onPageChange={handlePageChange}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

