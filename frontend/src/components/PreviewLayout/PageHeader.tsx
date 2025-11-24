import React from 'react';
import { HiChevronRight, HiHome } from 'react-icons/hi';

interface ImageModule {
  src: string;
  height?: number;
  width?: number;
  blurDataURL?: string;
}

interface PageHeaderProps {
  title?: string;
  backgroundImage?: ImageModule | string;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  backgroundImage,
  breadcrumbs,
}) => {
  const pageName = title || 'Tin tức';
  const defaultBreadcrumbs = [
    { label: 'Trang chủ', href: '/' },
    { label: pageName },
  ];

  const finalBreadcrumbs = breadcrumbs || defaultBreadcrumbs;
  const bgUrl =
    typeof backgroundImage === 'string'
      ? backgroundImage
      : backgroundImage?.src;

  return (
    <div className="relative">
      <div
        className="relative h-96 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: bgUrl ? `url(${bgUrl})` : undefined,
          backgroundColor: bgUrl ? undefined : '#4e9a5a',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#3a3a6e]/80 to-[#4e9a5a]/80 z-0"></div>

        <div className="relative z-10 h-full flex flex-col justify-center">
          <div className="mx-auto px-4 md:px-8 lg:px-16 w-full max-w-screen-2xl">
            <nav className="flex items-center space-x-2 text-sm text-white mb-4">
              <HiHome className="w-4 h-4" />
              {finalBreadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <HiChevronRight className="w-4 h-4" />}
                  {crumb.href ? (
                    <a
                      href={crumb.href}
                      className="hover:text-green-300 transition-colors cursor-pointer"
                    >
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-green-300 font-medium">
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </nav>

            <h1 className="text-4xl font-bold text-white">{pageName}</h1>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;

