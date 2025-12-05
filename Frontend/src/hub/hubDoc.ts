import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from 'highlight.js';
// import 'highlight.js/styles/vs2015.css';

import { 
  intro_md_content, 
  library_md_content, 
  tutorial_md_content 
} from './generated_assets'; 

marked.use(markedHighlight({
  langPrefix: 'hljs language-',
  highlight(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  }
}));


// const loadMd = (mdContent: string): string => {
//   return marked.parse(mdContent);
// };

(async () => {

  const introCont = document.getElementById('intro-cont') as HTMLElement;
  if (introCont) {
    introCont.innerHTML =await marked.parse(intro_md_content);
  }

  const installIntro = document.getElementById('install-intro') as HTMLElement;
  if (installIntro) {
    installIntro.innerHTML =await marked.parse(library_md_content);
  }

  const tutorialsCont = document.getElementById('tutorials-cont') as HTMLElement;
  if (tutorialsCont) {
    tutorialsCont.innerHTML =await marked.parse(tutorial_md_content);
  }
})();
