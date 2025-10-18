"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

import { companionFormSchema } from "@/lib/companion-form";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./ui/select";
import { subjects, voices } from "@/constants";
import { Textarea } from "./ui/textarea";

export function CompanionForm() {
    const form = useForm<z.infer<typeof companionFormSchema>>({
        resolver: zodResolver(companionFormSchema),
        defaultValues: {
            name: "",
            subject: "",
            topic: "",
            voice: "",
            style: "",
            duration: 15
        },
    });

    async function onSubmit(data: z.infer<typeof companionFormSchema>) {
        console.log(data);
    }

    console.log(form.formState.errors);

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
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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
                <Button type="submit" className="w-full cursor-pointer">Create companion</Button>
            </form>
        </Form>
    );
}
