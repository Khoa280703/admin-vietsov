import React from 'react';
import Header from './Header';
import Navigation from './Navigation';
import PageHeader from './PageHeader';
import PageWithSidebar from './PageWithSidebar';
import PreFooter from './PreFooter';
import Footer from './Footer';
import DetailContent from './DetailContent';
import Keywords from './Keywords';
import type { Editor } from '@tiptap/react';

interface PreviewLayoutProps {
  title: string;
  subtitle?: string;
  category?: string;
  timestamp?: string;
  excerpt?: string;
  author?: string;
  featuredImage?: string;
  editor: Editor | null;
  tags?: string[];
  activePath?: string;
  sidebarContent?: React.ReactNode;
}

const PreviewLayout: React.FC<PreviewLayoutProps> = ({
  title,
  subtitle,
  category,
  timestamp,
  excerpt,
  author,
  featuredImage,
  editor,
  tags = [],
  activePath = '/tintuc/hoat-dong-doan-the',
  sidebarContent,
}) => {
  return (
    <div className="min-h-screen bg-white relative">
      <div className="sticky top-0 z-50">
        <Header />
        <Navigation activeItem="Tin tức" />
      </div>
      <PageHeader
        title={category || 'Tin tức'}
        breadcrumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: category || 'Tin tức' },
        ]}
      />
      <PageWithSidebar activePath={activePath} sidebarContent={sidebarContent}>
        <DetailContent
          title={title}
          subtitle={subtitle}
          category={category}
          timestamp={timestamp}
          excerpt={excerpt}
          author={author}
          featuredImage={featuredImage}
          editor={editor}
        />
        {tags.length > 0 && (
          <Keywords tags={tags} tagColor="gray-300" tagTextColor="" />
        )}
      </PageWithSidebar>
      <PreFooter />
      <Footer />
    </div>
  );
};

export default PreviewLayout;

