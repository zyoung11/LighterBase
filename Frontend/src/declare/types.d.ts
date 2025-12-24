declare module '*.html?raw' {
  const content: string;
  export default content;
}

declare module '*.html' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

interface ImportMeta {
  glob(pattern: string, options?: { as?: string }): Record<string, () => string>;
}