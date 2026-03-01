/// <reference types="vite/client" />

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module 'country-flag-icons/svg/3x2/*.svg' {
  const content: string;
  export default content;
}
