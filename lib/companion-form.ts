import z from "zod";

export const companionFormSchema = z.object({
    name: z.string().min(2, { message: "Companion name must be provided." }),
    subject: z.string().min(2, { message: "Subject is required." }),
    topic: z.string().min(2, { message: "Topic is required." }),
    voice: z.string().min(2, { message: "Voice is required." }),
    style: z.string().min(2, { message: "Style is required." }),
    duration: z.number().min(1, { message: "Duration must be at least 1 minute." }), // Change this
});
export type CompanionFormType = z.infer<typeof companionFormSchema>;