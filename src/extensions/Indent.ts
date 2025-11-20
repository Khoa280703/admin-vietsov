import { Extension } from '@tiptap/core';

export interface IndentOptions {
  types: string[];
  minLevel: number;
  maxLevel: number;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      setIndent: () => ReturnType;
      unsetIndent: () => ReturnType;
    };
  }
}

export const Indent = Extension.create<IndentOptions>({
  name: 'indent',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
      minLevel: 0,
      maxLevel: 8,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const indent = parseInt(element.style.paddingLeft || '0', 10);
              return indent / 40; // Convert px to indent level (40px per level)
            },
            renderHTML: (attributes) => {
              if (!attributes.indent || attributes.indent === 0) {
                return {};
              }
              return {
                style: `padding-left: ${attributes.indent * 40}px`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setIndent:
        () =>
        ({ chain }) => {
          const indentLevel = this.editor.getAttributes('paragraph').indent || 0;
          if (indentLevel >= this.options.maxLevel) {
            return false;
          }
          return chain()
            .updateAttributes('paragraph', { indent: indentLevel + 1 })
            .run();
        },
      unsetIndent:
        () =>
        ({ chain }) => {
          const indentLevel = this.editor.getAttributes('paragraph').indent || 0;
          if (indentLevel <= this.options.minLevel) {
            return false;
          }
          return chain()
            .updateAttributes('paragraph', { indent: indentLevel - 1 })
            .run();
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.setIndent(),
      'Shift-Tab': () => this.editor.commands.unsetIndent(),
    };
  },
});

