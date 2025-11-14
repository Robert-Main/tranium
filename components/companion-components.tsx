"use client";

import { cn, configureAssistant, getSubjectColor } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import soundwaves from "@/constants/soundwaves.json";
import { Button } from "./ui/button";
import { addSessionHistory } from "@/lib/actions/companion.action";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";
import { MathWorkingArea } from "./math-working-area";
import { Pause, Play, StickyNote } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "./ui/textarea";
import { addNote } from "@/lib/actions/notes.action";
import { addSummary } from "@/lib/actions/summaries.action";

interface CompanionComponentsProps {
    companionId: string;
    subject: string;
    topic: string;
    style: string;
    name: string;
    userName: string;
    userImage: string;
    voice: string;
}

enum CallStatus {
    INACTIVE = "INACTIVE",
    CONNECTING = "CONNECTING",
    ACTIVE = "ACTIVE",
    PAUSED = "PAUSED",
    FINISHED = "FINISHED",
}

const CompanionComponents = ({
    companionId,
    subject,
    topic,
    style,
    name,
    userName,
    userImage,
    voice,
}: CompanionComponentsProps) => {
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [messages, setMessages] = useState<SavedMessage[]>([]);
    const [isPauseDialogOpen, setIsPauseDialogOpen] = useState(false);
    const [quickNote, setQuickNote] = useState("");
    const [savedNotes, setSavedNotes] = useState<string[]>([]);
    const [autoSaveKeyPoints, setAutoSaveKeyPoints] = useState(true);
    const savedKeyPointsRef = React.useRef<Set<string>>(new Set());
    const terminationHandledRef = React.useRef(false);
    const isPausedByUserRef = React.useRef(false);
    const [showSummary, setShowSummary] = useState(false);
    const [generatingSummary, setGeneratingSummary] = useState(false);
    const [summaryPoints, setSummaryPoints] = useState<string[]>([]);

    const router = useRouter();
    const pathname = usePathname();
    const LottieRef = React.useRef<LottieRefCurrentProps>(null);
    const isMathSubject = subject.toLowerCase() === "maths" || subject.toLowerCase() === "math";

    // Normalize text for comparison
    const normalizePoint = (s: string) =>
        s.toLowerCase()
            .replace(/\s+/g, " ")
            .replace(/[\s\-*_•.]+$/g, "")
            .trim();

    // Improved key points extraction with better sentence completion
    const extractKeyPoints = (text: string): string[] => {
        if (!text || text.trim().length < 30) return [];

        const points: string[] = [];

        // Split into complete sentences (handling periods, exclamation, question marks)
        const sentences = text.split(/(?<=[.!?])\s+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        // First pass: Look for bullet points or numbered lists
        const lines = text.split(/\n+/);
        for (const raw of lines) {
            const line = raw.trim();
            if (!line || line.length < 40) continue; // Minimum 40 chars for bullets

            // Match bullet points or numbered lists
            const bulletMatch = line.match(/^\s*(?:[-*•]|\d+[\.)\-:])\s+(.+)$/);
            if (bulletMatch) {
                const content = bulletMatch[1].trim();
                // Ensure it's a complete thought (ends with punctuation or is long enough)
                if (content.length >= 40 && (content.length >= 60 || /[.!?]$/.test(content))) {
                    points.push(content.endsWith('.') || content.endsWith('!') || content.endsWith('?')
                        ? content
                        : content + '.');
                }
            }
        }

        // Second pass: Look for sentences with key indicators
        const keywordPattern = /\b(key\s*point|important|remember|note\s*that|takeaway|summary|crucial|essential|main\s*idea|means|refers\s*to|defined\s*as|for\s*example)\b/i;

        for (let i = 0; i < sentences.length; i++) {
            const sent = sentences[i];

            // Skip if too short or too long
            if (sent.length < 40 || sent.length > 350) continue;

            // Check if it has informative keywords
            if (keywordPattern.test(sent)) {
                // Try to get the complete thought (might span multiple sentences)
                let completePoint = sent;

                // If next sentence seems to continue the thought and combined length is reasonable
                if (i + 1 < sentences.length &&
                    !sent.match(/[.!?]$/) &&
                    (completePoint.length + sentences[i + 1].length) < 350) {
                    completePoint += ' ' + sentences[i + 1];
                    i++; // Skip next sentence since we included it
                }

                points.push(completePoint);
            }
        }

        // Third pass: If we have very few points, look for complete, informative sentences
        if (points.length < 2) {
            for (const sent of sentences) {
                // Must be complete sentence (ends with punctuation) and reasonable length
                if (sent.length >= 50 &&
                    sent.length <= 300 &&
                    /[.!?]$/.test(sent)) {

                    // Check if it's informative (not just transitional phrases)
                    const hasSubstance = /\b(is|are|means|refers|defined|causes|results|affects|includes|such as|because|when|if|can|will|shows|indicates)\b/i.test(sent);
                    const notTransitional = !/^(so|and|but|however|therefore|thus|first|second|next|finally|in conclusion)\b/i.test(sent);

                    if (hasSubstance && notTransitional) {
                        points.push(sent);
                    }
                }
            }
        }

        // Deduplicate and limit
        const seen = new Set<string>();
        const cleaned: string[] = [];

        for (const p of points) {
            const norm = normalizePoint(p);
            // Ensure minimum viable length and not duplicate
            if (!seen.has(norm) && p.length >= 40 && p.length <= 350) {
                seen.add(norm);
                cleaned.push(p);
            }
            if (cleaned.length >= 4) break; // Max 4 per message (increased from 3)
        }

        return cleaned;
    };

    useEffect(() => {
        if (LottieRef) {
            if (isSpeaking) {
                LottieRef.current?.play();
            } else {
                LottieRef.current?.stop();
            }
        }
    }, [isSpeaking]);

    useEffect(() => {
        const onCallStatus = () => setCallStatus(CallStatus.ACTIVE);

        const onCallEnd = async () => {
            if (terminationHandledRef.current) return;
            terminationHandledRef.current = true;

            // Only save session if it wasn't a user-initiated pause causing the end
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

                // Auto-extract and save key points from assistant messages only
                if (autoSaveKeyPoints && message.role === "assistant") {
                    try {
                        const transcript = String(message.transcript || "").trim();

                        // Only process if it's a substantial message
                        if (transcript.length < 50) return;

                        const points = extractKeyPoints(transcript);

                        if (points.length > 0) {
                            console.log("Extracted key points:", points);

                            const uniqueNew = points.filter((p) => {
                                const norm = normalizePoint(p);
                                return !savedKeyPointsRef.current.has(norm);
                            });

                            if (uniqueNew.length > 0) {
                                // Mark as seen immediately
                                uniqueNew.forEach((p) => savedKeyPointsRef.current.add(normalizePoint(p)));

                                // Save asynchronously
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
                                        router.refresh();
                                    } else {
                                        // Roll back on complete failure
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

                // Ignore meeting end errors if we intentionally paused
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
    }, [callStatus, companionId, autoSaveKeyPoints, pathname, router]);

    const handleToggleMic = async () => {
        const currentMuted = vapi.isMuted();
        vapi.setMuted(!currentMuted);
        setIsMuted(!currentMuted);
    };

    const handlePauseSession = () => {
        // Set flag to prevent meeting end error handling
        isPausedByUserRef.current = true;

        // Mute the microphone
        vapi.setMuted(true);
        setIsMuted(true);
        setCallStatus(CallStatus.PAUSED);
        setIsPauseDialogOpen(true);
    };

    const handleResumeSession = async () => {
        // Clear the pause flag
        isPausedByUserRef.current = false;

        setIsPauseDialogOpen(false);
        setCallStatus(CallStatus.ACTIVE);

        // Unmute the microphone
        vapi.setMuted(false);
        setIsMuted(false);

        const trimmed = quickNote.trim();
        if (trimmed) {
            try {
                const res = await addNote({ companionId, content: trimmed, path: pathname || "/companions" });
                if (res?.success) {
                    setSavedNotes((prev) => [...prev, trimmed]);
                    setQuickNote("");
                    toast.success("Note saved!");
                    router.refresh();
                } else {
                    toast.error(res?.error || "Failed to save note");
                }
            } catch (e) {
                toast.error("Failed to save note");
            }
        }
    };

    const handleSaveQuickNote = async () => {
        const trimmed = quickNote.trim();
        if (trimmed) {
            try {
                const res = await addNote({ companionId, content: trimmed, path: pathname || "/companions" });
                if (res?.success) {
                    setSavedNotes((prev) => [...prev, trimmed]);
                    setQuickNote("");
                    toast.success("Note saved! You can continue adding more.");
                    router.refresh();
                } else {
                    toast.error(res?.error || "Failed to save note");
                }
            } catch (e) {
                toast.error("Failed to save note");
            }
        }
    };

    const handleConnect = async () => {
        setCallStatus(CallStatus.CONNECTING);
        terminationHandledRef.current = false;
        isPausedByUserRef.current = false;
        savedKeyPointsRef.current.clear();

        try {
            const assistanceOverride = {
                variableValues: {
                    topic,
                    subject,
                    style,
                },
                clientMessages: ["transcript"],
                serverMessages: ["transcript"],
            };
            // @ts-expect-error
            await vapi.start(configureAssistant(voice, style, isMathSubject), assistanceOverride);
        } catch (error) {
            console.error("Error connecting to companion:", error);
            setCallStatus(CallStatus.INACTIVE);
        }
    };

    const handleDisconnect = async () => {
        isPausedByUserRef.current = false;
        setCallStatus(CallStatus.FINISHED);

        try {
            vapi.stop();
            router.push("/companions");
        } catch (error) {
            console.error("Error disconnecting from companion:", error);
        }
    };

    const generateSmartSummary = async () => {
    if (messages.length === 0) {
        toast.error("No conversation to summarize yet!");
        return;
    }

    setGeneratingSummary(true);
    setShowSummary(true);

    try {
        // Get all assistant messages
        const assistantMessages = messages
            .filter((m) => m.role === "assistant")
            .map((m) => m.content)
            .join(" ");

        if (assistantMessages.length < 100) {
            toast.error("Not enough content to summarize yet!");
            setGeneratingSummary(false);
            return;
        }

        // Call our API route instead of Anthropic directly
        const response = await fetch("/api/generate-summary", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                topic,
                subject,
                transcript: assistantMessages,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to generate summary");
        }

        const data = await response.json();


        if (Array.isArray(data.summaries) && data.summaries.length > 0) {
            setSummaryPoints(data.summaries);
            // Save to DB
            try {
                const result = await addSummary({
                    companionId,
                    points: data.summaries,
                    title: topic,
                    path: pathname || `/companions/${companionId}`,
                });
                if (result?.success) {
                    toast.success("Summary generated and saved!");
                } else {
                    toast.message("Summary generated", { description: "Could not save automatically" });
                }
            } catch (e) {
                console.error("Failed to save summary:", e);
                toast.message("Summary generated", { description: "Save failed" });
            }
            router.refresh();
        } else {
            throw new Error("Invalid summary format");
        }
    } catch (error) {
        console.error("Error generating summary:", error);
        toast.error(error instanceof Error ? error.message : "Failed to generate summary");
        setSummaryPoints([]);
    } finally {
        setGeneratingSummary(false);
    }
};
    return (
        <>
            <section className="flex flex-col h-full">
                <section className="flex gap-8 max-sm:flex-col">
                    <div className="border-2 border-orange-500 w-2/3 max-sm:w-full flex flex-col gap-4 justify-center items-center rounded-lg p-6 bg-gradient-to-br from-orange-50 to-white">
                        <div
                            className="w-full h-[300px] max-sm:h-[250px] flex items-center justify-center rounded-lg relative overflow-hidden shadow-inner"
                            style={{
                                backgroundColor: getSubjectColor(subject),
                            }}
                        >
                            {/* Paused Overlay */}
                            {callStatus === CallStatus.PAUSED && (
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-20 flex items-center justify-center">
                                    <div className="text-center text-white space-y-2">
                                        <Pause className="h-16 w-16 mx-auto animate-pulse" />
                                        <p className="text-xl font-bold">Session Paused</p>
                                        <p className="text-sm opacity-90">Take your time with notes</p>
                                    </div>
                                </div>
                            )}

                            <div
                                className={cn(
                                    "absolute transition-opacity duration-1000",
                                    callStatus === CallStatus.FINISHED || callStatus === CallStatus.INACTIVE
                                        ? "opacity-100"
                                        : "opacity-0",
                                    callStatus === CallStatus.CONNECTING && "opacity-100 animate-pulse"
                                )}
                            >
                                <Image
                                    src={`/icons/${subject}.svg`}
                                    alt={subject}
                                    width={150}
                                    height={150}
                                    className="max-sm:w-20 max-sm:h-20"
                                />
                            </div>

                            {/* For Math: Show working area when active */}
                            {isMathSubject && callStatus === CallStatus.ACTIVE && (
                                <div className="absolute inset-0 opacity-100 transition-opacity duration-500">
                                    <div className="w-full h-full bg-gradient-to-br from-blue-50 via-white to-orange-50">
                                        <MathWorkingArea messages={messages} assistantName={name.split(" ")[0]} />
                                    </div>
                                </div>
                            )}

                            {/* For Non-Math: Show Lottie animation when active */}
                            {!isMathSubject && (
                                <div
                                    className={cn(
                                        "absolute transition-opacity duration-300",
                                        callStatus === CallStatus.ACTIVE ? "opacity-100" : "opacity-0"
                                    )}
                                >
                                    <Lottie
                                        lottieRef={LottieRef}
                                        animationData={soundwaves}
                                        autoPlay={false}
                                        className="size-[300px] max-sm:size-[150px]"
                                    />
                                </div>
                            )}
                        </div>

                        <p className="font-bold text-2xl text-gray-900">{name}</p>
                    </div>

                    <div className="flex flex-col gap-4 w-1/3 max-sm:w-full">
                        <div className="border-2 border-black flex flex-col gap-4 items-center rounded-lg py-8 px-4 max-sm:hidden bg-white shadow-sm">
                            <Image
                                src={userImage}
                                alt="user"
                                width={100}
                                height={100}
                                className="rounded-lg border-2 border-gray-100"
                            />
                            <p className="text-xl font-bold">{userName}</p>
                        </div>

                        <button
                            className={cn(
                                "border-2 rounded-lg flex flex-col gap-2 items-center py-8 max-sm:py-4 cursor-pointer w-full transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed",
                                isMuted ? "bg-red-50 border-red-500 text-red-700" : "bg-white border-gray-300 text-gray-700"
                            )}
                            onClick={handleToggleMic}
                            disabled={callStatus !== CallStatus.ACTIVE && callStatus !== CallStatus.PAUSED}
                        >
                            <Image
                                src={isMuted ? "/icons/mic-off.svg" : "/icons/mic-on.svg"}
                                alt="mic"
                                width={32}
                                height={32}
                            />
                            <p className="max-sm:hidden font-medium text-sm">{isMuted ? "Unmute Mic" : "Mute Mic"}</p>
                        </button>

                        {/* Pause/Resume Button */}
                        {(callStatus === CallStatus.ACTIVE || callStatus === CallStatus.PAUSED) && (
                            <button
                                className={cn(
                                    "border-2 rounded-lg flex flex-col gap-2 items-center py-8 max-sm:py-4 cursor-pointer w-full transition-all hover:shadow-md",
                                    callStatus === CallStatus.PAUSED
                                        ? "bg-green-50 border-green-500 text-green-700"
                                        : "bg-blue-50 border-blue-500 text-blue-700"
                                )}
                                onClick={callStatus === CallStatus.PAUSED ? handleResumeSession : handlePauseSession}
                            >
                                {callStatus === CallStatus.PAUSED ? (
                                    <>
                                        <Play className="h-8 w-8" />
                                        <p className="max-sm:hidden font-medium text-sm">Resume</p>
                                    </>
                                ) : (
                                    <>
                                        <StickyNote className="h-8 w-8" />
                                        <p className="max-sm:hidden font-medium text-sm">Pause for Notes</p>
                                    </>
                                )}
                            </button>
                        )}

                        <Button
                            className={cn(
                                "rounded-lg cursor-pointer w-full transition-colors text-white h-14 font-bold text-base shadow-md hover:shadow-lg",
                                callStatus === CallStatus.ACTIVE || callStatus === CallStatus.PAUSED
                                    ? "bg-red-600 hover:bg-red-700"
                                    : "bg-primary hover:bg-primary/90",
                                callStatus === CallStatus.CONNECTING && "animate-pulse"
                            )}
                            onClick={
                                callStatus === CallStatus.ACTIVE || callStatus === CallStatus.PAUSED
                                    ? handleDisconnect
                                    : handleConnect
                            }
                            disabled={callStatus === CallStatus.CONNECTING}
                        >
                            {callStatus === CallStatus.ACTIVE || callStatus === CallStatus.PAUSED
                                ? "End Session"
                                : callStatus === CallStatus.CONNECTING
                                ? "Connecting..."
                                : "Start Session"}
                        </Button>

                        {/* Smart Summary Button */}
                        {(callStatus === CallStatus.ACTIVE || callStatus === CallStatus.FINISHED) && messages.length > 0 && (
                            <button
                                className="border-2 border-purple-500 bg-purple-50 hover:bg-purple-100 rounded-lg flex flex-col gap-2 items-center py-4 cursor-pointer w-full transition-all hover:shadow-md disabled:opacity-50"
                                onClick={generateSmartSummary}
                                disabled={generatingSummary}
                            >
                                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="max-sm:hidden font-medium text-sm text-purple-700">
                                    {generatingSummary ? "Generating..." : "Smart Summary"}
                                </p>
                            </button>
                        )}
                    </div>
                </section>

                {!isMathSubject && (
                    <section className="relative flex flex-col gap-4 w-full items-center pt-10 flex-grow overflow-hidden">
                        <h3 className="font-bold text-xl text-gray-900">Live Transcript</h3>
                        <div className="overflow-y-auto w-full flex flex-col gap-4 max-sm:gap-2 pr-2 h-full text-xl no-scrollbar">
                            {messages.length === 0 ? (
                                <p className="text-gray-400 text-center py-8">Transcript will appear here...</p>
                            ) : (
                                messages.map((message, index) => {
                                    const isUser = message.role === "user";
                                    return (
                                        <div
                                            key={index}
                                            className={cn(
                                                "p-4 rounded-2xl max-sm:text-sm",
                                                isUser
                                                    ? "bg-gray-100 border-2 border-gray-200"
                                                    : "bg-blue-50 border-2 border-blue-200"
                                            )}
                                        >
                                            <p className="font-bold text-sm mb-1 text-gray-700">
                                                {isUser ? userName : name.split(" ")[0]}:
                                            </p>
                                            <p
                                                className={cn(
                                                    "leading-relaxed",
                                                    isUser ? "text-gray-900" : "text-blue-900 font-medium"
                                                )}
                                            >
                                                {message.content}
                                            </p>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 max-sm:h-20 bg-gradient-to-t from-background via-background/90 to-transparent z-10" />
                    </section>
                )}
            </section>

            {/* Pause Dialog for Quick Notes */}
            <Dialog open={isPauseDialogOpen} onOpenChange={(open) => {
                if (!open && callStatus === CallStatus.PAUSED) {
                    handleResumeSession();
                }
            }}>
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
                                onChange={(e) => setQuickNote(e.target.value)}
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
                                    onClick={handleSaveQuickNote}
                                    className="gap-2"
                                >
                                    <StickyNote className="h-4 w-4" />
                                    Save & Add Another
                                </Button>
                            )}
                            <Button onClick={handleResumeSession} className="gap-2">
                                <Play className="h-4 w-4" />
                                Resume Session
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Smart Summary Dialog */}
            <Dialog open={showSummary} onOpenChange={setShowSummary}>
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
                                onClick={() => setShowSummary(false)}
                            >
                                Close
                            </Button>
                            {summaryPoints.length > 0 && !generatingSummary && (
                                <Button
                                    onClick={generateSmartSummary}
                                    className="bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                    Regenerate
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default CompanionComponents;