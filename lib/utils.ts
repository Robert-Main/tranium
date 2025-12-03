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
                    - If a session recap is provided, use it strictly as prior context to continue without repeating the same explanations. Recap:
                    {{ recap }}
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

export const extractKeyPoints = (text: string, topic?: string, subject?: string): string[] => {
    if (!text || text.trim().length < 50) return [];

    const points: string[] = [];
    const sentences = text.split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

    // Stronger keyword patterns for educational content
    const strongKeywordPattern = /\b(key\s*(?:point|concept|idea|takeaway)|important\s*(?:to\s*(?:note|remember|understand))?|remember\s*that|crucial|essential|fundamental|main\s*(?:idea|concept|point)|this\s*means|defined\s*as|refers\s*to|in\s*other\s*words)\b/i;

    // Pattern for definition-style sentences
    const definitionPattern = /\b(?:is|are|means|refers\s*to|defined\s*as|consists\s*of|involves|describes)\b/i;

    // Pattern for explanation sentences
    const explanationPattern = /\b(?:because|when|if|causes|results\s*in|affects|leads\s*to|due\s*to|allows|enables)\b/i;

    // Patterns to EXCLUDE (conversational/filler content)
    const excludePatterns = [
        /^(?:so|well|now|okay|alright|let me|let's|shall we|how about|what about|do you|can you|would you)\b/i,
        /\b(?:understand|got it|make sense|following|ready|continue|move on|next|questions?)\s*\?/i,
        /\b(?:hello|hi|hey|thanks|thank you|great|good|nice|awesome)\b/i,
        /\blet'?s\s+(?:start|begin|continue|move|discuss|talk)\b/i,
    ];

    // Topic relevance check (if topic provided)
    const topicKeywords = topic
        ? topic.toLowerCase().split(/\s+/).filter(w => w.length > 3)
        : [];

    const isRelevantToTopic = (sentence: string): boolean => {
        if (topicKeywords.length === 0) return true;
        const lower = sentence.toLowerCase();
        return topicKeywords.some(keyword => lower.includes(keyword)) ||
               (subject ? lower.includes(subject.toLowerCase()) : false);
    };

    // First pass: Look for explicit bullet points or numbered lists
    const lines = text.split(/\n+/);
    for (const raw of lines) {
        const line = raw.trim();
        if (line.length < 60) continue;

        const bulletMatch = line.match(/^\s*(?:[-*•]|\d+[\.)\-:])\s+(.+)$/);
        if (bulletMatch) {
            const content = bulletMatch[1].trim();

            // Stricter validation for bullet points
            if (content.length >= 60 &&
                content.length <= 300 &&
                !excludePatterns.some(pattern => pattern.test(content)) &&
                isRelevantToTopic(content) &&
                (definitionPattern.test(content) || explanationPattern.test(content))) {

                const cleanPoint = content.endsWith('.') || content.endsWith('!') || content.endsWith('?')
                    ? content
                    : content + '.';
                points.push(cleanPoint);
            }
        }
    }

    // Second pass: Look for sentences with strong educational indicators
    for (let i = 0; i < sentences.length; i++) {
        const sent = sentences[i];

        // Stricter length requirements
        if (sent.length < 60 || sent.length > 300) continue;

        // Check for exclusion patterns
        if (excludePatterns.some(pattern => pattern.test(sent))) continue;

        // Check topic relevance
        if (!isRelevantToTopic(sent)) continue;

        // Strong educational content indicators
        const hasStrongKeyword = strongKeywordPattern.test(sent);
        const hasDefinition = definitionPattern.test(sent);
        const hasExplanation = explanationPattern.test(sent);

        // Must have at least one strong indicator
        if (hasStrongKeyword || (hasDefinition && sent.length >= 80) || hasExplanation) {
            let completePoint = sent;

            // Try to complete the thought if sentence seems incomplete
            if (i + 1 < sentences.length &&
                !sent.match(/[.!?]$/) &&
                (completePoint.length + sentences[i + 1].length) < 300) {
                completePoint += ' ' + sentences[i + 1];
                i++;
            }

            points.push(completePoint);
        }
    }

    // Third pass: If we still have very few points, look for substantial explanatory sentences
    if (points.length < 2) {
        for (const sent of sentences) {
            if (sent.length >= 80 && sent.length <= 250 && /[.!?]$/.test(sent)) {

                // Must be explanatory AND relevant
                const isExplanatory = definitionPattern.test(sent) || explanationPattern.test(sent);
                const hasSubstantiveVerbs = /\b(describes|explains|demonstrates|illustrates|shows|indicates|represents|involves)\b/i.test(sent);
                const notTransitional = !/^(so|and|but|however|therefore|thus|first|second|next|finally|in conclusion)\b/i.test(sent);
                const notQuestion = !sent.includes('?');

                if (isExplanatory &&
                    hasSubstantiveVerbs &&
                    notTransitional &&
                    notQuestion &&
                    isRelevantToTopic(sent) &&
                    !excludePatterns.some(pattern => pattern.test(sent))) {
                    points.push(sent);
                }
            }
        }
    }

    // Quality scoring: rank points by their educational value
    const scoredPoints = points.map(point => {
        let score = 0;

        // Prefer longer, more detailed points
        if (point.length >= 100) score += 2;
        if (point.length >= 150) score += 1;

        // Prefer points with strong keywords
        if (strongKeywordPattern.test(point)) score += 3;

        // Prefer definition-style sentences
        if (definitionPattern.test(point)) score += 2;

        // Prefer points that mention the topic
        if (isRelevantToTopic(point)) score += 2;

        // Prefer points with specific examples
        if (/\b(for\s*example|such\s*as|like|including|e\.g\.)\b/i.test(point)) score += 1;

        return { point, score };
    });

    // Sort by score and take top points
    scoredPoints.sort((a, b) => b.score - a.score);

    // Deduplicate and limit to top 4
    const seen = new Set<string>();
    const cleaned: string[] = [];

    for (const { point, score } of scoredPoints) {
        // Only accept points with minimum quality score
        if (score < 3) continue;

        const norm = normalizePoint(point);
        if (!seen.has(norm) && point.length >= 60 && point.length <= 300) {
            seen.add(norm);
            cleaned.push(point);
        }
        if (cleaned.length >= 4) break;
    }

    return cleaned;
};