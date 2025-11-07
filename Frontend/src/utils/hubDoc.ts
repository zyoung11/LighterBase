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

const installIntro = document.getElementById('install-intro') as HTMLElement
if(installIntro && docs.install)
installIntro.innerHTML = await marked.parse(docs.install)

const installCreate = document.getElementById('install-create') as HTMLElement
if(installCreate && docs.installOps?.create)
installCreate.innerHTML = await marked.parse(docs.installOps.create)

const installDelete = document.getElementById('install-delete') as HTMLElement
if(installDelete && docs.installOps?.delete)
installDelete.innerHTML = await marked.parse(docs.installOps.delete)

const installUpdate = document.getElementById('install-update') as HTMLElement
if(installUpdate && docs.installOps?.update)
installUpdate.innerHTML = await marked.parse(docs.installOps.update)

const installSearch = document.getElementById('install-search') as HTMLElement
if(installSearch && docs.installOps?.search)
installSearch.innerHTML = await marked.parse(docs.installOps.search)

const tutorialsCont = document.getElementById('tutorials-cont') as HTMLElement
if(tutorialsCont && docs.tutorials)
tutorialsCont.innerHTML = await marked.parse(docs.tutorials)

