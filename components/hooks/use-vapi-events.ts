import React, { useEffect } from "react";
import { vapi } from "@/lib/vapi.sdk";
import { addSessionHistory } from "@/lib/actions/companion.action";
import { addNote } from "@/lib/actions/notes.action";
import { toast } from "sonner";
import { extractKeyPoints, normalizePoint } from "@/lib/utils";
import { CallStatus } from "@/lib/call-status";
import type { CallStatusValue } from "@/lib/call-status";

interface UseVapiEventsProps {
    callStatus: CallStatusValue;
    companionId: string;
    autoSaveKeyPoints: boolean;
    pathname: string;
    setCallStatus: (status: CallStatusValue) => void;
    setIsSpeaking: (speaking: boolean) => void;
    setIsMuted: (muted: boolean) => void;
    setMessages: React.Dispatch<React.SetStateAction<SavedMessage[]>>;
    setIsPauseDialogOpen: (open: boolean) => void;
    terminationHandledRef: React.MutableRefObject<boolean>;
    isPausedByUserRef: React.MutableRefObject<boolean>;
    savedKeyPointsRef: React.MutableRefObject<Set<string>>;
    onRefresh: () => void;
    onKeyPointsSaved?: (normalizedPoints: string[]) => void;
}

export const useVapiEvents = ({
    callStatus,
    companionId,
    autoSaveKeyPoints,
    pathname,
    setCallStatus,
    setIsSpeaking,
    setIsMuted,
    setMessages,
    setIsPauseDialogOpen,
    terminationHandledRef,
    isPausedByUserRef,
    savedKeyPointsRef,
    onRefresh,
    onKeyPointsSaved,
}: UseVapiEventsProps) => {
    useEffect(() => {
        const onCallStatus = () => setCallStatus(CallStatus.ACTIVE);

        const onCallEnd = async () => {
            if (terminationHandledRef.current) return;
            terminationHandledRef.current = true;

            if (!isPausedByUserRef.current) {
                setCallStatus(CallStatus.FINISHED);
                setIsMuted(false);
                setIsPauseDialogOpen(false);

                try {
                    const result = await addSessionHistory(companionId);
                    if (result.success) {
                        toast.success("Session saved successfully!");
                    } else {
                        toast.error("Failed to save session history");
                    }
                } catch (error) {
                    console.error("Error ending session:", error);
                }
            }
        };

        const onSpeechStart = () => setIsSpeaking(true);
        const onSpeechEnd = () => setIsSpeaking(false);

        const onMessage = (message: any) => {
            if (message?.type === "transcript" && (message as any).transcriptType === "final") {
                const newMessage = { role: message.role, content: message.transcript };
                setMessages((prevMessages) => [...prevMessages, newMessage]);

                if (autoSaveKeyPoints && message.role === "assistant") {
                    try {
                        const transcript = String(message.transcript || "").trim();
                        if (transcript.length < 50) return;

                        const points = extractKeyPoints(transcript);

                        if (points.length > 0) {

                            const uniqueNew = points.filter((p) => {
                                const norm = normalizePoint(p);
                                return !savedKeyPointsRef.current.has(norm);
                            });

                            if (uniqueNew.length > 0) {
                                uniqueNew.forEach((p) => savedKeyPointsRef.current.add(normalizePoint(p)));

                                (async () => {
                                    const pathToRevalidate = pathname || `/companions/${companionId}`;
                                    const results = await Promise.allSettled(
                                        uniqueNew.map((content) =>
                                            addNote({ companionId, content, path: pathToRevalidate })
                                        )
                                    );

                                    const successCount = results.filter(
                                        (r) => r.status === "fulfilled" && (r.value as any)?.success
                                    ).length;

                                    if (successCount > 0) {
                                        console.log(`Auto-saved ${successCount} key point(s)`);
                                        const normalized = uniqueNew.map((p) => normalizePoint(p));
                                        try { onKeyPointsSaved?.(normalized); } catch (_) {}
                                        onRefresh();
                                    } else {
                                        uniqueNew.forEach((p) => savedKeyPointsRef.current.delete(normalizePoint(p)));
                                    }
                                })();
                            }
                        }
                    } catch (e) {
                        console.warn("Auto-save key points failed:", e);
                    }
                }
            }
        };

        const onError = async (err: any) => {
            try {
                console.error("Error from companion:", err);
                const msg = typeof err === "string" ? err : err?.error?.msg || err?.message || err?.msg || "";
                const type = typeof err === "object" ? err?.error?.type || err?.type : undefined;
                const looksLikeMeetingEnded =
                    /meeting has ended/i.test(String(msg)) || String(type).toLowerCase() === "ejected";

                if (looksLikeMeetingEnded && isPausedByUserRef.current) {
                    console.log("Ignoring meeting end error - user paused session");
                    return;
                }

                if (looksLikeMeetingEnded) {
                    if (terminationHandledRef.current) return;
                    terminationHandledRef.current = true;

                    setCallStatus(CallStatus.FINISHED);
                    setIsMuted(false);
                    setIsPauseDialogOpen(false);

                    toast.info("Meeting has ended");

                    try { vapi.stop(); } catch (_) {}

                    try {
                        const result = await addSessionHistory(companionId);
                        if (result?.success) {
                            toast.success("Session saved successfully!");
                        } else {
                            toast.error("Failed to save session history");
                        }
                    } catch (e) {
                        console.error("Failed to save session history after error:", e);
                    }
                }
            } catch (e) {
                console.error("onError handler failed:", e);
            }
        };

        vapi.on("call-start", onCallStatus);
        vapi.on("call-end", onCallEnd);
        vapi.on("message", onMessage);
        vapi.on("error", onError);
        vapi.on("speech-start", onSpeechStart);
        vapi.on("speech-end", onSpeechEnd);

        return () => {
            vapi.off("call-start", onCallStatus);
            vapi.off("call-end", onCallEnd);
            vapi.off("message", onMessage);
            vapi.off("error", onError);
            vapi.off("speech-start", onSpeechStart);
            vapi.off("speech-end", onSpeechEnd);
        };
    }, [
        callStatus,
        companionId,
        autoSaveKeyPoints,
        pathname,
        setCallStatus,
        setIsSpeaking,
        setIsMuted,
        setMessages,
        setIsPauseDialogOpen,
        terminationHandledRef,
        isPausedByUserRef,
        savedKeyPointsRef,
        onRefresh,
    ]);
};