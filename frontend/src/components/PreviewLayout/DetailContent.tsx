import React from 'react';
import { motion } from 'framer-motion';
import { EditorContent } from '@tiptap/react';
import type { Editor } from '@tiptap/react';

export interface DetailContentProps {
  title: string;
  subtitle?: string;
  category?: string;
  status?: string;
  timestamp?: string;
  description?: string;
  excerpt?: string;
  author?: string;
  featuredImage?: string;
  editor?: Editor | null;
  showOverviewSection?: boolean;
  overviewTitle?: string;
}

const DetailContent: React.FC<DetailContentProps> = ({
  title,
  subtitle,
  category,
  status,
  timestamp,
  description,
  excerpt,
  author,
  featuredImage,
  editor,
  showOverviewSection = false,
  overviewTitle = 'Tổng quan dự án',
}) => {
  return (
    <div className="min-h-screen">
      <div className="overflow-hidden">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Featured Image */}
          {featuredImage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-8 -mx-4 md:-mx-8"
            >
              <img
                src={featuredImage}
                alt={title}
                className="w-full h-64 md:h-96 object-cover rounded-lg"
              />
            </motion.div>
          )}

          <header className="mb-8">
            {(category || status) && (
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                {category && (
                  <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                    {category}
                  </span>
                )}
                {status && (
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      status === 'Đang thực hiện'
                        ? 'bg-blue-100 text-blue-800'
                        : status === 'Hoàn thành'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {status}
                  </span>
                )}
              </div>
            )}

            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight mb-4">
              {title}
            </h1>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-xl md:text-2xl text-gray-600 mb-4 italic">
                {subtitle}
              </p>
            )}

            {/* Author and Timestamp */}
            {(author || timestamp) && (
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                {author && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Tác giả:</span>
                    <span>{author}</span>
                  </div>
                )}
                {timestamp && author && <span>•</span>}
                {timestamp && (
                  <div className="flex items-center gap-2">
                    <span>{timestamp}</span>
                  </div>
                )}
              </div>
            )}

            {/* Excerpt */}
            {excerpt && (
              <div className="bg-gray-50 border-l-4 border-green-600 p-4 mb-6 rounded-r-md">
                <p className="text-lg text-gray-700 italic leading-relaxed">
                  {excerpt}
                </p>
              </div>
            )}

            <hr className="my-6 border-gray-200" />
          </header>

          {showOverviewSection && description && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {overviewTitle}
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                {description}
              </p>
            </div>
          )}

          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-4 mb-8 article-content">
            {editor ? (
              <EditorContent editor={editor} />
            ) : (
              <p className="text-muted-foreground">Loading content...</p>
            )}
          </div>
        </motion.article>
      </div>
    </div>
  );
};

export default DetailContent;

