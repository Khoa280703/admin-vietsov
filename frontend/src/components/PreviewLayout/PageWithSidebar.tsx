import React, { useState } from 'react';
import { HiChevronDoubleLeft, HiChevronDoubleRight } from 'react-icons/hi';
import SidebarNavigation from './SidebarNavigation';

interface PageWithSidebarProps {
  children: React.ReactNode;
  activePath?: string;
  sidebarContent?: React.ReactNode;
}

const PageWithSidebar: React.FC<PageWithSidebarProps> = ({
  children,
  activePath,
  sidebarContent,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="py-8 md:py-16 lg:py-12 mx-auto px-4 md:px-8 lg:px-16 w-full max-w-screen-2xl">
      <div className="flex justify-end pb-4 lg:pb-6">
        <button
          type="button"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:text-green-600 hover:border-green-600 transition-colors cursor-pointer"
        >
          {isSidebarOpen ? (
            <>
              Thu gọn danh mục
              <HiChevronDoubleLeft className="h-4 w-4" />
            </>
          ) : (
            <>
              Mở danh mục
              <HiChevronDoubleRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      <div
        className={`grid grid-cols-1 gap-8 lg:gap-8 ${
          isSidebarOpen
            ? 'lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]'
            : 'lg:grid-cols-1'
        }`}
      >
        <div>{children}</div>
        {isSidebarOpen && (
          <div>
            <SidebarNavigation activePath={activePath} />
            {sidebarContent && (
              <div className="space-y-4 lg:space-y-3">{sidebarContent}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageWithSidebar;

