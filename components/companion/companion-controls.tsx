import { cn } from "@/lib/utils";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Pause, Play, StickyNote, Mic, MicOff } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { CallStatus } from "@/lib/call-status";
import type { CallStatusValue } from "@/lib/call-status";

interface CompanionControlsProps {
    userImage: string;
    userName: string;
    callStatus: CallStatusValue;
    isMuted: boolean;
    messages: SavedMessage[];
    generatingSummary: boolean;
    onToggleMic: () => void;
    onPauseSession: () => void;
    onResumeSession: () => void;
    onConnect: () => void;
    onDisconnect: () => void;
    onGenerateSummary: () => void;
}

export const CompanionControls = ({
    userImage,
    userName,
    callStatus,
    isMuted,
    messages,
    generatingSummary,
    onToggleMic,
    onPauseSession,
    onResumeSession,
    onConnect,
    onDisconnect,
    onGenerateSummary,
}: CompanionControlsProps) => {
    return (
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

            {/* Action Buttons Row - Always visible during active/paused session */}
            {(callStatus === CallStatus.ACTIVE || callStatus === CallStatus.PAUSED) && (
                <TooltipProvider>
                    <div className="grid grid-cols-3 gap-2">
                        {/* Mute/Unmute Button */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    className={cn(
                                        "border-2 rounded-lg flex flex-col gap-1 items-center justify-center py-4 cursor-pointer w-full transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed aspect-square",
                                        isMuted ? "bg-red-50 border-red-500 text-red-700" : "bg-white border-gray-300 text-gray-700"
                                    )}
                                    onClick={onToggleMic}
                                    disabled={callStatus !== CallStatus.ACTIVE && callStatus !== CallStatus.PAUSED}
                                >
                                    {isMuted ? (
                                        <MicOff className="h-6 w-6" />
                                    ) : (
                                        <Mic className="h-6 w-6" />
                                    )}
                                    <p className="text-xs font-medium">{isMuted ? "Unmute" : "Mute"}</p>
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{isMuted ? "Turn on your microphone" : "Mute your microphone"}</p>
                            </TooltipContent>
                        </Tooltip>

                        {/* Pause/Resume Button */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    className={cn(
                                        "border-2 rounded-lg flex flex-col gap-1 items-center justify-center py-4 cursor-pointer w-full transition-all hover:shadow-md aspect-square",
                                        callStatus === CallStatus.PAUSED
                                            ? "bg-green-50 border-green-500 text-green-700"
                                            : "bg-blue-50 border-blue-500 text-blue-700"
                                    )}
                                    onClick={callStatus === CallStatus.PAUSED ? onResumeSession : onPauseSession}
                                >
                                    {callStatus === CallStatus.PAUSED ? (
                                        <>
                                            <Play className="h-6 w-6" />
                                            <p className="text-xs font-medium">Resume</p>
                                        </>
                                    ) : (
                                        <>
                                            <Pause className="h-6 w-6" />
                                            <p className="text-xs font-medium">Pause</p>
                                        </>
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{callStatus === CallStatus.PAUSED ? "Resume the session" : "Pause session to take notes"}</p>
                            </TooltipContent>
                        </Tooltip>

                        {/* Summary Button */}
                        {messages.length > 0 && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        className="border-2 border-purple-500 bg-purple-50 hover:bg-purple-100 rounded-lg flex flex-col gap-1 items-center justify-center py-4 cursor-pointer w-full transition-all hover:shadow-md disabled:opacity-50 aspect-square"
                                        onClick={onGenerateSummary}
                                        disabled={generatingSummary}
                                    >
                                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-xs font-medium text-purple-700">
                                            {generatingSummary ? "..." : "Summary"}
                                        </p>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Generate AI summary of the lesson</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                </TooltipProvider>
            )}

            {/* Main Action Button */}
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
                        ? onDisconnect
                        : onConnect
                }
                disabled={callStatus === CallStatus.CONNECTING}
            >
                {callStatus === CallStatus.ACTIVE || callStatus === CallStatus.PAUSED
                    ? "End Session"
                    : callStatus === CallStatus.CONNECTING
                    ? "Connecting..."
                    : "Start Session"}
            </Button>

            {/* Summary Button - Show after session finished */}
            {callStatus === CallStatus.FINISHED && messages.length > 0 && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                className="border-2 border-purple-500 bg-purple-50 hover:bg-purple-100 rounded-lg flex flex-col gap-2 items-center py-4 cursor-pointer w-full transition-all hover:shadow-md disabled:opacity-50"
                                onClick={onGenerateSummary}
                                disabled={generatingSummary}
                            >
                                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="font-medium text-sm text-purple-700">
                                    {generatingSummary ? "Generating..." : "Generate Smart Summary"}
                                </p>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Generate AI summary of the lesson</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    );
};