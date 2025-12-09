import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from 'highlight.js';
import { createLoader } from "../modules/loader";

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
  // const loader = createLoader();
  // loader.show();
  
  // 移除 docs.html 中隐藏 body 的 FOUC 样式
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

  // 所有内容加载和渲染完成后，隐藏加载器
  // loader.hide(); 
})();
