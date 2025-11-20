import { Extension } from '@tiptap/core';

export interface LetterSpacingOptions {
  types: string[];
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    letterSpacing: {
      setLetterSpacing: (letterSpacing: string) => ReturnType;
      unsetLetterSpacing: () => ReturnType;
    };
  }
}

export const LetterSpacing = Extension.create<LetterSpacingOptions>({
  name: 'letterSpacing',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          letterSpacing: {
            default: null,
            parseHTML: (element) => element.style.letterSpacing || null,
            renderHTML: (attributes) => {
              if (!attributes.letterSpacing) {
                return {};
              }
              return {
                style: `letter-spacing: ${attributes.letterSpacing}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLetterSpacing:
        (letterSpacing: string) =>
        ({ chain }) => {
          return chain()
            .setMark('textStyle', { letterSpacing })
            .run();
        },
      unsetLetterSpacing:
        () =>
        ({ chain }) => {
          return chain()
            .setMark('textStyle', { letterSpacing: null })
            .removeEmptyTextStyle()
            .run();
        },
    };
  },
});

