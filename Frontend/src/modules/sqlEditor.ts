import { EditorView, keymap, lineNumbers, highlightActiveLine } from "@codemirror/view";
import { EditorState, EditorSelection } from "@codemirror/state";
import { sql } from "@codemirror/lang-sql";
import { indentOnInput } from "@codemirror/language";
import { defaultKeymap, history } from "@codemirror/commands";

let sqlEditorView: EditorView | null = null;

/**
 * 初始化 SQL 编辑器
 * 使用极简配置，不加载额外的主题包，手写 CSS 适配深色模式
 */
export function initSqlEditor(
  isFullReadOnly: boolean,
  readOnlyLength: number,
  initialDoc: string = "",
  containerId: string = "sql-input-wrapper",
  onEnter?: (sql: string) => void
) {
  const parent = document.getElementById(containerId);
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

  const READ_ONLY_LINES = 10;   // 前 10 行为只读样板

  // 严格的前缀只读保护逻辑
  const transactionFilter = EditorState.transactionFilter.of((tr) => {
    // 1. 如果标记为全局只读，直接拦截
    if (isFullReadOnly) return [];

    // 2. 防止光标移入只读区域 (包括点击、键盘移动、选区变化)
    // 只要有光标移动，就检查是否所有光标都在安全区之后
    if (tr.selection) {
      for (const range of tr.selection.ranges) {
        // 如果光标头部 或 尾部 小于只读长度，拦截！
        if (range.head < readOnlyLength || range.anchor < readOnlyLength) {
          return [];
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
      let isReadonlyTouched = false;
      tr.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
        // fromA 是旧文档中的起始位置
        // 如果旧文档的起始位置在只读范围内，或者变更跨越了只读边界，则拦截
        // 简单逻辑：如果 fromA < readOnlyLength，那就是动了只读区
        if (fromA < readOnlyLength) {
          isReadonlyTouched = true;
        }
      });

      if (isReadonlyTouched) return [];
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
        if (onEnter) {
          onEnter(view.state.doc.toString());
          return true; // 阻止默认换行
        }
        return false;
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
export function getSqlValue(): string {
  return sqlEditorView ? sqlEditorView.state.doc.toString() : "";
}

/**
 * 设置编辑器内容的辅助函数
 */
export function setSqlValue(value: string) {
  if (sqlEditorView) {
    sqlEditorView.dispatch({
      changes: { from: 0, to: sqlEditorView.state.doc.length, insert: value }
    });
  }
}

/**
 * 销毁编辑器
 */
export function destroySqlEditor() {
  if (sqlEditorView) {
    sqlEditorView.destroy();
    sqlEditorView = null;
  }
}