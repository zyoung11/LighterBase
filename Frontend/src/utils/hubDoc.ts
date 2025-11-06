import { marked } from "marked";
import { markedHighlight } from "marked-highlight"; // 如果使用 marked-highlight 扩展
import hljs from 'highlight.js';
import 'highlight.js/styles/vs2015.css';
import docs from "./hubContents";

marked.use(markedHighlight({
  langPrefix: 'hljs language-',
  highlight(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  }
}));

const introCont = document.getElementById('intro-cont') as HTMLElement
// console.log(docs.intro)
if(introCont)
introCont.innerHTML = await marked.parse(docs.intro)

