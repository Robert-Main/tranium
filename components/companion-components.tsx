"use client";

import { configureAssistant, normalizePoint } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import React, { useEffect, useState } from "react";
import { LottieRefCurrentProps } from "lottie-react";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";
import { addNote } from "@/lib/actions/notes.action";
import { addSummary } from "@/lib/actions/summaries.action";
import { CompanionAvatar } from "@/components/companion/companion-avatar";
import { CompanionControls } from "@/components/companion/companion-controls";
import { LiveTranscript } from "@/components/companion/live-transcript";
import { PauseDialog } from "@/components/companion/pause-dialog";
import { SummaryDialog } from "@/components/companion/summary-dialog";
import { useVapiEvents } from "./hooks/use-vapi-events";
import { CallStatus } from "@/lib/call-status";
import type { CallStatusValue } from "@/lib/call-status";

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
    const [callStatus, setCallStatus] = useState<CallStatusValue>(CallStatus.INACTIVE);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [messages, setMessages] = useState<SavedMessage[]>([]);
    const [isPauseDialogOpen, setIsPauseDialogOpen] = useState(false);
    const [quickNote, setQuickNote] = useState("");
    const [savedNotes, setSavedNotes] = useState<string[]>([]);
    const [autoSaveKeyPoints, setAutoSaveKeyPoints] = useState(true);
    const savedKeyPointsRef = React.useRef<Set<string>>(new Set());
    const savedSummariesRef = React.useRef<Set<string>>(new Set());
    const terminationHandledRef = React.useRef(false);
    const isPausedByUserRef = React.useRef(false);
    const [showSummary, setShowSummary] = useState(false);
    const [generatingSummary, setGeneratingSummary] = useState(false);
    const [summaryPoints, setSummaryPoints] = useState<string[]>([]);

    const router = useRouter();
    const pathname = usePathname();
    const LottieRef = React.useRef<LottieRefCurrentProps>(null);
    const isMathSubject = subject.toLowerCase() === "maths" || subject.toLowerCase() === "math";

    const storageKey = React.useMemo(() => `companion_session_${companionId}`, [companionId]);
    const savedPointsKey = React.useMemo(() => `companion_saved_points_${companionId}`, [companionId]);
    const savedSummariesKey = React.useMemo(() => `companion_saved_summaries_${companionId}`, [companionId]);

    useEffect(() => {
        try {
            if (typeof window === "undefined") return;
            const raw = localStorage.getItem(storageKey);
            if (!raw) return;
            const saved = JSON.parse(raw);
            if (Array.isArray(saved?.messages) && saved.messages.length > 0) {
                // Offer a non-blocking resume option for better UX
                toast.info("Previous session found", {
                    description: "Resume your previous session transcript?",
                    action: {
                        label: "Resume",
                        onClick: () => {
                            setMessages(saved.messages as SavedMessage[]);
                            setCallStatus(CallStatus.ACTIVE);
                        },
                    },
                });
            }
        } catch (e) {
            console.warn("Failed to load previous session:", e);
        }
    }, [storageKey]);

    useEffect(() => {
        try {
            if (typeof window === "undefined") return;
            const raw = localStorage.getItem(savedPointsKey);
            if (!raw) return;
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
                const s = new Set<string>();
                for (const it of arr) {
                    if (typeof it === "string" && it.trim()) s.add(it);
                }
                if (s.size > 0) savedKeyPointsRef.current = s;
            }
        } catch (e) {
            console.warn("Failed to load saved key points:", e);
        }
    }, [savedPointsKey]);

    useEffect(() => {
        try {
            if (typeof window === "undefined") return;
            const raw = localStorage.getItem(savedSummariesKey);
            if (!raw) return;
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
                const s = new Set<string>();
                for (const it of arr) {
                    if (typeof it === "string" && it.trim()) s.add(it);
                }
                if (s.size > 0) savedSummariesRef.current = s;
            }
        } catch (e) {
            console.warn("Failed to load saved summaries:", e);
        }
    }, [savedSummariesKey]);

    useEffect(() => {
        try {
            if (typeof window === "undefined") return;
            const payload = JSON.stringify({ messages });
            localStorage.setItem(storageKey, payload);
        } catch (e) {}
    }, [messages, storageKey]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (callStatus === CallStatus.FINISHED) {
            try {
                localStorage.removeItem(storageKey);
            } catch (_) {}
        }
    }, [callStatus, storageKey]);

    useEffect(() => {
        if (LottieRef) {
            if (isSpeaking) {
                LottieRef.current?.play();
            } else {
                LottieRef.current?.stop();
            }
        }
    }, [isSpeaking]);

    useVapiEvents({
        callStatus,
        companionId,
        autoSaveKeyPoints,
        pathname,
        topic, // ADD THIS
        subject, // ADD THIS
        setCallStatus,
        setIsSpeaking,
        setIsMuted,
        setMessages,
        setIsPauseDialogOpen,
        terminationHandledRef,
        isPausedByUserRef,
        savedKeyPointsRef,
        onRefresh: () => router.refresh(),
        onKeyPointsSaved: (normalized) => {
            try {
                if (typeof window === "undefined") return;
                const existingRaw = localStorage.getItem(savedPointsKey);
                const existingArr: string[] = existingRaw ? JSON.parse(existingRaw) : [];
                const merged = Array.from(new Set([...(existingArr || []), ...normalized]));
                localStorage.setItem(savedPointsKey, JSON.stringify(merged));
            } catch (_) {}
        },
    });

    const handleToggleMic = async () => {
        const currentMuted = vapi.isMuted();
        vapi.setMuted(!currentMuted);
        setIsMuted(!currentMuted);
    };

    const handlePauseSession = () => {
        isPausedByUserRef.current = true;
        vapi.setMuted(true);
        setIsMuted(true);
        setCallStatus(CallStatus.PAUSED);
        setIsPauseDialogOpen(true);
    };

    const handleResumeSession = async () => {
        isPausedByUserRef.current = false;
        setIsPauseDialogOpen(false);
        setCallStatus(CallStatus.ACTIVE);
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

    const buildRecap = () => {
        try {
            if (!messages || messages.length === 0) return "";
            const last = messages.slice(-10);
            const lines = last.map((m) => {
                const role = m.role === "assistant" ? name : userName || "You";
                const content = String(m.content || "")
                    .trim()
                    .slice(0, 220);
                return `${role}: ${content}`;
            });
            const recap = lines.join("\n");
            return recap.length > 1500 ? recap.slice(0, 1500) : recap;
        } catch {
            return "";
        }
    };

    const handleConnect = async () => {
        setCallStatus(CallStatus.CONNECTING);
        terminationHandledRef.current = false;
        isPausedByUserRef.current = false;

        try {
            const assistanceOverride = {
                variableValues: {
                    topic,
                    subject,
                    style,
                    recap: buildRecap(),
                },
                clientMessages: ["transcript"],
                serverMessages: ["transcript"],
            } as any;
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
            const assistantMessages = messages
                .filter((m) => m.role === "assistant")
                .map((m) => m.content)
                .join(" ");

            if (assistantMessages.length < 100) {
                toast.error("Not enough content to summarize yet!");
                setGeneratingSummary(false);
                return;
            }

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

                const normalizedPoints = data.summaries.map((p: string) => normalizePoint(p)).sort();
                const signature = normalizePoint(`${topic || ""}`) + "|" + normalizedPoints.join("||");

                if (savedSummariesRef.current.has(signature)) {
                    toast.message("Summary generated", { description: "Already saved earlier. Not saving again." });
                    return; // do not attempt to save duplicate
                }

                try {
                    const result = await addSummary({
                        companionId,
                        points: data.summaries,
                        title: topic,
                        path: pathname || `/companions/${companionId}`,
                    });
                    if (result?.success) {
                        savedSummariesRef.current.add(signature);
                        try {
                            if (typeof window !== "undefined") {
                                const existingRaw = localStorage.getItem(savedSummariesKey);
                                const existingArr: string[] = existingRaw ? JSON.parse(existingRaw) : [];
                                const merged = Array.from(new Set([...(existingArr || []), signature]));
                                localStorage.setItem(savedSummariesKey, JSON.stringify(merged));
                            }
                        } catch (_) {}
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
                    <CompanionAvatar
                        subject={subject}
                        name={name}
                        callStatus={callStatus}
                        isSpeaking={isSpeaking}
                        isMathSubject={isMathSubject}
                        messages={messages}
                        LottieRef={LottieRef}
                    />

                    <CompanionControls
                        userImage={userImage}
                        userName={userName}
                        callStatus={callStatus}
                        isMuted={isMuted}
                        messages={messages}
                        generatingSummary={generatingSummary}
                        onToggleMic={handleToggleMic}
                        onPauseSession={handlePauseSession}
                        onResumeSession={handleResumeSession}
                        onConnect={handleConnect}
                        onDisconnect={handleDisconnect}
                        onGenerateSummary={generateSmartSummary}
                    />
                </section>

                {!isMathSubject && (
                    <LiveTranscript messages={messages} userName={userName} assistantName={name.split(" ")[0]} />
                )}
            </section>

            <PauseDialog
                open={isPauseDialogOpen}
                callStatus={callStatus}
                quickNote={quickNote}
                savedNotes={savedNotes}
                onOpenChange={setIsPauseDialogOpen}
                onQuickNoteChange={setQuickNote}
                onSaveQuickNote={handleSaveQuickNote}
                onResumeSession={handleResumeSession}
            />

            <SummaryDialog
                open={showSummary}
                topic={topic}
                generatingSummary={generatingSummary}
                summaryPoints={summaryPoints}
                onOpenChange={setShowSummary}
                onRegenerate={generateSmartSummary}
            />
        </>
    );
};

export default CompanionComponents;
