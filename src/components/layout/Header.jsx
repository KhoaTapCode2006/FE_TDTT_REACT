import { useState } from "react";
import Icon from "@/components/ui/Icon";

const LANGS = [
  { code: "EN", flag: "🇺🇸", label: "English" },
  { code: "VI", flag: "🇻🇳", label: "Tiếng Việt" },
  { code: "ZH", flag: "🇨🇳", label: "简体中文" },
  { code: "JA", flag: "🇯🇵", label: "日本語" },
  { code: "IT", flag: "🇮🇹", label: "Italiano" },
  { code: "DE", flag: "🇩🇪", label: "Deutsch" },
];

function Header() {
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState(LANGS[0]);
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <header className="flex-none w-full z-50 glass shadow-editorial">
      <nav className="flex items-center justify-between px-6 py-3 max-w-screen-2xl mx-auto gap-4">
        <a
          href="/"
          className="text-2xl font-headline font-extrabold tracking-tighter text-primary whitespace-nowrap"
        >
          Booking4LU
        </a>

        <div className="hidden md:flex items-center gap-8">
          <a href="#" className="text-sm font-semibold text-primary border-b-2 border-secondary pb-0.5">
            Hotels
          </a>
          <a href="#" className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">
            Experiences
          </a>
          <a href="#" className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">
            Social
          </a>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangOpen((value) => !value)}
              className="flex items-center gap-1 p-2 rounded-full hover:bg-surface-container transition-colors"
            >
              <Icon name="language" className="text-primary" size={22} />
              <span className="text-xs font-bold text-primary">{lang.code}</span>
            </button>

            {langOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 glass rounded-xl shadow-editorial border border-outline-variant/20 z-50 overflow-hidden">
                <div className="p-2 flex flex-col gap-0.5">
                  {LANGS.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        setLang(item);
                        setLangOpen(false);
                      }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        lang.code === item.code ? "bg-surface-container-low" : "hover:bg-surface-container-low"
                      }`}
                    >
                      <span>{item.flag}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setAccountOpen((value) => !value)}
              className="flex items-center gap-2 rounded-full border border-outline-variant/30 px-3 py-2 text-sm font-semibold text-primary hover:bg-surface-container transition-colors"
            >
              <Icon name="person_outline" size={20} />
              Account
            </button>

            {accountOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 glass rounded-xl shadow-editorial border border-outline-variant/20 z-50 overflow-hidden">
                <div className="p-3 space-y-2">
                  <button
                    type="button"
                    onClick={() => setAccountOpen(false)}
                    className="w-full text-left rounded-xl px-3 py-2 text-sm font-medium text-primary hover:bg-surface-container-low"
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountOpen(false)}
                    className="w-full text-left rounded-xl px-3 py-2 text-sm font-medium text-primary hover:bg-surface-container-low"
                  >
                    Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;
