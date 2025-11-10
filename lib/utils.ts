import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { subjectsColors, voices /* voices */ } from "@/constants";
import { CreateAssistantDTO } from "@vapi-ai/web/dist/api";
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const getSubjectColor = (subject: string) => {
    return subjectsColors[subject as keyof typeof subjectsColors];
};

export const configureAssistant = (voice: string, style: string, isMathSubject: boolean = false) => {
    const voiceId =
        voices[voice as keyof typeof voices][style as keyof (typeof voices)[keyof typeof voices]] || "sarah";

    const mathInstructions = isMathSubject
        ? `
   CRITICAL - Mathematical Notation Rules:
  - You MUST use mathematical symbols in your speech, NOT words:
    ✓ Say "two plus two c times k times u times three"
    ✗ Do NOT say "two plus two c dot k u dot three"

    ✓ Say "x squared"
    ✗ Do NOT say "x to the power of two"

    ✓ Say "x equals five"
    ✗ Do NOT say "x equal sign five"

  - Break down problems into clear numbered steps
  - Use natural mathematical language that will transcribe cleanly
  - After each calculation, state the result clearly
  - Example: "Step one: substitute the values. We get two times three plus four, which equals ten"
  - Keep each step concise and verify understanding
  `
        : "";

    const vapiAssistant: CreateAssistantDTO = {
        name: "Companion",
        firstMessage: "Hello, let's start the session. Today we'll be talking about {{topic}}.",
        transcriber: {
            provider: "deepgram",
            model: "nova-3",
            language: "en",
        },
        voice: {
            provider: "11labs",
            voiceId: voiceId,
            stability: 0.4,
            similarityBoost: 0.8,
            speed: 1,
            style: 0.5,
            useSpeakerBoost: true,
        },
        model: {
            provider: "openai",
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `You are a highly knowledgeable tutor teaching a real-time voice session with a student. Your goal is to teach the student about the topic and subject.

                    Tutor Guidelines:
                    - Stick to the given topic - {{ topic }} and subject - {{ subject }} and teach the student about it.
                    - Keep the conversation flowing smoothly while maintaining control.
                    - From time to time make sure that the student is following you and understands you.
                    - Break down the topic into smaller parts and teach the student one part at a time.
                    - Keep your style of conversation {{ style }}.
                    - Keep your responses concise and conversational.
                    ${mathInstructions}
              `,
                },
            ],
        },
        clientMessages: undefined,
        serverMessages: undefined,
    };
    return vapiAssistant;
};
