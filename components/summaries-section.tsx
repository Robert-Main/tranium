"use client";

import { useState, useTransition, useEffect } from "react";
import { deleteSummary, updateSummary } from "@/lib/actions/summaries.action";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, CheckSquare, Square, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ConfirmModal from "@/components/confirm-modal";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface SummaryItemProps {
    id: string;
    title: string | null;
    points: string[];
    created_at: string;
}

interface SummariesSectionProps {
    companionId: string;
    path: string;
    initialSummaries: SummaryItemProps[];
}

export default function SummariesSection({ companionId, path, initialSummaries }: SummariesSectionProps) {
    const [isPending] = useTransition();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [multiSelect, setMultiSelect] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const router = useRouter();

    const canMultiSelect = (initialSummaries?.length || 0) > 1;

    useEffect(() => {
        if (!canMultiSelect && multiSelect) {
            setMultiSelect(false);
            setSelectedIds(new Set());
        }
    }, [canMultiSelect, multiSelect]);

    // Edit modal state
    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState<string>("");
    const [editPointsText, setEditPointsText] = useState<string>("");

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const onDeleteOne = async (id: string) => {
        setDeletingId(id);
        const result = await deleteSummary({ summaryId: id, path });
        if (result?.success) {
            toast.success("Summary deleted");
            router.refresh();
        } else {
            toast.error(result?.error || "Failed to delete summary");
        }
        setDeletingId(null);
    };

    const onDeleteBulk = async () => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) {
            toast.message("No summaries selected", { description: "Select summaries to delete" });
            return;
        }

        setBulkDeleting(true);
        try {
            const { deleteSummariesBulk } = await import("@/lib/actions/summaries.action");
            const result = await deleteSummariesBulk({ summaryIds: ids, path });
            if (result?.success) {
                toast.success("Selected summaries deleted");
                setSelectedIds(new Set());
                setMultiSelect(false);
                router.refresh();
            } else {
                toast.error(result?.error || "Failed to delete selected summaries");
            }
        } finally {
            setBulkDeleting(false);
        }
    };

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Saved Summaries</h3>
                {canMultiSelect && (
                <div className="flex items-center gap-2">
                    <Button
                        variant={multiSelect ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setMultiSelect((v) => !v)}
                    >
                        {multiSelect ? "Cancel" : "Select"}
                    </Button>
                    {multiSelect && (
                        <ConfirmModal
                            title="Delete selected summaries?"
                            description="This action cannot be undone."
                            onConfirm={onDeleteBulk}
                        >
                            <Button variant="destructive" size="sm" disabled={bulkDeleting}>
                                {bulkDeleting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
                                    </>
                                )}
                            </Button>
                        </ConfirmModal>
                    )}
                </div>
                )}
            </div>

            {initialSummaries?.length === 0 ? (
                <div className="p-4 text-sm text-gray-600 border rounded-lg bg-white">No summaries saved yet</div>
            ) : (
                <div className="max-h-[800px] overflow-y-auto pr-2 custom-scrollbar overscroll-contain">
                <ul className="space-y-3">
                    {initialSummaries.map((s) => (
                        <li key={s.id} className="p-4 rounded-lg border bg-white">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        {multiSelect && (
                                            <button
                                                className="text-gray-600"
                                                onClick={() => toggleSelect(s.id)}
                                                aria-label={selectedIds.has(s.id) ? "Unselect" : "Select"}
                                            >
                                                {selectedIds.has(s.id) ? (
                                                    <CheckSquare className="h-5 w-5" />
                                                ) : (
                                                    <Square className="h-5 w-5" />
                                                )}
                                            </button>
                                        )}
                                        <p className="text-sm text-gray-500">
                                            {new Date(s.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    {s.title && <p className="font-medium mb-2">{s.title}</p>}
                                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-800">
                                        {s.points.map((p, idx) => (
                                            <li key={idx}>{p}</li>
                                        ))}
                                    </ul>
                                </div>
                                {!multiSelect && (
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-gray-600 hover:text-gray-800"
                                            onClick={() => {
                                                setEditId(s.id);
                                                setEditTitle(s.title || "");
                                                setEditPointsText((s.points || []).join("\n"));
                                                setEditOpen(true);
                                            }}
                                            aria-label="Edit summary"
                                        >
                                            <Pencil className="h-5 w-5" />
                                        </Button>

                                        <ConfirmModal
                                            title="Delete summary?"
                                            description="This action cannot be undone."
                                            onConfirm={() => onDeleteOne(s.id)}
                                        >
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                disabled={deletingId === s.id}
                                            >
                                                {deletingId === s.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-5 w-5" />
                                                )}
                                            </Button>
                                        </ConfirmModal>
                                    </div>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
                </div>
            )}

            <Dialog open={editOpen} onOpenChange={(o) => { if (!o) { setEditOpen(false); setEditId(null); setEditing(false); }}}>
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle>Edit Summary</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm text-gray-700">Title (optional)</label>
                            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Enter a title" />
                        </div>
                        <div>
                            <label className="text-sm text-gray-700">Points (one per line)</label>
                            <Textarea rows={8} value={editPointsText} onChange={(e) => setEditPointsText(e.target.value)} placeholder="Write each point on a new line" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setEditOpen(false); setEditId(null); }} disabled={editing}>Cancel</Button>
                        <Button
                            onClick={async () => {
                                if (!editId) return;
                                const pts = editPointsText.split(/\r?\n/).map((p) => p.trim()).filter(Boolean);
                                setEditing(true);
                                const res = await updateSummary({ summaryId: editId, title: editTitle.trim() || null, points: pts, path });
                                setEditing(false);
                                if (res?.success) {
                                    toast.success("Summary updated");
                                    setEditOpen(false);
                                    setEditId(null);
                                    router.refresh();
                                } else {
                                    toast.error(res?.error || "Failed to update summary");
                                }
                            }}
                            disabled={editing}
                        >
                            {editing ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
