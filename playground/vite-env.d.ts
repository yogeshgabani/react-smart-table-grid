/// <reference types="vite/client" />

/** Social links for the footer — see `.env.example`. Empty or missing → "Coming soon". */
interface ImportMetaEnv {
  readonly VITE_SOCIAL_WHATSAPP?: string;
  readonly VITE_SOCIAL_INSTAGRAM?: string;
  readonly VITE_SOCIAL_FACEBOOK?: string;
  readonly VITE_SOCIAL_YOUTUBE?: string;
  readonly VITE_SOCIAL_X?: string;
  readonly VITE_SOCIAL_LINKEDIN?: string;
  readonly VITE_SOCIAL_GITHUB?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
