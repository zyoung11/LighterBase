import projects from './projects';
import logoIcon from '../icons/logoWhite.png';
import windowsIcon from '../icons/windows-black.svg';
import linuxIcon from '../icons/linux-black.svg';
import blocks from '../modules/blocks'
// 初始化页面图片
function initializeImages() {
  const logoImg = document.getElementById('logoImg') as HTMLImageElement;
  const windowsImg = document.getElementById('windowsImg') as HTMLImageElement;
  const linuxImg = document.getElementById('linuxImg') as HTMLImageElement;
  const contactLogoImg = document.getElementById('contactLogoImg') as HTMLImageElement;

  if (logoImg) {
    logoImg.src = logoIcon;
  }
  if (windowsImg) {
    windowsImg.src = windowsIcon;
  }
  if (linuxImg) {
    linuxImg.src = linuxIcon;
  }
  if (contactLogoImg) {
    contactLogoImg.src = logoIcon;
  }
}

// 下载应用功能
async function downloadApp(os: string) {
  const confirmed = await blocks.popupConfirm(`确定要下载 ${os === 'windows' ? 'Windows' : 'Linux'} 版本的 LighterBase 吗？`);
  if (!confirmed) {
    return;
  }
  
  try {
    const success = await projects.downloadApp(os);
    if (!success) {
      blocks.popupConfirm('下载失败');
    }
  } catch (error) {
    blocks.popupConfirm('下载失败');
  }
}

// 初始化下载按钮事件
function initializeDownloadButtons() {
  const windowsBtn = document.getElementById('windowsBtn');
  const linuxBtn = document.getElementById('linuxBtn');

  if (windowsBtn) {
    windowsBtn.addEventListener('click', () => downloadApp('windows'));
  }
  if (linuxBtn) {
    linuxBtn.addEventListener('click', () => downloadApp('linux'));
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  initializeImages();
  initializeDownloadButtons();
});

export { downloadApp, initializeImages, initializeDownloadButtons };
