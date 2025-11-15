"use client";

import { useState, useTransition } from "react";
import { listNotesByCompanion, addNote, deleteNote, updateNote, deleteNotesBulk } from "@/lib/actions/notes.action";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Loader2, Pencil, X, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ConfirmModal from "@/components/confirm-modal";

const noteFormSchema = z.object({
  content: z
    .string()
    .min(3, "Note must be at least 3 characters long")
    .max(1000, "Note must be less than 1000 characters"),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

interface Note {
  id: string;
  content: string;
  created_at: string;
}

interface NotesSectionProps {
  companionId: string;
  sessionId?: string;
  path: string;
  initialNotes: Note[];
}

export default function NotesSection({
  companionId,
  sessionId,
  path,
  initialNotes
}: NotesSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");
  const [savingId, setSavingId] = useState<string | null>(null);
  // Multi-select state
  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const router = useRouter();

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      content: "",
    },
  });

  const onSubmit = async (data: NoteFormValues) => {
    startTransition(async () => {
      const result = await addNote({
        companionId,
        sessionId,
        path,
        content: data.content,
      });

      if (result?.success) {
        form.reset();
        toast.success("Note saved successfully!");
        router.refresh();
      } else {
        toast.error("Failed to save note");
      }
    });
  };

  const handleDelete = async (noteId: string) => {
    setDeletingId(noteId);

    const result = await deleteNote({ noteId, path });

    if (result?.success) {
      toast.success("Note deleted");
      router.refresh();
    } else {
      toast.error("Failed to delete note");
    }
    setDeletingId(null);
  };

  const handleStartEdit = (noteId: string, currentContent: string) => {
    setEditingId(noteId);
    setEditContent(currentContent);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
    setSavingId(null);
  };

  const handleSaveEdit = async (noteId: string) => {
    const trimmed = editContent.trim();
    if (trimmed.length < 3) {
      toast.error("Note must be at least 3 characters long");
      return;
    }
    if (trimmed.length > 1000) {
      toast.error("Note must be less than 1000 characters");
      return;
    }
    setSavingId(noteId);
    const result = await updateNote({ noteId, content: trimmed, path });
    if (result?.success) {
      toast.success("Note updated");
      handleCancelEdit();
      router.refresh();
    } else {
      toast.error(result?.error || "Failed to update note");
      setSavingId(null);
    }
  };

  // Multi-select helpers
  const toggleMultiSelect = () => {
    setMultiSelect((prev) => {
      const next = !prev;
      if (!next) setSelectedIds(new Set());
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const allIds = initialNotes?.map((n) => n.id) || [];
    setSelectedIds(new Set(allIds));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      toast.message("No notes selected", { description: "Select notes to delete" });
      return;
    }
    try {
      setBulkDeleting(true);
      const result = await deleteNotesBulk({ noteIds: Array.from(selectedIds), path });
      if (result?.success) {
        toast.success(`${selectedIds.size} note${selectedIds.size > 1 ? 's' : ''} deleted`);
        clearSelection();
        setMultiSelect(false);
        router.refresh();
      } else {
        toast.error(result?.error || "Failed to delete selected notes");
      }
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Note Form */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 border border-gray-200 rounded-2xl p-6 shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold text-gray-900">
                    Add a note
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write your thoughts, key takeaways, or questions..."
                      className="min-h-[120px] resize-none bg-white border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isPending}
                className="bg-gray-900 hover:bg-gray-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Save Note
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Notes List */}
      <div className="space-y-3">
        {/* Bulk actions toolbar */}
        {initialNotes?.length > 0 && (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Button variant={multiSelect ? "secondary" : "outline"} size="sm" onClick={toggleMultiSelect}>
                {multiSelect ? "Done" : "Multi-select"}
              </Button>
              {multiSelect && (
                <>
                  <Button variant="outline" size="sm" onClick={selectAll}>Select all</Button>
                  <Button variant="ghost" size="sm" onClick={clearSelection}>Clear</Button>
                </>
              )}
            </div>
            {multiSelect && (
              <ConfirmModal
                trigger={
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={bulkDeleting || selectedIds.size === 0}
                    className="ml-auto"
                  >
                    {bulkDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete selected ({selectedIds.size})
                      </>
                    )}
                  </Button>
                }
                title="Delete selected notes?"
                description="This action cannot be undone and will permanently delete the selected notes."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleBulkDelete}
              />
            )}
          </div>
        )}

        {initialNotes?.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white/50 border border-dashed border-gray-300 rounded-2xl">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 font-medium">No notes yet</p>
            <p className="text-xs text-gray-500 mt-1">
              Start capturing your thoughts above
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {initialNotes?.map((note) => (
              <div
                key={note.id}
                className="group bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-300"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Checkbox for multi-select */}
                  {multiSelect && (
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(note.id)}
                        onChange={() => toggleSelect(note.id)}
                        className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
                        aria-label="Select note"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {editingId === note.id ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[120px] resize-none bg-white border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 rounded-xl"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => handleCancelEdit()}
                            variant="ghost"
                            className="hover:bg-gray-100"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleSaveEdit(note.id)}
                            disabled={savingId === note.id}
                            className="bg-gray-900 hover:bg-gray-800 text-white"
                          >
                            {savingId === note.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Save
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                          {note.content}
                        </p>
                        <p className="text-xs text-gray-500 mt-3 font-medium">
                          {new Date(note.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {editingId === note.id || multiSelect ? null : (
                      <Button
                        onClick={() => handleStartEdit(note.id, note.content)}
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-100"
                        aria-label="Edit note"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {multiSelect ? null : (
                      <ConfirmModal
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={deletingId === note.id || editingId === note.id}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-50 hover:text-red-600"
                            aria-label="Delete note"
                          >
                            {deletingId === note.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        }
                        title="Delete this note?"
                        description="This action cannot be undone and will permanently delete the note."
                        confirmText="Delete"
                        cancelText="Cancel"
                        onConfirm={() => handleDelete(note.id)}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
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