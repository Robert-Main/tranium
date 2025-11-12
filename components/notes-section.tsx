"use client";

import { useState, useTransition } from "react";
import { listNotesByCompanion, addNote, deleteNote } from "@/lib/actions/notes.action";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Loader2 } from "lucide-react";
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
  const router = useRouter();

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      content: "",
    },
  });

  const onSubmit = async (data: NoteFormValues) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("companionId", companionId);
      if (sessionId) formData.append("sessionId", sessionId);
      formData.append("path", path);
      formData.append("content", data.content);

      const result = await addNote(formData);

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
    const formData = new FormData();
    formData.append("noteId", noteId);
    formData.append("path", path);

    const result = await deleteNote(formData);

    if (result?.success) {
      toast.success("Note deleted");
      router.refresh();
    } else {
      toast.error("Failed to delete note");
    }
    setDeletingId(null);
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
                  <div className="flex-1 min-w-0">
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
                  </div>
                  <Button
                    onClick={() => handleDelete(note.id)}
                    variant="ghost"
                    size="icon"
                    disabled={deletingId === note.id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete note"
                  >
                    {deletingId === note.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
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