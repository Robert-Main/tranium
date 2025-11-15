import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Play, StickyNote } from "lucide-react";
import { CallStatus } from "@/lib/call-status";
import type { CallStatusValue } from "@/lib/call-status";

interface PauseDialogProps {
    open: boolean;
    callStatus: CallStatusValue;
    quickNote: string;
    savedNotes: string[];
    onOpenChange: (open: boolean) => void;
    onQuickNoteChange: (value: string) => void;
    onSaveQuickNote: () => void;
    onResumeSession: () => void;
}

export const PauseDialog = ({
    open,
    callStatus,
    quickNote,
    savedNotes,
    onOpenChange,
    onQuickNoteChange,
    onSaveQuickNote,
    onResumeSession,
}: PauseDialogProps) => {
    return (
        <Dialog
            open={open}
            onOpenChange={(open) => {
                if (!open && callStatus === CallStatus.PAUSED) {
                    onResumeSession();
                }
            }}
        >
            <DialogContent className="sm:max-w-[600px] bg-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <StickyNote className="h-5 w-5" />
                        Session Paused - Take Notes
                    </DialogTitle>
                    <DialogDescription>
                        Write down your thoughts, questions, or key points. Click "Resume Session" when ready to continue.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label htmlFor="quick-note" className="text-sm font-medium">
                            Quick Note
                        </label>
                        <Textarea
                            id="quick-note"
                            placeholder="Write your note here..."
                            value={quickNote}
                            onChange={(e) => onQuickNoteChange(e.target.value)}
                            className="min-h-[150px] resize-none"
                            autoFocus
                        />
                    </div>

                    {savedNotes.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">
                                Notes from this pause ({savedNotes.length}):
                            </p>
                            <div className="max-h-[150px] overflow-y-auto space-y-2 p-3 bg-gray-50 rounded-lg">
                                {savedNotes.map((note, index) => (
                                    <div key={index} className="text-sm p-2 bg-white rounded border border-gray-200">
                                        {note}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 justify-end">
                        {quickNote.trim() && (
                            <Button
                                variant="outline"
                                onClick={onSaveQuickNote}
                                className="gap-2"
                            >
                                <StickyNote className="h-4 w-4" />
                                Save & Add Another
                            </Button>
                        )}
                        <Button onClick={onResumeSession} className="gap-2">
                            <Play className="h-4 w-4" />
                            Resume Session
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
