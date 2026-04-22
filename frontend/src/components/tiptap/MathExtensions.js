import { Node, mergeAttributes } from "@tiptap/core";
import katex from "katex";
import "katex/dist/katex.min.css";
import { mathEventBus } from "./MathDialog";

export const MathInline = Node.create({
  name: "mathInline",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="math-inline"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { "data-type": "math-inline" })];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement("span");
      dom.className =
        "math-inline inline-block px-1 py-0.5 mx-0.5 bg-blue-50 rounded cursor-pointer hover:bg-blue-100";

      let currentNode = node
      const renderMath = (latexContent) => {
        dom.innerHTML = ''
        try {
          katex.render(latexContent || "", dom, {
            throwOnError: false,
            displayMode: false,
          });
        } catch (error) {
          dom.textContent = latexContent;
        }
      };

      renderMath(currentNode.attrs.latex);

      dom.addEventListener("click", (e) => {
        e.stopPropagation();
        const pos = typeof getPos === "function" ? getPos() : null;
        mathEventBus.emit("openMathDialog", {
          type: "inline",
          latex: currentNode.attrs.latex,
          onUpdate: (newLatex) => {
            if (pos !== null && newLatex !== null) {
              editor.commands.command(({ tr }) => {
                tr.setNodeMarkup(pos, undefined, { latex: newLatex });
                return true;
              });
            }
          },
        });
      });
      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type.name !== "mathInline") return false;
          currentNode = updatedNode
          renderMath(currentNode.attrs.latex);
          return true;
        },
      };
    };
  },

  addCommands() {
    return {
      setMathInline:
        (latex) =>
        ({ commands }) => {
          return commands.insertContent({ type: this.name, attrs: { latex } });
        },
    };
  },
});

// Math Block Extension
export const MathBlock = Node.create({
  name: "mathBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="math-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "math-block" })];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement("div");
      dom.className =
        "math-block p-4 my-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 text-center";

      let currentNode = node

      const renderMath = (latexContent) => {
        dom.innerHTML = ''
        try {
          katex.render(latexContent || "", dom, {
            throwOnError: false,
            displayMode: true,
          });
        } catch (error) {
          dom.textContent = latexContent;
        }
      };

      renderMath(currentNode.attrs.latex);

      dom.addEventListener("click", (e) => {
        e.stopPropagation();
        const pos = typeof getPos === "function" ? getPos() : null;

        mathEventBus.emit("openMathDialog", {
          type: "block",
          latex: currentNode.attrs.latex,
          onUpdate: (newLatex) => {
            if (pos !== null && newLatex !== null) {
              editor.commands.command(({ tr }) => {
                tr.setNodeMarkup(pos, undefined, { latex: newLatex });
                return true;
              });
            }
          },
        });
      });

      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type.name !== "mathBlock") return false;
          currentNode = updatedNode
          renderMath(currentNode.attrs.latex);
          return true;
        },
      };
    };
  },

  addCommands() {
    return {
      setMathBlock:
        (latex) =>
        ({ commands }) => {
          return commands.insertContent({ type: this.name, attrs: { latex } });
        },
    };
  },
});
