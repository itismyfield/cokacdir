import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { defaultTheme } from '../themes/classic-blue.js';
const FIELDS = [
    { key: 'name', label: 'Name', hint: 'Pattern to match' },
    { key: 'minSize', label: 'Min Size', hint: 'e.g., 1K, 1M' },
    { key: 'maxSize', label: 'Max Size', hint: 'e.g., 1K, 1M' },
    { key: 'modifiedAfter', label: 'After', hint: 'YYYY-MM-DD' },
    { key: 'modifiedBefore', label: 'Before', hint: 'YYYY-MM-DD' },
];
function parseSize(str) {
    if (!str.trim())
        return undefined;
    const match = str.trim().match(/^(\d+(?:\.\d+)?)\s*([KMGT]?)$/i);
    if (!match)
        return undefined;
    const num = parseFloat(match[1]);
    const unit = (match[2] || '').toUpperCase();
    const multipliers = {
        '': 1,
        'K': 1024,
        'M': 1024 * 1024,
        'G': 1024 * 1024 * 1024,
        'T': 1024 * 1024 * 1024 * 1024,
    };
    return Math.floor(num * (multipliers[unit] || 1));
}
function parseDate(str) {
    if (!str.trim())
        return undefined;
    const date = new Date(str.trim());
    return isNaN(date.getTime()) ? undefined : date;
}
export default function SearchDialog({ onSubmit, onCancel }) {
    const theme = defaultTheme;
    const [activeField, setActiveField] = useState(0);
    const [values, setValues] = useState({
        name: '',
        minSize: '',
        maxSize: '',
        modifiedAfter: '',
        modifiedBefore: '',
    });
    const bgColor = '#000000';
    useInput((input, key) => {
        if (key.escape) {
            onCancel();
            return;
        }
        if (key.return) {
            const criteria = {
                name: values.name,
                minSize: parseSize(values.minSize),
                maxSize: parseSize(values.maxSize),
                modifiedAfter: parseDate(values.modifiedAfter),
                modifiedBefore: parseDate(values.modifiedBefore),
            };
            onSubmit(criteria);
            return;
        }
        if (key.upArrow) {
            setActiveField(prev => Math.max(0, prev - 1));
            return;
        }
        if (key.downArrow || key.tab) {
            setActiveField(prev => Math.min(FIELDS.length - 1, prev + 1));
            return;
        }
        if (key.backspace || key.delete) {
            const field = FIELDS[activeField].key;
            setValues(prev => ({ ...prev, [field]: prev[field].slice(0, -1) }));
            return;
        }
        if (input && !key.ctrl && !key.meta) {
            const field = FIELDS[activeField].key;
            setValues(prev => ({ ...prev, [field]: prev[field] + input }));
        }
    });
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "double", borderColor: theme.colors.borderActive, backgroundColor: bgColor, paddingX: 2, paddingY: 1, children: [_jsx(Box, { justifyContent: "center", marginBottom: 1, children: _jsx(Text, { color: theme.colors.borderActive, bold: true, children: "Advanced Search" }) }), FIELDS.map((field, idx) => {
                const isActive = idx === activeField;
                return (_jsxs(Box, { children: [_jsxs(Text, { color: isActive ? theme.colors.borderActive : theme.colors.text, children: [isActive ? '> ' : '  ', field.label.padEnd(10)] }), _jsx(Text, { color: theme.colors.info, children: "[" }), _jsx(Text, { color: theme.colors.text, backgroundColor: isActive ? theme.colors.bgSelected : undefined, children: (values[field.key] || '').padEnd(12) }), _jsx(Text, { color: theme.colors.info, children: "]" }), isActive && (_jsxs(Text, { color: theme.colors.textDim, children: [" ", field.hint] }))] }, field.key));
            }), _jsx(Text, { children: " " }), _jsx(Text, { color: theme.colors.textDim, children: "[\u2191\u2193/Tab] Navigate  [Enter] Search  [Esc] Cancel" })] }));
}
//# sourceMappingURL=SearchDialog.js.map