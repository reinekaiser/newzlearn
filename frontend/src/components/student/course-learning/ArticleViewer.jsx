"use client";

import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Link } from "@tiptap/extension-link"; 
import Mention from "@tiptap/extension-mention";

import "katex/dist/katex.min.css";

import "@/components/tiptap/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "@/components/tiptap/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap/tiptap-node/heading-node/heading-node.scss";
import "@/components/tiptap/tiptap-node/paragraph-node/paragraph-node.scss";
import "@/components/tiptap/tiptap-templates/simple/simple-editor.scss"; // Style tổng
import { MathBlock, MathInline } from "@/components/tiptap/MathExtensions";

const ArticleViewer = ({ content }) => {
    const editor = useEditor({
        editable: false, 
        content: content,
        shouldRerenderOnTransaction: false,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: "simple-editor-content outline-none prose max-w-none is-viewer", 
            },
        },
        extensions: [
            StarterKit.configure({
                horizontalRule: false, 
            }),
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            TaskList,
            TaskItem.configure({ nested: true }),
            Highlight.configure({ multicolor: true }),
            Image,
            Typography,
            Superscript,
            Subscript,
            Link.configure({
                openOnClick: true, 
                autolink: true,
            }),
            Mention.configure({
                HTMLAttributes: {
                    class: "mention bg-[#cee8fb] text-white px-1 rounded",
                },
            }),
            MathInline,
            MathBlock,
        ],
    });

    useEffect(() => {
        if (editor && content) {
            if (editor.getHTML() !== content) {
                editor.commands.setContent(content);
            }
        }
    }, [content, editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className="">
            <EditorContent editor={editor} className="" />
        </div>
    );
};

export default ArticleViewer;