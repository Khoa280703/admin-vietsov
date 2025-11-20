import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const languages = [
    { value: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
    { value: "ru", label: "Русский", flag: "🇷🇺" },
    { value: "en", label: "English", flag: "🇺🇸" },
  ];

  const currentValue =
    languages.find((lang) => lang.value === i18n.language)?.value ||
    languages.find((lang) => lang.value === i18n.language.split("-")[0])
      ?.value ||
    "vi";

  const handleChange = (value: string) => {
    i18n.changeLanguage(value);
    localStorage.setItem("language", value);
  };

  const currentLanguage =
    languages.find((lang) => lang.value === currentValue) ?? languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 font-normal"
        >
          <Globe className="h-4 w-4" />
          <span className="flex items-center gap-2">
            <span>{currentLanguage.flag}</span>
            <span>{currentLanguage.label}</span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.value}
            onSelect={(event) => {
              event.preventDefault();
              handleChange(lang.value);
            }}
          >
            <span className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LanguageSwitcher;
