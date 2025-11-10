import { extractSteps, formatMathContent } from "@/constants/formated-math-content";
import { cn } from "@/lib/utils";

export const MathWorkingArea = ({ messages, assistantName }: { messages: SavedMessage[], assistantName: string }) => {
    // Get only assistant messages that might contain math
    const assistantMessages = messages
        .filter(msg => msg.role === "assistant")
        .slice(-3); // Show last 3 messages

    if (assistantMessages.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center p-6">
                <div className="text-center">
                    <div className="text-6xl mb-4">📐</div>
                    <p className="text-gray-500 text-lg font-medium">
                        Math explanations will appear here...
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                        Start speaking to see step-by-step solutions
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-y-auto no-scrollbar p-6 space-y-4 flex flex-col justify-center">
            {assistantMessages.map((msg, idx) => {
                const steps = extractSteps(msg.content);

                return (
                    <div
                        key={idx}
                        className="bg-white rounded-2xl p-5 shadow-lg border-2 border-blue-300 animate-in fade-in slide-in-from-bottom-4 duration-500"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                {idx + 1}
                            </div>
                            <p className="text-sm font-bold text-blue-600">
                                {assistantName}
                            </p>
                        </div>

                        {steps.length > 1 ? (
                            <div className="space-y-3">
                                {steps.map((step, stepIdx) => {
                                    const formatted = formatMathContent(step.trim());
                                    const isMathExpression = /[+\-×÷·=√^²³]/.test(formatted);

                                    return (
                                        <div key={stepIdx} className="pl-2">
                                            <p className={cn(
                                                "leading-relaxed",
                                                isMathExpression
                                                    ? "text-2xl font-mono tracking-wider text-blue-900"
                                                    : "text-lg font-medium text-gray-800"
                                            )}>
                                                {formatted}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className={cn(
                                "leading-relaxed pl-2",
                                /[+\-×÷·=√^²³]/.test(formatMathContent(msg.content))
                                    ? "text-2xl font-mono tracking-wider text-blue-900"
                                    : "text-xl font-medium text-gray-800"
                            )}>
                                {formatMathContent(msg.content)}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
};