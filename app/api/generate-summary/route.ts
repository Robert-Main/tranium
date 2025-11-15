// ============================================
// FILE: app/api/generate-summary/route.ts
// Using Groq (Completely free & very fast!)
// ============================================
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { topic, subject, transcript } = await req.json();

        if (!transcript || transcript.length < 100) {
            return NextResponse.json(
                { error: "Not enough content to summarize" },
                { status: 400 }
            );
        }

        // Call Groq API (Free & Fast)
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile", // Fast and free
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant that creates concise study summaries."
                    },
                    {
                        role: "user",
                        content: `Summarize this lesson about "${topic}" in ${subject}.

Extract 5-8 brief key points (10-20 words each). Make them clear and actionable for students.

Transcript:
${transcript}

Respond ONLY with a JSON array of strings:
["point 1", "point 2", ...]`
                    }
                ],
                temperature: 0.5,
                max_tokens: 500,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Groq API error:", errorText);
            return NextResponse.json(
                { error: "Failed to generate summary" },
                { status: response.status }
            );
        }

        const data = await response.json();
        const text = data.choices[0]?.message?.content || "";

        // Parse the response
        const cleanText = text.replace(/```json|```/g, "").trim();
        const summaries = JSON.parse(cleanText);

        if (!Array.isArray(summaries) || summaries.length === 0) {
            return NextResponse.json(
                { error: "Invalid summary format" },
                { status: 500 }
            );
        }

        return NextResponse.json({ summaries });
    } catch (error) {
        console.error("Error in generate-summary API:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}