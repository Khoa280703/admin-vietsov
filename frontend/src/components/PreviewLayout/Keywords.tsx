import React from 'react';

interface Tag {
  id?: number;
  name: string;
  slug?: string;
}

interface KeywordsProps {
  tags: (string | Tag)[];
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
        {tags.map((tag, index) => {
          // Handle both string and object tags
          const tagName = typeof tag === 'string' ? tag : tag.name;
          const tagId = typeof tag === 'object' ? tag.id : index;
          
          return (
            <a
              key={tagId || index}
              href="#"
              className={`text-xs bg-${tagColor} ${
                tagTextColor ? `text-${tagTextColor}` : 'text-gray-700'
              } px-3 py-1 rounded-md hover:bg-green-600 hover:text-white transition-colors`}
            >
              {tagName}
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default Keywords;

