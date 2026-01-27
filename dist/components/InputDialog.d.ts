interface InputDialogProps {
    title: string;
    prompt: string;
    defaultValue?: string;
    onSubmit: (value: string) => void;
    onCancel: () => void;
}
export default function InputDialog({ title, prompt, defaultValue, onSubmit, onCancel, }: InputDialogProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=InputDialog.d.ts.map