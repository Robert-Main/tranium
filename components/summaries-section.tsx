"use client";

import { useState, useEffect } from "react";
import { deleteSummary, updateSummary } from "@/lib/actions/summaries.action";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Pencil, FileText, Calendar } from "lucide-react";
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

    const selectAll = () => {
        const allIds = initialSummaries?.map((s) => s.id) || [];
        setSelectedIds(new Set(allIds));
    };

    const clearSelection = () => setSelectedIds(new Set());

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
                toast.success(`${ids.length} summar${ids.length > 1 ? 'ies' : 'y'} deleted`);
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
            {canMultiSelect && (
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <Button
                            variant={multiSelect ? "default" : "outline"}
                            size="sm"
                            onClick={() => setMultiSelect((v) => !v)}
                            className={multiSelect ? "bg-slate-900 hover:bg-slate-800" : ""}
                        >
                            {multiSelect ? "Done" : "Select"}
                        </Button>
                        {multiSelect && (
                            <>
                                <Button variant="ghost" size="sm" onClick={selectAll} className="text-slate-600">
                                    Select all
                                </Button>
                                <Button variant="ghost" size="sm" onClick={clearSelection} className="text-slate-600">
                                    Clear
                                </Button>
                            </>
                        )}
                    </div>
                    {multiSelect && selectedIds.size > 0 && (
                        <ConfirmModal
                            title="Delete selected summaries?"
                            description="This action cannot be undone."
                            onConfirm={onDeleteBulk}
                        >
                            <Button
                                variant="destructive"
                                size="sm"
                                disabled={bulkDeleting}
                                className="rounded-xl"
                            >
                                {bulkDeleting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete ({selectedIds.size})
                                    </>
                                )}
                            </Button>
                        </ConfirmModal>
                    )}
                </div>
            )}

            {initialSummaries?.length === 0 ? (
                <div className="text-center py-16 px-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white border border-slate-200 mb-4 shadow-sm">
                        <FileText className="h-7 w-7 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-900 mb-1">No summaries yet</p>
                    <p className="text-xs text-slate-500">
                        Summaries will appear here once generated
                    </p>
                </div>
            ) : (
                <div className="max-h-[800px] overflow-y-auto pr-1 custom-scrollbar overscroll-contain">
                    <ul className="space-y-3">
                        {initialSummaries.map((s) => (
                            <li
                                key={s.id}
                                className={`group relative bg-white border rounded-xl p-4 transition-all duration-200 ${
                                    multiSelect && selectedIds.has(s.id)
                                        ? 'border-slate-900 shadow-md bg-slate-50'
                                        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    {multiSelect && (
                                        <div className="pt-0.5">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(s.id)}
                                                onChange={() => toggleSelect(s.id)}
                                                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400 cursor-pointer"
                                                aria-label={selectedIds.has(s.id) ? "Unselect" : "Select"}
                                            />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                            <p className="text-xs text-slate-500 font-medium">
                                                {new Date(s.created_at).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </p>
                                        </div>

                                        {s.title && (
                                            <h4 className="font-semibold text-slate-900 mb-3 text-sm">
                                                {s.title}
                                            </h4>
                                        )}

                                        <ul className="space-y-1.5">
                                            {s.points.map((p, idx) => (
                                                <li
                                                    key={idx}
                                                    className="flex items-start gap-2 text-sm text-slate-700"
                                                >
                                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                                                    <span className="flex-1">{p}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {!multiSelect && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                                                onClick={() => {
                                                    setEditId(s.id);
                                                    setEditTitle(s.title || "");
                                                    setEditPointsText((s.points || []).join("\n"));
                                                    setEditOpen(true);
                                                }}
                                                aria-label="Edit summary"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>

                                            <ConfirmModal
                                                title="Delete summary?"
                                                description="This action cannot be undone."
                                                onConfirm={() => onDeleteOne(s.id)}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                                    disabled={deletingId === s.id}
                                                >
                                                    {deletingId === s.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
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

            <Dialog open={editOpen} onOpenChange={(o) => {
                if (!o) {
                    setEditOpen(false);
                    setEditId(null);
                    setEditing(false);
                }
            }}>
                <DialogContent className="bg-white rounded-2xl max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-slate-900">Edit Summary</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-2 block">
                                Title (optional)
                            </label>
                            <Input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                placeholder="Enter a title"
                                className="bg-slate-50 border-slate-200 focus:border-slate-400 rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-2 block">
                                Points (one per line)
                            </label>
                            <Textarea
                                rows={8}
                                value={editPointsText}
                                onChange={(e) => setEditPointsText(e.target.value)}
                                placeholder="Write each point on a new line"
                                className="bg-slate-50 border-slate-200 focus:border-slate-400 rounded-xl resize-none"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setEditOpen(false);
                                setEditId(null);
                            }}
                            disabled={editing}
                            className="rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={async () => {
                                if (!editId) return;
                                const pts = editPointsText.split(/\r?\n/).map((p) => p.trim()).filter(Boolean);
                                setEditing(true);
                                const res = await updateSummary({
                                    summaryId: editId,
                                    title: editTitle.trim() || null,
                                    points: pts,
                                    path
                                });
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
                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
                        >
                            {editing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
        </div>
    );
}