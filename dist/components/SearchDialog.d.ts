export interface SearchCriteria {
    name: string;
    minSize?: number;
    maxSize?: number;
    modifiedAfter?: Date;
    modifiedBefore?: Date;
}
interface SearchDialogProps {
    onSubmit: (criteria: SearchCriteria) => void;
    onCancel: () => void;
}
export default function SearchDialog({ onSubmit, onCancel }: SearchDialogProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=SearchDialog.d.ts.map