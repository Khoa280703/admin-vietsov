import React, { useState, useRef, useEffect } from 'react';
import { HiChevronDown } from 'react-icons/hi';

const unitWebsiteOptions = [
  { url: 'https://petrovietnam.pvn.vn', label: 'Tập đoàn Dầu khí Việt Nam' },
  { url: 'https://www.gazprom.ru', label: 'Gazprom' },
  { url: 'https://www.petronet.com.vn', label: 'Petronet' },
  { url: 'https://www.pvn.com.vn', label: 'PVN' },
];

const linkOptions = [
  { url: 'https://www.gov.vn', label: 'Cổng Thông tin Điện tử Chính phủ' },
  { url: 'https://www.most.gov.vn', label: 'Bộ Khoa học và Công nghệ' },
  { url: 'https://www.monre.gov.vn', label: 'Bộ Tài nguyên và Môi trường' },
  { url: 'https://www.pvn.vn', label: 'Tập đoàn Dầu khí Việt Nam' },
];

const PreFooter: React.FC = () => {
  const [isUnitWebsiteOpen, setIsUnitWebsiteOpen] = useState(false);
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const unitWebsiteRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        unitWebsiteRef.current &&
        !unitWebsiteRef.current.contains(event.target as Node)
      ) {
        setIsUnitWebsiteOpen(false);
      }
      if (linkRef.current && !linkRef.current.contains(event.target as Node)) {
        setIsLinkOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <footer className="bg-gray-100 py-12 border-t border-gray-200">
      <div className="mx-auto px-4 md:px-8 lg:px-16 w-full max-w-screen-2xl">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          <div className="flex flex-col md:flex-row items-center text-center md:text-left space-y-6 md:space-y-0 md:space-x-10">
            <button
              type="button"
              onClick={() => {}}
              className="cursor-pointer hover:opacity-80 transition-opacity duration-200"
            >
              <img
                src="/logo.png"
                alt="Vietsovpetro Logo"
                className="h-24 w-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </button>
            <div className="text-sm text-gray-600 space-y-2">
              <p className="font-medium text-base text-gray-800">
                Liên doanh Vietsovpetro
              </p>
              <p>
                105 Lê Lợi, P. Thắng Nhì, TP. Vũng Tàu, Tỉnh Bà Rịa-Vũng Tàu,
                Việt Nam
              </p>
              <p>Email: vspadmin@vietsov.com.vn</p>
              <p>Điện thoại: +84.254.3839871</p>
              <p>Fax: +84.254.3839657</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 items-end">
            <div ref={unitWebsiteRef} className="relative">
              <button
                onClick={() => setIsUnitWebsiteOpen(!isUnitWebsiteOpen)}
                className="flex items-center text-sm text-gray-700 font-medium px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Website đơn vị thành viên
                <HiChevronDown
                  className={`w-5 h-5 ml-2 text-gray-600 transition-transform ${
                    isUnitWebsiteOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isUnitWebsiteOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    {unitWebsiteOptions.map((option, index) => (
                      <a
                        key={index}
                        href={option.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600 transition-colors"
                        onClick={() => setIsUnitWebsiteOpen(false)}
                      >
                        {option.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div ref={linkRef} className="relative">
              <button
                onClick={() => setIsLinkOpen(!isLinkOpen)}
                className="flex items-center text-sm text-gray-700 font-medium px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Liên kết
                <HiChevronDown
                  className={`w-5 h-5 ml-2 text-gray-600 transition-transform ${
                    isLinkOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isLinkOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    {linkOptions.map((option, index) => (
                      <a
                        key={index}
                        href={option.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600 transition-colors"
                        onClick={() => setIsLinkOpen(false)}
                      >
                        {option.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PreFooter;

