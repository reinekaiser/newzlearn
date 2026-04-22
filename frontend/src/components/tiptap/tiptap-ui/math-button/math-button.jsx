"use client";
import * as React from "react";

// --- Icons ---
import { Sigma } from "lucide-react";

import { TbMathIntegral } from "react-icons/tb";

// --- Lib ---
import { parseShortcutKeys } from "@/lib/tiptap-utils";

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/tiptap/use-tiptap-editor";

// --- shadcn Components ---
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button as ShadcnButton } from "@/components/ui/button";
import { Button } from "@/components/tiptap/tiptap-ui-primitive/button";
import { Badge } from "@/components/tiptap/tiptap-ui-primitive/badge";

// --- KaTeX ---
import katex from "katex";
import { MathDialog } from "../../MathDialog";

// Shortcut keys cho Math buttons
export const MATH_SHORTCUT_KEYS = {
  inline: ["mod", "Shift", "M"],
  block: ["mod", "Shift", "E"],
};

// Hook cho Math Inline
export function useMathInline({ editor, hideWhenUnavailable = false, onInserted }) {
  const isVisible = React.useMemo(() => {
    if (!editor) return false;
    if (hideWhenUnavailable && !editor.can().setMathInline("")) {
      return false;
    }
    return true;
  }, [editor, hideWhenUnavailable]);

  const canInsert = React.useMemo(() => {
    return editor?.can().setMathInline("") ?? false;
  }, [editor]);

  const isActive = React.useMemo(() => {
    return editor?.isActive("mathInline") ?? false;
  }, [editor]);

  const handleInsertMathInline = React.useCallback(
    (latex) => {
      if (!editor || !canInsert || !latex?.trim()) return;
      editor.chain().focus().setMathInline(latex).run();
      onInserted?.();
    },
    [editor, canInsert, onInserted]
  );

  return {
    isVisible,
    canInsert,
    isActive,
    handleInsertMathInline,
    label: "Insert inline math formula",
    Icon: Sigma,
    shortcutKeys: MATH_SHORTCUT_KEYS.inline,
  };
}

// Hook cho Math Block
export function useMathBlock({ editor, hideWhenUnavailable = false, onInserted }) {
  const isVisible = React.useMemo(() => {
    if (!editor) return false;
    if (hideWhenUnavailable && !editor.can().setMathBlock("")) {
      return false;
    }
    return true;
  }, [editor, hideWhenUnavailable]);

  const canInsert = React.useMemo(() => {
    return editor?.can().setMathBlock("") ?? false;
  }, [editor]);

  const isActive = React.useMemo(() => {
    return editor?.isActive("mathBlock") ?? false;
  }, [editor]);

  const handleInsertMathBlock = React.useCallback(
    (latex) => {
      if (!editor || !canInsert || !latex?.trim()) return;
      editor.chain().focus().setMathBlock(latex).run();
      onInserted?.();
    },
    [editor, canInsert, onInserted]
  );

  return {
    isVisible,
    canInsert,
    isActive,
    handleInsertMathBlock,
    label: "Insert block math formula",
    Icon: TbMathIntegral,
    shortcutKeys: MATH_SHORTCUT_KEYS.block,
  };
}

// Shortcut Badge Components
export function MathInlineShortcutBadge({ shortcutKeys = MATH_SHORTCUT_KEYS.inline }) {
  return <Badge>{parseShortcutKeys({ shortcutKeys })}</Badge>;
}

export function MathBlockShortcutBadge({ shortcutKeys = MATH_SHORTCUT_KEYS.block }) {
  return <Badge>{parseShortcutKeys({ shortcutKeys })}</Badge>;
}





/**
 * Button component for inserting inline math formulas in a Tiptap editor.
 *
 * For custom button implementations, use the `useMathInline` hook instead.
 */
export const MathInlineButton = React.forwardRef(
  (
    {
      editor: providedEditor,
      text,
      hideWhenUnavailable = false,
      onInserted,
      showShortcut = false,
      onClick,
      icon: CustomIcon,
      children,
      ...buttonProps
    },
    ref
  ) => {
    const { editor } = useTiptapEditor(providedEditor);
    const [dialogOpen, setDialogOpen] = React.useState(false);

    const { isVisible, handleInsertMathInline, label, canInsert, isActive, Icon, shortcutKeys } =
      useMathInline({
        editor,
        hideWhenUnavailable,
        onInserted,
      });

    const handleClick = React.useCallback(
      (event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        setDialogOpen(true);
      },
      [onClick]
    );

    const handleSubmit = React.useCallback(
      (latex) => {
        handleInsertMathInline(latex);
      },
      [handleInsertMathInline]
    );

    if (!isVisible) {
      return null;
    }

    const RenderIcon = CustomIcon ?? Icon;

    return (
      <>
        <Button
          type="button"
          disabled={!canInsert}
          data-style="ghost"
          data-active-state={isActive ? "on" : "off"}
          data-disabled={!canInsert}
          role="button"
          tabIndex={-1}
          aria-label={label}
          aria-pressed={isActive}
          tooltip={label}
          onClick={handleClick}
          {...buttonProps}
          ref={ref}
        >
          {children ?? (
            <>
              <RenderIcon className="tiptap-button-icon" />
              {text && <span className="tiptap-button-text">{text}</span>}
              {showShortcut && <MathInlineShortcutBadge shortcutKeys={shortcutKeys} />}
            </>
          )}
        </Button>

        <MathDialog
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
          type="inline"
        />
      </>
    );
  }
);

MathInlineButton.displayName = "MathInlineButton";

/**
 * Button component for inserting block math formulas in a Tiptap editor.
 *
 * For custom button implementations, use the `useMathBlock` hook instead.
 */
export const MathBlockButton = React.forwardRef(
  (
    {
      editor: providedEditor,
      text,
      hideWhenUnavailable = false,
      onInserted,
      showShortcut = false,
      onClick,
      icon: CustomIcon,
      children,
      ...buttonProps
    },
    ref
  ) => {
    const { editor } = useTiptapEditor(providedEditor);
    const [dialogOpen, setDialogOpen] = React.useState(false);

    const { isVisible, handleInsertMathBlock, label, canInsert, isActive, Icon, shortcutKeys } =
      useMathBlock({
        editor,
        hideWhenUnavailable,
        onInserted,
      });

    const handleClick = React.useCallback(
      (event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        setDialogOpen(true);
      },
      [onClick]
    );

    const handleSubmit = React.useCallback(
      (latex) => {
        handleInsertMathBlock(latex);
      },
      [handleInsertMathBlock]
    );

    if (!isVisible) {
      return null;
    }

    const RenderIcon = CustomIcon ?? Icon;

    return (
      <>
        <Button
          type="button"
          disabled={!canInsert}
          data-style="ghost"
          data-active-state={isActive ? "on" : "off"}
          data-disabled={!canInsert}
          role="button"
          tabIndex={-1}
          aria-label={label}
          aria-pressed={isActive}
          tooltip={label}
          onClick={handleClick}
          {...buttonProps}
          ref={ref}
        >
          {children ?? (
            <>
              <RenderIcon className="tiptap-button-icon" />
              {text && <span className="tiptap-button-text">{text}</span>}
              {showShortcut && <MathBlockShortcutBadge shortcutKeys={shortcutKeys} />}
            </>
          )}
        </Button>

        <MathDialog
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
          type="block"
        />
      </>
    );
  }
);

MathBlockButton.displayName = "MathBlockButton";
