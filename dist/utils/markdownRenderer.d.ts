/**
 * Markdown Renderer for Terminal
 * Based on aiexecode's markdown rendering approach
 * Adapted for cokacdir project (TypeScript + Ink)
 */
import React from 'react';
/**
 * Main markdown rendering function
 */
export interface RenderMarkdownOptions {
    terminalWidth?: number;
}
export declare function renderMarkdown(text: string, options?: RenderMarkdownOptions): React.ReactNode;
/**
 * Markdown text component for easy use
 */
interface MarkdownTextProps {
    children: string;
    width?: number;
}
export declare const MarkdownText: React.FC<MarkdownTextProps>;
export {};
//# sourceMappingURL=markdownRenderer.d.ts.map