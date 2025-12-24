import {URL} from "../apis/api";
import {jwtDecode} from "jwt-decode"
import auth from "../apis/auth"
import blocks from "./blocks";
import projects from "../hubUtils/projects";
import { EditorView, keymap, lineNumbers, highlightActiveLine } from "@codemirror/view";
import { EditorState,EditorSelection } from "@codemirror/state";
import { sql } from "@codemirror/lang-sql";
import { linter, Diagnostic } from "@codemirror/lint";
import { indentOnInput } from "@codemirror/language";
import { defaultKeymap, history } from "@codemirror/commands";
import sqliteParser from "sqlite-parser";


/**
 * 针对低带宽优化的图片压缩函数
 * @param imgSrc 图片源地址
 * @param maxWidth 最大宽度
 * @param quality 压缩质量 (0-1)
 * @returns 压缩后的base64图片
 */
 async function compressImage(
  imgSrc: string, 
  maxWidth: number = 150, 
  quality: number = 0.5
): Promise<string> {
  // 如果没有图片源，直接返回空字符串
  if (!imgSrc) return '';

  return new Promise<string>((resolve: (value: string) => void) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // 如果无法获取2d上下文，返回空字符串
      if (!ctx) {
        resolve('');
        return;
      }
      
      // 计算压缩后的尺寸
      let width: number = img.width;
      let height: number = img.height;
      
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 绘制压缩后的图片
      ctx.drawImage(img, 0, 0, width, height);
      
      // 转换为base64
      try {
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      } catch (error) {
        console.error('Canvas toDataURL failed:', error);
        resolve('');
      }
    };
    
    img.onerror = () => {
      // 压缩失败返回空字符串，让img标签的onerror处理
      resolve('');
    };
    
    img.src = imgSrc;
  });
}
    // 上传时压缩：400px宽度，0.7质量（保证一定的图片质量）
    // 项目卡片：120px宽度，0.4质量（小图，激进压缩）
    // 详情页面：300px宽度，0.6质量（中等尺寸，平衡质量和大小）





/**
 * 针对低带宽优化的图片压缩函数
 * @param token 获取存储在cookie里的token
 * @param tokenName 设置要更新的tokenName
 * @param targetPage 要跳转的网页
 * @returns 没有
 */
let isRefreshing = false;

async function checkAuthentication(token: string, tokenName: string, targetPage: string) {
  // if (!token || token == null || token === '') {
  //   window.location.href = `/${targetPage}`;
  //   return;
  // }

  try {
    const decoded = jwtDecode(token);
    const exp = Number(decoded.exp) * 1000; // 转换为毫秒
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000; // 5分钟的毫秒数

    if (exp && exp < now + fiveMinutes && exp > now) {
      
      if (isRefreshing) {
        return;
      }

      isRefreshing = true;
      // console.log("Token即将过期，尝试自动刷新...");

      try {
        let newToken = "";
        
        if (tokenName === "authToken") {
          newToken = await auth.reflashToken(URL, token);
        } else if (tokenName === "hubAuthToken") {
          newToken = await projects.refreshHubToken(URL, token);
        }

        if (newToken) {
          document.cookie = `${tokenName}=${newToken}; path=/;`;
          return
          // console.log("Token刷新成功");
        }
      } catch (refreshError) {
        // console.error("Token刷新失败", refreshError);
        window.location.href = `/${targetPage}`;
        return
      } finally {
        isRefreshing = false;
      }
    
    } else if (exp && exp <= now) {
      blocks.popupConfirm("token已经过期，请重新登录");
      window.location.href = `/${targetPage}`;
      return
    }

  } catch (e) {
    console.error("token解析失败", e);
    window.location.href = `/${targetPage}`;
    return
  }
}



 function getCookie(name:string) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
  }


function parseJwt(token: string) {
        try {
          const base64Url = token.split('.')[1];
const base64 = (base64Url || '').replace(/-/g, '+').replace(/_/g, '/');
const jsonPayload = decodeURIComponent(atob(base64 || '').split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          return JSON.parse(jsonPayload);
        } catch (e) {
          console.error('Token parsing failed:', e);
          return null;
        }
      }


let sqlEditorView: EditorView | null = null;

/**
 * 初始化 SQL 编辑器
 * 使用极简配置，不加载额外的主题包，手写 CSS 适配深色模式
 */
function initSqlEditor(isFullReadOnly: boolean, readOnlyLength: number, initialDoc: string = "") {
  const parent = document.getElementById("sql-input-wrapper");
  if (!parent) return;

  // 如果已经初始化过，先销毁
  if (sqlEditorView) {
    sqlEditorView.destroy();
  }

  parent.innerHTML = '';

  // 定义匹配你 UI 的样式 (替代主题包)
  const customTheme = EditorView.theme({
    "&": {
      height: "100%", // 填满父容器
      fontSize: "14px",
      backgroundColor: "#2B2F31", // 匹配你的 bg-[#2B2F31]
      color: "#d4d4d4",          // 浅灰字体
    },
    ".cm-scroller": {
      overflow: "auto",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    },
    ".cm-content": {
      padding: "16px", // 对应原来的 p-4
      minHeight: "100%"
    },
    ".cm-focused": {
      outline: "none" // 去掉默认的蓝色聚焦框
    },
    // 关键字颜色
    ".cm-keyword": { color: "#569CD6" },
    // 字符串颜色
    ".cm-string": { color: "#CE9178" },
    // 数字颜色
    ".cm-number": { color: "#B5CEA8" },
    // 注释颜色
    ".cm-comment": { color: "#6A9955" },
    // 光标颜色
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground": {
      backgroundColor: "#264F78"
    },
    // 错误下划线样式
    ".cm-lintRange-error": { backgroundColor: "rgba(255, 0, 0, 0.2)" }
  }, { dark: true });

  // SQL Linter

  // const sqlLinter = linter((view) => {
  //   const diagnostics: Diagnostic[] = [];
  //   const sql = view.state.doc.toString();
  //   try {
  //     sqliteParser(sql);
  //   } catch (e) {
  //     // 如果解析失败，标记整个文档为错误（简化处理）
  //     diagnostics.push({
  //       from: 0,
  //       to: sql.length,
  //       severity: "error",
  //       message: "SQL syntax error"
  //     });
  //   }
  //   return diagnostics;
  // });


const READ_ONLY_LINES = 10;   // 前 10 行为只读样板

// const sqlLinter = linter((view) => {
//   const diagnostics: Diagnostic[] = [];
//   const sql = view.state.doc.toString();

//   try {
//     sqliteParser(sql);
//   } catch (e: any) {
//     console.log('[sqlite-parser] error object:', e);
//     let errOffset = Number(e.offset ?? 0);
//     if (Number.isNaN(errOffset) || errOffset < 0) return diagnostics;

//     // 关键修复：offset 往回退 1，保证落在真正出错的那一行
//     if (errOffset > 0) errOffset -= 1;

//     const line = view.state.doc.lineAt(errOffset);

//     // 整行标红
//     diagnostics.push({
//       from: line.from,
//       to: line.to,
//       severity: 'error',
//       message:
//         line.number > READ_ONLY_LINES
//           ? e.message || 'SQL syntax error'
//           : '只读区域受到编辑区语法影响，请检查下方输入'
//     });
//   }

//   return diagnostics;
// });



  // 严格的前缀只读保护逻辑
  const transactionFilter = EditorState.transactionFilter.of((tr) => {
    // 1. 如果标记为全局只读，直接拦截
    if (isFullReadOnly) return false;

    const docLength = tr.startState.doc.length;
    
    // 2. 防止光标移入只读区域 (包括点击、键盘移动、选区变化)
    // 只要有光标移动，就检查是否所有光标都在安全区之后
    if (tr.selection) {
      for (const range of tr.selection.ranges) {
        // 如果光标头部 或 尾部 小于只读长度，拦截！
        if (range.head < readOnlyLength || range.anchor < readOnlyLength) {
          return false;
        }
      }
    }

    // 3. 拦截文档内容的修改
    if (tr.docChanged) {
      // 获取所有的变更范围
      // tr.changes.iterChanges(...) 可以遍历所有改动，这里我们简化处理：
      // 只要变更的起始位置 小于 只读长度，就认为是侵犯了只读区
    
      // 更严谨的做法：检查每个具体的变更
      // 注意：如果在只读区后面插入内容，会导致只读区后面的内容后移，
      // 但这不算修改只读区本身。
      
      // CodeMirror 的 tr.changes 并不直接暴露 "from" 属性来遍历，
      // 我们通过 mapping 来判断原始位置是否被触碰
      const isReadonlyTouched = tr.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
        // fromA 是旧文档中的起始位置
        // 如果旧文档的起始位置在只读范围内，或者变更跨越了只读边界，则拦截
        // 简单逻辑：如果 fromA < readOnlyLength，那就是动了只读区
        return fromA < readOnlyLength;
      });

      if (isReadonlyTouched) return false;
    }

    // 通过检查，允许事务
    return tr;
  });

  // 4. 额外的光标修正（初始化时）
  // 确保初始化时光标一定在末尾，防止万一
  const initialSelection = EditorSelection.cursor(initialDoc.length);


const customKeymap = keymap.of([
  {
    key: "Enter",
    run: (view) => {
      // 触发渲染事件
      const event = new CustomEvent('manual-render-trigger', {
        bubbles: true,
        detail: { sql: view.state.doc.toString() }
      });
      view.dom.dispatchEvent(event);
      return true; // 阻止默认换行
    }
  }
]);




  sqlEditorView = new EditorView({
    doc: initialDoc,
    selection: initialSelection, 
    extensions: [
      lineNumbers(), // 行号
      highlightActiveLine(), // 高亮当前行
      indentOnInput(), // 输入时自动缩进
      sql(),      // SQL 高亮和补全
      customTheme, // 手写的轻量级深色主题
      EditorView.lineWrapping, // 自动换行
      customKeymap, 
      keymap.of(defaultKeymap), // 默认键盘映射，包括Enter换行
      history(),  // 历史记录
      transactionFilter,
      // sqlLinter   // SQL 语法检查
    ],
    parent: parent
  });

  // 设置光标到文档末尾，允许在后面输入
  sqlEditorView.dispatch({
    selection: { anchor: initialDoc.length, head: initialDoc.length }
  });

  // 聚焦编辑器
  sqlEditorView.focus();
}

/**
 * 获取编辑器内容的辅助函数
 */
function getSqlValue(): string {
  return sqlEditorView ? sqlEditorView.state.doc.toString() : "";
}

/**
 * 设置编辑器内容的辅助函数
 */
function setSqlValue(value: string) {
  if (sqlEditorView) {
    sqlEditorView.dispatch({
      changes: { from: 0, to: sqlEditorView.state.doc.length, insert: value }
    });
  }
}




export {
  compressImage,
  checkAuthentication,
  getCookie,
  parseJwt,
  initSqlEditor,
  getSqlValue,
  setSqlValue

}
