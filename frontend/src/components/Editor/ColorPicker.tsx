import { Editor } from '@tiptap/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Pencil, Plus, Check, Droplet } from 'lucide-react';

interface ColorPickerProps {
  editor: Editor;
  type: 'highlight' | 'text';
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

// Generate 60 colors in 6 rows x 10 columns
const generateColorPalette = (): string[] => {
  const colors: string[] = [];
  
  // Row 1: Grayscale (10 colors from black to white)
  for (let i = 0; i <= 9; i++) {
    const gray = Math.round((i / 9) * 255);
    const hex = gray.toString(16).padStart(2, '0');
    colors.push(`#${hex}${hex}${hex}`);
  }
  
  // Row 2: Bright primary and secondary colors
  colors.push(
    '#FF0000', // Red
    '#FF6600', // Orange
    '#FFCC00', // Yellow
    '#66FF00', // Bright Green
    '#00FFFF', // Cyan
    '#0066FF', // Light Blue
    '#0000FF', // Blue
    '#6600FF', // Purple
    '#FF00FF', // Magenta
    '#FF0066'  // Pink
  );
  
  // Row 3: Pastel and lighter shades
  colors.push(
    '#FFB3BA', // Light Pink
    '#FFDFBA', // Light Peach
    '#FFFFBA', // Light Yellow
    '#BAFFC9', // Light Green
    '#BAE1FF', // Light Blue
    '#E0BBE4', // Light Purple
    '#FEC8C1', // Light Coral
    '#FFD3A5', // Light Orange
    '#FDBCB4', // Light Salmon
    '#F4A261'  // Sandy Brown
  );
  
  // Row 4: Medium tones
  colors.push(
    '#E63946', // Red
    '#F77F00', // Orange
    '#FCBF49', // Yellow
    '#06A77D', // Green
    '#118AB2', // Blue
    '#6A4C93', // Purple
    '#C77DFF', // Light Purple
    '#FF6B6B', // Coral
    '#4ECDC4', // Turquoise
    '#45B7D1'  // Sky Blue
  );
  
  // Row 5: Darker, richer tones
  colors.push(
    '#8B0000', // Dark Red
    '#CC5500', // Dark Orange
    '#B8860B', // Dark Goldenrod
    '#006400', // Dark Green
    '#00008B', // Dark Blue
    '#4B0082', // Indigo
    '#8B008B', // Dark Magenta
    '#800080', // Purple
    '#2F4F4F', // Dark Slate Gray
    '#556B2F'  // Dark Olive Green
  );
  
  // Row 6: Earth tones and muted colors
  colors.push(
    '#8B4513', // Saddle Brown
    '#A0522D', // Sienna
    '#CD853F', // Peru
    '#6B8E23', // Olive Drab
    '#228B22', // Forest Green
    '#4682B4', // Steel Blue
    '#483D8B', // Dark Slate Blue
    '#8B4789', // Pale Violet Red
    '#BC8F8F', // Rosy Brown
    '#708090'  // Slate Gray
  );
  
  return colors;
};

// Standard colors (matching the image: black, white, blue, red, orange, yellow, green, cyan)
const standardColors = [
  '#000000', // Black
  '#FFFFFF', // White
  '#0000FF', // Blue
  '#FF0000', // Red
  '#FF6600', // Orange
  '#FFCC00', // Yellow
  '#00FF00', // Green
  '#00FFFF', // Cyan
];

const CUSTOM_COLORS_KEY = 'custom_colors';

const getCustomColors = (): string[] => {
  try {
    const stored = localStorage.getItem(CUSTOM_COLORS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveCustomColor = (color: string): void => {
  try {
    const customColors = getCustomColors();
    if (!customColors.includes(color)) {
      const updated = [...customColors, color].slice(-10); // Keep last 10
      localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(updated));
    }
  } catch {
    // Ignore errors
  }
};

export function ColorPicker({ editor, type, onClose, triggerRef }: ColorPickerProps) {
  const [open, setOpen] = useState(true);
  const [currentColor, setCurrentColor] = useState<string>('#000000');
  const [customColors, setCustomColors] = useState<string[]>(getCustomColors());
  const [alternatingColors, setAlternatingColors] = useState(false);
  const colorPalette = generateColorPalette();
  const isHighlight = type === 'highlight';

  // Get current color from editor
  useEffect(() => {
    if (isHighlight) {
      const highlightColor = editor.getAttributes('highlight').color;
      if (highlightColor) {
        setCurrentColor(highlightColor);
      }
    } else {
      const textColor = editor.getAttributes('textStyle').color;
      if (textColor) {
        setCurrentColor(textColor);
      }
    }
  }, [editor, isHighlight]);

  const handleColorSelect = (color: string) => {
    setCurrentColor(color);
    if (isHighlight) {
      editor.chain().focus().toggleHighlight({ color }).run();
    } else {
      editor.chain().focus().setColor(color).run();
    }
    setOpen(false);
    onClose();
  };

  const handleReset = () => {
    if (isHighlight) {
      editor.chain().focus().unsetHighlight().run();
    } else {
      editor.chain().focus().unsetColor().run();
    }
    setCurrentColor('#000000');
  };

  const handleAddCustomColor = () => {
    if (currentColor && /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(currentColor)) {
      saveCustomColor(currentColor);
      setCustomColors(getCustomColors());
    }
  };

  const handleCustomColorInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentColor(value);
  };

  const handleCustomColorApply = () => {
    if (/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(currentColor)) {
      handleColorSelect(currentColor);
    }
  };

  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (triggerRef?.current && open) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  }, [triggerRef, open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef?.current && !triggerRef.current.contains(target)) {
        const colorPickerElement = document.querySelector('.color-picker-container');
        if (colorPickerElement && !colorPickerElement.contains(target)) {
          setOpen(false);
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, triggerRef, onClose]);

  if (!open) return null;

  return (
    <div
      className="color-picker-container fixed z-50 w-[180px] p-2 max-h-[400px] overflow-y-auto bg-white text-black border border-border shadow-lg rounded-md"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
        <div className="space-y-2">
          {/* Reset Button with Paint Bucket Icon */}
          <button
            onClick={handleReset}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-[10px] text-black hover:bg-accent/60 rounded transition-colors"
            type="button"
          >
            <div className="relative">
              <Droplet className="h-3.5 w-3.5 text-gray-600" />
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                <div className="w-3 h-0.5 bg-gray-600 transform rotate-45" />
              </div>
            </div>
            <span>Đặt lại</span>
          </button>

          {/* Main Color Grid - 6 rows x 10 columns */}
          <div className="grid grid-cols-10 gap-0.5">
            {colorPalette.map((color, index) => (
              <button
                key={index}
                onClick={() => handleColorSelect(color)}
                className="w-5 h-5 rounded-full border border-gray-300 hover:border-gray-500 hover:scale-110 transition-all cursor-pointer"
                style={{ backgroundColor: color }}
                type="button"
                title={color}
              />
            ))}
          </div>

          <Separator className="my-1.5" />

          {/* Standard Colors */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-black">CHUẨN</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-accent/60"
                onClick={() => {
                  // Edit standard colors (placeholder)
                }}
                title="Chỉnh sửa màu chuẩn"
              >
                <Pencil className="h-2.5 w-2.5" />
              </Button>
            </div>
            <div className="flex gap-1 flex-wrap">
              {standardColors.map((color, index) => (
                <button
                  key={index}
                  onClick={() => handleColorSelect(color)}
                  className="w-5 h-5 rounded-full border border-gray-300 hover:border-gray-500 hover:scale-110 transition-all cursor-pointer"
                  style={{ backgroundColor: color }}
                  type="button"
                  title={color}
                />
              ))}
            </div>
          </div>

          <Separator className="my-1.5" />

          {/* Custom Colors */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-black">TÙY CHỈNH</span>
              <div className="flex gap-0.5">
                {customColors.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-accent/60"
                    onClick={() => {
                      // Edit custom color (placeholder)
                    }}
                    title="Chỉnh sửa màu tùy chỉnh"
                  >
                    <Pencil className="h-2.5 w-2.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-gray-100"
                  onClick={handleAddCustomColor}
                  title="Thêm màu tùy chỉnh"
                >
                  <Plus className="h-2.5 w-2.5" />
                </Button>
              </div>
            </div>
            {customColors.length > 0 ? (
              <div className="flex gap-1 flex-wrap items-center">
                {customColors.map((color, index) => {
                  const isSelected = currentColor.toLowerCase() === color.toLowerCase();
                  return (
                    <div key={index} className="relative">
                      <button
                        onClick={() => handleColorSelect(color)}
                        className="w-5 h-5 rounded-full border border-gray-300 hover:border-gray-500 hover:scale-110 transition-all cursor-pointer"
                        style={{ backgroundColor: color }}
                        type="button"
                        title={color}
                      />
                      {isSelected && (
                        <Check className="absolute -top-0.5 -right-0.5 h-3 w-3 text-white bg-gray-800 rounded-full p-0.5" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-[10px] text-gray-400">Chưa có màu tùy chỉnh</div>
            )}
          </div>

          <Separator className="my-1.5" />

          {/* Custom Color Input */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={currentColor.startsWith('#') ? currentColor : '#000000'}
                onChange={(e) => {
                  setCurrentColor(e.target.value);
                }}
                className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                placeholder="#000000"
                value={currentColor}
                onChange={handleCustomColorInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCustomColorApply();
                  }
                }}
                className="flex-1 px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-gray-100"
                onClick={handleCustomColorApply}
                title="Áp dụng màu"
              >
                <Check className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <Separator className="my-1.5" />

          {/* Additional Formatting Options */}
          <div className="space-y-1">
            <button
              className="w-full text-left px-2 py-1 text-[10px] text-gray-700 hover:bg-gray-100 rounded transition-colors"
              type="button"
              onClick={() => {
                // Conditional formatting (placeholder)
              }}
            >
              Định dạng có điều kiện
            </button>
            <button
              className="w-full flex items-center gap-2 px-2 py-1 text-[10px] text-gray-700 hover:bg-gray-100 rounded transition-colors"
              type="button"
              onClick={() => setAlternatingColors(!alternatingColors)}
            >
              <div className={`w-3 h-3 border border-gray-400 rounded flex items-center justify-center ${alternatingColors ? 'bg-primary border-primary' : ''}`}>
                {alternatingColors && <Check className="h-2 w-2 text-white" />}
              </div>
              <span>Màu xen kẽ</span>
            </button>
          </div>
        </div>
    </div>
  );
}

export default ColorPicker;
