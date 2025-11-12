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
import { useRouter } from "next/navigation";
import { extractSteps, formatMathContent } from "@/constants/formated-math-content";
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

    const router = useRouter();
    const LottieRef = React.useRef<LottieRefCurrentProps>(null);
    const isMathSubject = subject.toLowerCase() === "maths" || subject.toLowerCase() === "math";

    useEffect(() => {
        if (LottieRef) {
            if (isSpeaking) {
                LottieRef.current?.play();
            } else LottieRef.current?.stop();
        }
    }, [isSpeaking]);

    useEffect(() => {
        const onCallStatus = () => setCallStatus(CallStatus.ACTIVE);
        const onCallEnd = async () => {
            setCallStatus(CallStatus.FINISHED);
            setIsMuted(false);
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
        };

        const onSpeechStart = () => setIsSpeaking(true);
        const onSpeechEnd = () => setIsSpeaking(false);

        const onMessage = (message: any) => {
            if (message?.type === "transcript" && (message as any).transcriptType === "final") {
                const newMessage = { role: message.role, content: message.transcript };
                setMessages((prevMessages) => [...prevMessages, newMessage]);
            }
        };

        const onError = (error: string) => {
            console.error("Error from companion:", error);
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
    }, [callStatus, companionId]);

    const handleToggleMic = async () => {
        const currentMuted = vapi.isMuted();
        vapi.setMuted(!currentMuted);
        setIsMuted(!currentMuted);
    };

    const handlePauseSession = () => {
        // Mute the microphone
        vapi.setMuted(true);
        setIsMuted(true);
        setCallStatus(CallStatus.PAUSED);
        setIsPauseDialogOpen(true);
    };

    const handleResumeSession = () => {
        setIsPauseDialogOpen(false);
        setCallStatus(CallStatus.ACTIVE);
        // Unmute the microphone
        vapi.setMuted(false);
        setIsMuted(false);

        if (quickNote.trim()) {
            setSavedNotes(prev => [...prev, quickNote]);
            setQuickNote("");
            toast.success("Note saved!");
        }
    };

    const handleSaveQuickNote = () => {
        if (quickNote.trim()) {
            setSavedNotes(prev => [...prev, quickNote]);
            setQuickNote("");
            toast.success("Note saved! You can continue adding more.");
        }
    };

    const handleConnect = async () => {
        setCallStatus(CallStatus.CONNECTING);
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
        setCallStatus(CallStatus.FINISHED);
        try {
            vapi.stop();
            router.push("/companions");
        } catch (error) {
            console.error("Error disconnecting from companion:", error);
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
            <Dialog open={isPauseDialogOpen} onOpenChange={setIsPauseDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
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
        </>
    );
};

export default CompanionComponents;