export type LocaleSeed = {
  code: string;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
};

export const LOCALES: readonly LocaleSeed[] = [
  { code: 'en',    name: 'English',             nativeName: 'English',            dir: 'ltr' },
  { code: 'fr',    name: 'French',              nativeName: 'Français',           dir: 'ltr' },
  { code: 'es',    name: 'Spanish',             nativeName: 'Español',            dir: 'ltr' },
  { code: 'de',    name: 'German',              nativeName: 'Deutsch',            dir: 'ltr' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', dir: 'ltr' },
  { code: 'ja',    name: 'Japanese',            nativeName: '日本語',               dir: 'ltr' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文',           dir: 'ltr' },
  { code: 'ar',    name: 'Arabic',              nativeName: 'العربية',            dir: 'rtl' },
];
