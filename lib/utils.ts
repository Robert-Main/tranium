import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { subjectsColors, voices } from "@/constants";
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
  - If the student seems to be taking notes, pause naturally and ask if they're ready to continue
  `
        : "";

    const vapiAssistant: CreateAssistantDTO = {
        name: "Companion",
        firstMessage: "Hello, let's start the session. Today we'll be talking about {{topic}}. Feel free to pause anytime you need to take notes.",
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
                    - Pause naturally after explaining key concepts to allow the student time to process and take notes.
                    - If a student asks to wait or take notes, acknowledge it positively and wait for them to indicate they're ready.
                    - Be patient and understanding when students need time to write things down.
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


export const normalizePoint = (s: string) =>
    s.toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/[\s\-*_•.]+$/g, "")
        .trim();

export const extractKeyPoints = (text: string): string[] => {
    if (!text || text.trim().length < 30) return [];

    const points: string[] = [];
    const sentences = text.split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

    // First pass: Look for bullet points or numbered lists
    const lines = text.split(/\n+/);
    for (const raw of lines) {
        const line = raw.trim();
        if (!line || line.length < 40) continue;

        const bulletMatch = line.match(/^\s*(?:[-*•]|\d+[\.)\-:])\s+(.+)$/);
        if (bulletMatch) {
            const content = bulletMatch[1].trim();
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
        if (sent.length < 40 || sent.length > 350) continue;

        if (keywordPattern.test(sent)) {
            let completePoint = sent;
            if (i + 1 < sentences.length &&
                !sent.match(/[.!?]$/) &&
                (completePoint.length + sentences[i + 1].length) < 350) {
                completePoint += ' ' + sentences[i + 1];
                i++;
            }
            points.push(completePoint);
        }
    }

    // Third pass: If we have very few points, look for complete, informative sentences
    if (points.length < 2) {
        for (const sent of sentences) {
            if (sent.length >= 50 && sent.length <= 300 && /[.!?]$/.test(sent)) {
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
        if (!seen.has(norm) && p.length >= 40 && p.length <= 350) {
            seen.add(norm);
            cleaned.push(p);
        }
        if (cleaned.length >= 4) break;
    }

    return cleaned;
};
