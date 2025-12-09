// hubDoc.ts

import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from 'highlight.js/lib/core'; 
import "./vs2015.css"
import sql from 'highlight.js/lib/languages/sql'; 
import plaintext from 'highlight.js/lib/languages/plaintext';
import json from 'highlight.js/lib/languages/json'; 
import bash from 'highlight.js/lib/languages/bash';
import javascript from 'highlight.js/lib/languages/javascript';

hljs.registerLanguage('sql', sql);
hljs.registerLanguage('plaintext', plaintext);
hljs.registerLanguage('json', json);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('shell', bash);

marked.use(markedHighlight({
  langPrefix: 'hljs language-',
  highlight(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext'; 
    return hljs.highlight(code, { language }).value;
  }
}));

const applyLazyLoading = (html: string): string => {
    return html.replace(/<img\s+([^>]*?)>/gi, (match, attrs) => {
        if (attrs.toLowerCase().includes('loading=')) {
            return match; 
        }
        return `<img loading="lazy" ${attrs}>`;
    });
};

(async () => {
  document.getElementById('fouc-fix')?.remove();

  // 动态导入并渲染 Intro 内容
  const { intro_md_content } = await import('../docs/intro_md_content'); 
  const introCont = document.getElementById('intro-cont') as HTMLElement;
  if (introCont) {
    const rawHtml = await marked.parse(intro_md_content);
    introCont.innerHTML = applyLazyLoading(rawHtml);
  }

  // 动态导入并渲染 Install 内容
  const { library_md_content } = await import('../docs/library_md_content');
  const installIntro = document.getElementById('install-intro') as HTMLElement;
  if (installIntro) {
    const rawHtml = await marked.parse(library_md_content);
    installIntro.innerHTML = applyLazyLoading(rawHtml);
  }

  // 动态导入并渲染 Tutorials 内容
  const { tutorial_md_content } = await import('../docs/tutorial_md_content');
  const tutorialsCont = document.getElementById('tutorials-cont') as HTMLElement;
  if (tutorialsCont) {
    const rawHtml = await marked.parse(tutorial_md_content);
    tutorialsCont.innerHTML = applyLazyLoading(rawHtml);
  }
})();
