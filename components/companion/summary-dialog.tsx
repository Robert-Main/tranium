import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SummaryDialogProps {
    open: boolean;
    topic: string;
    generatingSummary: boolean;
    summaryPoints: string[];
    onOpenChange: (open: boolean) => void;
    onRegenerate: () => void;
}

export const SummaryDialog = ({
    open,
    topic,
    generatingSummary,
    summaryPoints,
    onOpenChange,
    onRegenerate,
}: SummaryDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] bg-white max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Smart Summary
                    </DialogTitle>
                    <DialogDescription>
                        AI-generated summary of your lesson on "{topic}"
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {generatingSummary ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                            <p className="text-gray-600 animate-pulse">Generating your smart summary...</p>
                        </div>
                    ) : summaryPoints.length > 0 ? (
                        <>
                            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                                <h3 className="font-bold text-lg text-purple-900 mb-2">Key Takeaways</h3>
                                <p className="text-sm text-purple-700">
                                    {summaryPoints.length} main points from this lesson
                                </p>
                            </div>

                            <div className="space-y-3">
                                {summaryPoints.map((point, index) => (
                                    <div
                                        key={index}
                                        className="flex gap-3 p-4 bg-gradient-to-r from-purple-50 to-white border-l-4 border-purple-500 rounded-lg hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <p className="text-gray-800 leading-relaxed pt-1">{point}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                                <p className="text-sm text-blue-800">
                                    💡 <strong>Tip:</strong> These summaries are condensed versions of the detailed notes saved automatically during your lesson.
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p>No summary available yet.</p>
                        </div>
                    )}

                    <div className="flex gap-3 justify-end pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Close
                        </Button>
                        {summaryPoints.length > 0 && !generatingSummary && (
                            <Button
                                onClick={onRegenerate}
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                Regenerate
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
