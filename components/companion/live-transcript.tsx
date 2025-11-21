import { cn } from "@/lib/utils";

interface LiveTranscriptProps {
    messages: SavedMessage[];
    userName: string;
    assistantName: string;
}

export const LiveTranscript = ({ messages, userName, assistantName }: LiveTranscriptProps) => {
    return (
        <section className="relative flex flex-col gap-4 w-full items-center pt-10 flex-grow overflow-y-auto">
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
                                    {isUser ? userName : assistantName}:
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
    );
};