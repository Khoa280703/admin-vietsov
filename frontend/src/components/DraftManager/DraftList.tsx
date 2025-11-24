import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StorageManager } from '@/utils/storage';
import type { DraftMetadata } from '@/types/article';
import { FileText, Trash2, Copy, Download, Clock, FileCode, FileJson } from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface DraftListProps {
  currentDraftId?: string;
  onLoadDraft: (id: string) => void;
  onNewDraft: () => void;
}

export function DraftList({ currentDraftId, onLoadDraft, onNewDraft }: DraftListProps) {
  const [drafts, setDrafts] = useState<DraftMetadata[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteDraftId, setDeleteDraftId] = useState<string | null>(null);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);

  const loadDrafts = () => {
    const allDrafts = StorageManager.getAllMetadata();
    setDrafts(allDrafts.sort((a, b) => 
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    ));
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  const handleDelete = (id: string) => {
    setDeleteDraftId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteDraftId) return;
    try {
      StorageManager.deleteDraft(deleteDraftId);
      loadDrafts();
      toast.success('Draft deleted');
      if (currentDraftId === deleteDraftId) {
        onNewDraft();
      }
      setDeleteDialogOpen(false);
      setDeleteDraftId(null);
    } catch (error) {
      toast.error('Failed to delete draft');
    }
  };

  const handleDuplicate = (id: string) => {
    try {
      const duplicate = StorageManager.duplicateDraft(id);
      if (duplicate) {
        loadDrafts();
        toast.success('Draft duplicated');
        onLoadDraft(duplicate.id);
      }
    } catch (error) {
      toast.error('Failed to duplicate draft');
    }
  };

  const handleExportJSON = (id: string) => {
    const draft = StorageManager.getDraft(id);
    if (draft) {
      const json = StorageManager.exportToJSON(draft);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${draft.slug || draft.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Exported as JSON');
    }
  };

  const handleExportMarkdown = (id: string) => {
    const draft = StorageManager.getDraft(id);
    if (draft) {
      const markdown = StorageManager.exportToMarkdown(draft);
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${draft.slug || draft.id}.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Exported as Markdown');
    }
  };

  const handleExportHTML = (id: string) => {
    const draft = StorageManager.getDraft(id);
    if (draft) {
      const html = StorageManager.exportToHTML(draft);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${draft.slug || draft.id}.html`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Exported as HTML');
    }
  };

  const handleClearAll = () => {
    setClearAllDialogOpen(true);
  };

  const confirmClearAll = () => {
    try {
      StorageManager.clearAllDrafts();
      loadDrafts();
      toast.success('All drafts cleared');
      onNewDraft();
      setClearAllDialogOpen(false);
    } catch (error) {
      toast.error('Failed to clear drafts');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">Drafts ({drafts.length})</h2>
        <div className="flex gap-2">
          <Button className="flex-1" onClick={onNewDraft}>
            New Draft
          </Button>
          {drafts.length > 0 && (
            <Button variant="destructive" onClick={handleClearAll}>
              Clear All
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {drafts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No drafts yet</p>
            <p className="text-sm">Create your first article</p>
          </div>
        ) : (
          drafts.map((draft) => (
            <Card
              key={draft.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                currentDraftId === draft.id ? 'border-primary border-2' : ''
              }`}
              onClick={() => onLoadDraft(draft.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base line-clamp-1">
                    {draft.title || 'Untitled'}
                  </CardTitle>
                  {currentDraftId === draft.id && (
                    <Badge variant="default" className="ml-2">Active</Badge>
                  )}
                </div>
                <CardDescription className="flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  {dayjs(draft.lastModified).fromNow()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {draft.preview || 'No content'}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{draft.wordCount} words</span>
                </div>
                <Separator />
                <div className="flex gap-1 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicate(draft.id);
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportJSON(draft.id);
                    }}
                  >
                    <FileJson className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportMarkdown(draft.id);
                    }}
                  >
                    <FileCode className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportHTML(draft.id);
                    }}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(draft.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Draft</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this draft? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear All Confirmation Dialog */}
      <Dialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Drafts</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete all drafts? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearAllDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmClearAll}>
              Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DraftList;

