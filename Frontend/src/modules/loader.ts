// loader.ts

/**
 * 包含点状旋转动画所需关键帧和类选择器的 CSS 样式
 * 颜色和尺寸已通过 CSS 变量设置，易于调整。
 */
const LOADER_CSS = `
  /* CSS 变量用于定制 */
  :root {
      /* 动画尺寸 */
      --uib-size: 3.4rem;
      /* 动画速度 */
      --uib-speed: 0.9s; 
      /* 点的颜色 (浅灰色) */
      --uib-color: #D1D5DB; 
      /* 阴影颜色 (透明浅灰色) */
      --uib-shadow-color: rgba(209, 213, 219, 0.1); 
  }

  .dot-spinner {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    height: var(--uib-size);
    width: var(--uib-size);
  }

  .dot-spinner__dot {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    height: 100%;
    width: 100%;
  }

  /* 使用伪元素创建动画点 */
  .dot-spinner__dot::before {
    content: "";
    height: 20%;
    width: 20%;
    border-radius: 50%;
    background-color: var(--uib-color);
    transform: scale(0);
    opacity: 0.5;
    animation: pulse0112 calc(var(--uib-speed) * 1.111) ease-in-out infinite;
    box-shadow:
      0 0 20px var(--uib-shadow-color),
      inset 2px 2px 2px #fff,
      inset -2px -2px 2px #4442;
  }
  
  /* 旋转和动画延迟 */
  .dot-spinner__dot:nth-child(2) { transform: rotate(45deg); }
  .dot-spinner__dot:nth-child(2)::before { animation-delay: calc(var(--uib-speed) * -0.875); }

  .dot-spinner__dot:nth-child(3) { transform: rotate(90deg); }
  .dot-spinner__dot:nth-child(3)::before { animation-delay: calc(var(--uib-speed) * -0.75); }

  .dot-spinner__dot:nth-child(4) { transform: rotate(135deg); }
  .dot-spinner__dot:nth-child(4)::before { animation-delay: calc(var(--uib-speed) * -0.625); }

  .dot-spinner__dot:nth-child(5) { transform: rotate(180deg); }
  .dot-spinner__dot:nth-child(5)::before { animation-delay: calc(var(--uib-speed) * -0.5); }

  .dot-spinner__dot:nth-child(6) { transform: rotate(225deg); }
  .dot-spinner__dot:nth-child(6)::before { animation-delay: calc(var(--uib-speed) * -0.375); }

  .dot-spinner__dot:nth-child(7) { transform: rotate(270deg); }
  .dot-spinner__dot:nth-child(7)::before { animation-delay: calc(var(--uib-speed) * -0.25); }

  .dot-spinner__dot:nth-child(8) { transform: rotate(315deg); }
  .dot-spinner__dot:nth-child(8)::before { animation-delay: calc(var(--uib-speed) * -0.125); }
  
  /* 关键帧定义 */
  @keyframes pulse0112 {
    0%,
    100% {
      transform: scale(0);
      opacity: 0.5;
      box-shadow:
        0 0 0px var(--uib-shadow-color),
        inset 0px 0px 0px #fff,
        inset -0px -0px 0px #4442;
    }

    50% {
      transform: scale(1);
      opacity: 1;
      box-shadow:
        0 0 20px var(--uib-shadow-color),
        inset 2px 2px 2px #fff,
        inset -2px -2px 2px #4442;
    }
  }
`;

/**
 * 注入 CSS 关键帧动画到文档头部。
 */
function injectLoaderStyles(): void {
  if (document.getElementById('loader-styles')) {
    return;
  }
  const styleTag = document.createElement('style');
  styleTag.id = 'loader-styles';
  styleTag.textContent = LOADER_CSS;
  document.head.appendChild(styleTag);
}

/**
 * 创建点状旋转加载动画的 DOM 结构。
 */
function createLoaderElement(): HTMLElement {
  const container = document.createElement('div');
  container.id = 'global-loader-wrapper';
  // 覆盖整个屏幕，居中，使用固定定位，高 z-index
  container.className = 'fixed inset-0 flex items-center justify-center bg-[#121414] transition-opacity duration-300 z-[9999]';
  
  const wrapper = document.createElement('div');
  // 应用 .dot-spinner 类名
  wrapper.className = 'dot-spinner'; 
  
  // 循环创建 8 个 dot-spinner__dot 元素
  for (let i = 0; i < 8; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot-spinner__dot'; 
    wrapper.appendChild(dot);
  }

  container.appendChild(wrapper);
  return container;
}

/**
 * 全局加载器管理器。
 * @param element 要将加载器添加到哪个父元素，默认为 document.body。
 * @returns 包含 show() 和 hide() 方法的对象。
 */
export function createLoader(element: HTMLElement = document.body) {
  injectLoaderStyles();
  const loaderEl = createLoaderElement();
  
  loaderEl.style.display = 'none';
  loaderEl.style.opacity = '0'; 
  element.appendChild(loaderEl);

  return {
    /** 显示加载动画 */
    show: () => {
      loaderEl.style.display = 'flex';
      setTimeout(() => {
        loaderEl.style.opacity = '1';
      }, 10);
    },
    /** 隐藏并移除加载动画 */
    hide: () => {
      loaderEl.style.opacity = '0';
      setTimeout(() => {
        loaderEl.style.display = 'none';
      }, 300);
    },
    /** 获取加载器 DOM 元素 */
    getElement: () => loaderEl,
  };
}


// if (typeof window !== 'undefined') {
//   (window as any).createLoader = createLoader;
// }
// --- 在 docs.html 中使用示例 ---
// 以下代码应放在一个新的 <script> 标签中，或作为 hubConponents.ts 的一部分。

/* document.addEventListener('DOMContentLoaded', () => {
  const loader = createLoader(); // 创建并注入加载器

  // 1. 在页面内容开始加载前立即显示加载器
  loader.show(); 

  // 2. 页面加载完成后（例如，所有图片、脚本等都加载完毕），隐藏加载器。
  // 注意：DOMContentLoaded 仅等待 DOM 结构就绪，load 事件等待所有资源（图片等）就绪。
  window.addEventListener('load', () => {
    loader.hide(); 
  });
});
*/
