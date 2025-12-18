// 导入语言文件
import enTranslations from '../lang/en.json';
import zhTranslations from '../lang/zh.json';

// 国际化工具类
class I18n {
  private currentLang: string = 'en'; // 默认英文
  private translations: any = {
    en: enTranslations,
    zh: zhTranslations
  };

  constructor() {
    // 从 localStorage 获取保存的语言设置，默认为英文
    const savedLang = localStorage.getItem('language');
    if (savedLang && (savedLang === 'zh' || savedLang === 'en')) {
      this.currentLang = savedLang;
    }
    
    this.updatePageLanguage();
  }

  // 设置语言
  async setLanguage(lang: string) {
    if (lang === 'zh' || lang === 'en') {
      this.currentLang = lang;
      localStorage.setItem('language', lang);
      this.updatePageLanguage(); // 更新页面语言
    }
  }

  // 获取当前语言
  getCurrentLanguage(): string {
    return this.currentLang;
  }

  // 获取翻译文本
  t(key: string): string {
    if (!this.translations[this.currentLang]) {
      return key;
    }

    const keys = key.split('.');
    let value: any = this.translations[this.currentLang];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  }

// 更新页面语言
  private updatePageLanguage() {
    // 触发自定义事件，通知其他组件语言已更改
    window.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { language: this.currentLang }
    }));
  }

  // 切换语言
  async toggleLanguage() {
    const newLang = this.currentLang === 'zh' ? 'en' : 'zh';
    await this.setLanguage(newLang);
  }
}

// 创建全局实例
export const i18n = new I18n();

// 语言切换按钮组件
export function createLanguageSwitcher(): HTMLButtonElement {
  const switcher = document.createElement('button');
  switcher.id = 'language-switcher';
  switcher.style.backgroundColor = 'transparent';
  switcher.style.color = 'white';
  switcher.style.border = 'none';
  switcher.style.padding = '0.5rem 1rem';
  switcher.style.borderRadius = '0.5rem';
  switcher.style.cursor = 'pointer';
  switcher.style.fontWeight = '600';
  switcher.style.fontSize = '1.3rem';
  switcher.style.transition = 'transform 0.2s ease';
  switcher.style.marginRight = '6px';
  switcher.onmouseenter = () => {
    switcher.style.transform = 'scale(1.1)';
  };
  switcher.onmouseleave = () => {
    switcher.style.transform = 'scale(1)';
  };

  // 更新按钮文本
  const updateButtonText = () => {
    switcher.textContent = i18n.getCurrentLanguage() === 'zh' ? 'EN' : '中';
  };

  updateButtonText();

  // 点击切换语言
  switcher.addEventListener('click', () => {
    i18n.toggleLanguage();
    updateButtonText();
  });

  // 监听语言变化事件
  window.addEventListener('languageChanged', () => {
    updateButtonText();
  });

  return switcher;
}
