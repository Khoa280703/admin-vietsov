import React from 'react';

interface KeywordsProps {
  tags: string[];
  tagColor?: string;
  tagTextColor?: string;
}

const Keywords: React.FC<KeywordsProps> = ({
  tags,
  tagColor = 'gray-300',
  tagTextColor = '',
}) => {
  return (
    <div className="py-4">
      <div className="flex items-center flex-wrap gap-2">
        <span className="font-medium text-sm">Từ khóa:</span>
        {tags.map((tag, index) => (
          <a
            key={index}
            href="#"
            className={`text-xs bg-${tagColor} ${
              tagTextColor ? `text-${tagTextColor}` : 'text-gray-700'
            } px-3 py-1 rounded-md hover:bg-green-600 hover:text-white transition-colors`}
          >
            {tag}
          </a>
        ))}
      </div>
    </div>
  );
};

export default Keywords;

