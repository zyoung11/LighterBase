import { marked } from "marked";
import { markedHighlight } from "marked-highlight"; // 如果使用 marked-highlight 扩展
import hljs from 'highlight.js';
import 'highlight.js/styles/vs2015.css';
import intro from '../docs/intro.md';
import library from '../docs/library.md';
import tutorial from '../docs/tutorial.md';

marked.use(markedHighlight({
  langPrefix: 'hljs language-',
  highlight(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  }
}));

const loadMd = async (path: string) => {
  const response = await fetch(path);
  const text = await response.text();
  return marked.parse(text);
};

(async () => {
  const introCont = document.getElementById('intro-cont') as HTMLElement;
  if (introCont) {
    introCont.innerHTML = await loadMd(intro);
  }

  const installIntro = document.getElementById('install-intro') as HTMLElement;
  if (installIntro) {
    installIntro.innerHTML = await loadMd(library);
  }

  const tutorialsCont = document.getElementById('tutorials-cont') as HTMLElement;
  if (tutorialsCont) {
    tutorialsCont.innerHTML = await loadMd(tutorial);
  }
})();

