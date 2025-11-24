import React, { useState } from 'react';
import { HiMenu, HiX, HiOutlineLocationMarker } from 'react-icons/hi';
import { useTranslation } from 'react-i18next';

// Flag URLs
const russianFlagUrl = 'https://flagcdn.com/w40/ru.png';
const englishFlagUrl = 'https://flagcdn.com/w40/gb.png';
const vietnameseFlagUrl = 'https://flagcdn.com/w40/vn.png';

// Language configuration
const languages = [
  {
    code: 'VI',
    i18nCode: 'vi',
    label: 'VI',
    flag: vietnameseFlagUrl,
    name: 'Tiếng Việt',
  },
  {
    code: 'EN',
    i18nCode: 'en',
    label: 'EN',
    flag: englishFlagUrl,
    name: 'English',
  },
  {
    code: 'RU',
    i18nCode: 'ru',
    label: 'RU',
    flag: russianFlagUrl,
    name: 'Русский',
  },
];

const i18nToUICode: Record<string, string> = {
  vi: 'VI',
  en: 'EN',
  ru: 'RU',
};

interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { i18n } = useTranslation();

  const currentLanguageCode = i18nToUICode[i18n.language] || 'VI';
  const availableLanguages = languages.filter(
    (lang) => lang.code !== currentLanguageCode
  );

  const handleLanguageChange = (uiCode: string) => {
    const language = languages.find((lang) => lang.code === uiCode);
    if (language) {
      i18n.changeLanguage(language.i18nCode);
    }
  };

  return (
    <header className="sticky top-0 left-0 right-0 bg-gradient-to-r from-green-600 to-green-800 text-white shadow-lg z-50">
      <div className="mx-auto px-4 md:px-8 lg:px-16 py-2 w-full max-w-screen-2xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center lg:space-x-4">
            <button
              className="hidden lg:flex items-center space-x-2 hover:text-gray-300 transition-colors cursor-pointer"
              onClick={() => {}}
            >
              <HiOutlineLocationMarker className="w-4 h-4" />
              <span className="font-medium text-sm">Liên hệ</span>
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden hover:text-gray-300 transition-colors cursor-pointer"
            >
              {isMenuOpen ? (
                <HiX className="w-5 h-5" />
              ) : (
                <HiMenu className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="hidden lg:flex items-center space-x-4">
            <span className="font-medium text-sm">Ngôn ngữ</span>
            <div className="flex items-center space-x-2">
              {availableLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className="flex items-center space-x-1 px-2 py-1 rounded transition-colors cursor-pointer hover:bg-white/10"
                >
                  <span className="font-bold text-xs uppercase mr-2">
                    {lang.label}
                  </span>
                  <img
                    src={lang.flag}
                    alt={`${lang.name} Flag`}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <nav className="lg:hidden mt-4 text-left space-y-3">
            <div className="flex items-center space-x-4 mb-4">
              <span className="font-medium text-sm">Ngôn ngữ:</span>
              <div className="flex items-center space-x-2">
                {availableLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className="flex items-center space-x-1 px-2 py-1 rounded transition-colors cursor-pointer hover:bg-white/10"
                  >
                    <span className="font-bold text-[11px] uppercase">
                      {lang.label}
                    </span>
                    <img
                      src={lang.flag}
                      alt={`${lang.name} Flag`}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
            <button
              className="flex items-center space-x-2 py-2 hover:bg-white/10 rounded px-2 w-full text-left cursor-pointer"
              onClick={() => {}}
            >
              <HiOutlineLocationMarker className="w-4 h-4" />
              <span className="font-medium text-sm">Liên hệ</span>
            </button>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;

