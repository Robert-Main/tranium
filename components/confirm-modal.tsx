"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
    trigger?: React.ReactNode;
    children?: React.ReactNode;
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void | Promise<void>;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    trigger,
    children,
    title = "Are you absolutely sure?",
    description = "This action cannot be undone.",
    confirmText = "Delete",
    cancelText = "Cancel",
    onConfirm,
}) => {
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const handleConfirm = async () => {
        try {
            setLoading(true);
            await onConfirm();
            setOpen(false);
        } finally {
            setLoading(false);
        }
    };

    const triggerNode = trigger ?? children;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {triggerNode && <DialogTrigger asChild>{triggerNode}</DialogTrigger>}
            <DialogContent className="bg-gray-50">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        {cancelText}
                    </Button>
                    <Button type="button" variant="destructive" onClick={handleConfirm} disabled={loading}>
                        {loading ? "Deleting..." : confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ConfirmModal;
