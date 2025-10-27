"use client";

import { cn, configureAssistant, getSubjectColor } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import React, { useEffect, useState } from "react";
import { set } from "zod";
import Image from "next/image";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import soundwaves from "@/constants/soundwaves.json";
import { Button } from "./ui/button";
import { addSessionHistory } from "@/lib/actions/companion.action";
import { toast } from "sonner";

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

    const LottieRef = React.useRef<LottieRefCurrentProps>(null);

    useEffect(() => {
        if (LottieRef) {
            if (isSpeaking) {
                LottieRef.current?.play();
            } else LottieRef.current?.stop();
        }
    });

    useEffect(() => {
        const onCallStatus = () => setCallStatus(CallStatus.ACTIVE);
        const onCallEnd = async () => {
            setCallStatus(CallStatus.FINISHED);
            setIsMuted(false);
            try {
                const result = await addSessionHistory(companionId);

                if (result.success) {
                    console.log("Session history saved successfully:", result.data);
                    toast.success("Session saved successfully!");
                } else {
                    console.error("Failed to save session history:", result.error);
                    toast.error("Failed to save session history");
                }

                return;
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
        const isMuted = vapi.isMuted();
        vapi.setMuted(!isMuted);
        setIsMuted(!isMuted);
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
            await vapi.start(configureAssistant(voice, style), assistanceOverride);
        } catch (error) {
            console.error("Error connecting to companion:", error);
        }
    };
    const handleDisconnect = async () => {
        setCallStatus(CallStatus.FINISHED);
        try {
            vapi.stop();
        } catch (error) {
            console.error("Error disconnecting from companion:", error);
        }
    };
    return (
        <section className="flex flex-col h-[70vh]">
            <section className="flex gap-8 max-sm:flex-col">
                <div className="companion-section">
                    <div
                        className="companion-avatar"
                        style={{
                            backgroundColor: getSubjectColor(subject),
                        }}
                    >
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
                                className="max-sm:w-fit"
                            />
                        </div>
                        <div
                            className={cn(
                                "absolute transition-opacity duration-100",
                                callStatus === CallStatus.ACTIVE ? "opacity-100" : "opacity-0"
                            )}
                        >
                            <Lottie
                                lottieRef={LottieRef}
                                animationData={soundwaves}
                                autoPlay={false}
                                className="companion-lottie"
                            />
                        </div>
                    </div>

                    <p className="font-bold text-2xl">{name}</p>
                </div>

                <div className="user-section">
                    <div className="user-avatar">
                        <Image src={userImage} alt="user" width={100} height={100} className="rounded-lg" />
                        <p className="text-2xl font-bold">{userName}</p>
                    </div>
                    <button className="btn-mic " onClick={handleToggleMic} disabled={callStatus !== CallStatus.ACTIVE}>
                        <Image
                            src={isMuted ? "/icons/mic-off.svg" : "/icons/mic-on.svg"}
                            alt="mic"
                            width={32}
                            height={32}
                        />
                        <p className="max-sm:hidden">{isMuted ? "Unmute Mic" : "Mute Mic"}</p>
                    </button>
                    <Button
                        className={cn(
                            "rounded-lg cursor-pointer w-full transition-colors text-white",
                            callStatus === CallStatus.ACTIVE ? "bg-red-700" : "bg-primary ",
                            callStatus === CallStatus.CONNECTING && "animate-pulse"
                        )}
                        onClick={callStatus === CallStatus.ACTIVE ? handleDisconnect : handleConnect}
                    >
                        {callStatus === CallStatus.ACTIVE
                            ? "End Session"
                            : callStatus === CallStatus.CONNECTING
                            ? "Connecting..."
                            : "Start Session"}
                    </Button>
                </div>
            </section>
            <section className="transcript">
                <div className="transcript-message no-scrollbar">
                    {messages.map((message, index) => {
                        if (message.role === "user") {
                            return (
                                <p className="max-sm:text-sm" key={index}>
                                    {name.split(" ")[0].replace("/[.,]/g", "")}: {message.content}
                                </p>
                            );
                        } else {
                            return (
                                <p className="max-sm:text-sm text-primary font-semibold" key={index}>
                                    {userName}: {message.content}
                                </p>
                            );
                        }
                    })}
                </div>

                <div className="transcript-fade" />
            </section>
        </section>
    );
};

export default CompanionComponents;
