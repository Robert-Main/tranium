"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { companionFormSchema, CompanionFormType } from "@/lib/companion-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { subjects } from "@/constants";
import { Textarea } from "./ui/textarea";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createCompanion, updateCompanion } from "@/lib/actions/companion.action";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface CompanionFormProps {
    companion?: Companion;
}

export function CompanionForm({ companion }: CompanionFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const isEditMode = !!companion;

    const form = useForm<z.infer<typeof companionFormSchema>>({
        resolver: zodResolver(companionFormSchema),
        defaultValues: companion
            ? {
                  name: companion.name || "",
                  subject: companion.subject || "",
                  topic: companion.topic || "",
                  voice: companion.voice || "",
                  style: companion.style || "",
                  duration: companion.duration || 15,
              }
            : {
                  name: "",
                  subject: "",
                  topic: "",
                  voice: "",
                  style: "",
                  duration: 15,
              },
    });

    useEffect(() => {
        if (companion) {
            const resetValues = {
                name: companion.name || "",
                subject: companion.subject || "",
                topic: companion.topic || "",
                voice: companion.voice || "",
                style: companion.style || "",
                duration: companion.duration || 15,
            };
            form.reset(resetValues);
        }
    }, [companion?.id]);

    async function onSubmit(data: CompanionFormType) {
        setIsLoading(true);

        try {
            let res;
            if (isEditMode && companion?.id) {
                res = await updateCompanion(companion.id, data);
            } else {
                res = await createCompanion(data);
            }

            if (res && res.success) {
                toast.success(isEditMode ? "Companion updated successfully!" : "Companion created successfully!");

                if (res.data?.id) {
                    router.push(`/companions/${res.data.id}`);
                } else {
                    router.push(`/companions/`);
                }
            } else {
                const msg =
                    res && !res.success
                        ? res.error || `Failed to ${isEditMode ? "update" : "create"} companion`
                        : `Failed to ${isEditMode ? "update" : "create"} companion`;
                toast.error(msg);
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Companion name</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter a companion name" className="input" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <FormControl>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="input capitalize">
                                        <SelectValue placeholder="select the subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subjects.map((subject) => (
                                            <SelectItem key={subject} value={subject} className="capitalize">
                                                {subject}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>What should the companion assist you with</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Ex. derivate & integral" className="input" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="voice"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Voices</FormLabel>
                            <FormControl>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="input capitalize">
                                        <SelectValue placeholder="select the voice" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="style"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Voice style</FormLabel>
                            <FormControl>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="input capitalize">
                                        <SelectValue placeholder="select the voice style" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="formal">Formal</SelectItem>
                                        <SelectItem value="casual">Casual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Estimated duration in minutes</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    placeholder="15"
                                    className="input"
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button
                    type="submit"
                    disabled={isLoading || form.formState.isSubmitting}
                    className="w-full cursor-pointer"
                >
                    {isLoading || form.formState.isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {isEditMode ? "Updating..." : "Creating..."}
                        </>
                    ) : isEditMode ? (
                        "Update Companion"
                    ) : (
                        "Create Companion"
                    )}
                </Button>
            </form>
        </Form>
    );
}
