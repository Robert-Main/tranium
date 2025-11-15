import { cn, getSubjectColor } from "@/lib/utils";
import Image from "next/image";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import soundwaves from "@/constants/soundwaves.json";
import { Pause } from "lucide-react";
import { MathWorkingArea } from "@/components/math-working-area";
import { CallStatus } from "@/lib/call-status";
import type { CallStatusValue } from "@/lib/call-status";

interface CompanionAvatarProps {
    subject: string;
    name: string;
    callStatus: CallStatusValue;
    isSpeaking: boolean;
    isMathSubject: boolean;
    messages: SavedMessage[];
    LottieRef: React.RefObject<LottieRefCurrentProps | null>
}

export const CompanionAvatar = ({
    subject,
    name,
    callStatus,
    isSpeaking,
    isMathSubject,
    messages,
    LottieRef,
}: CompanionAvatarProps) => {
    return (
        <div className="border-2 border-orange-500 w-2/3 max-sm:w-full flex flex-col gap-4 justify-center items-center rounded-lg p-6 bg-gradient-to-br from-orange-50 to-white">
            <div
                className="w-full h-[300px] max-sm:h-[250px] flex items-center justify-center rounded-lg relative overflow-hidden shadow-inner"
                style={{ backgroundColor: getSubjectColor(subject) }}
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

                {isMathSubject && callStatus === CallStatus.ACTIVE && (
                    <div className="absolute inset-0 opacity-100 transition-opacity duration-500">
                        <div className="w-full h-full bg-gradient-to-br from-blue-50 via-white to-orange-50">
                            <MathWorkingArea messages={messages} assistantName={name.split(" ")[0]} />
                        </div>
                    </div>
                )}

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
    );
};