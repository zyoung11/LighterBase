import {URL} from "../apis/api";
import {jwtDecode} from "jwt-decode"
/**
 * 针对低带宽优化的图片压缩函数
 * @param imgSrc 图片源地址
 * @param maxWidth 最大宽度
 * @param quality 压缩质量 (0-1)
 * @returns 压缩后的base64图片
 */
export async function compressImage(
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

function checkAuthentication(token:string,targetPage:string) {
  if (!token) {
    // console.log("没有找到JWT token，跳转到登录页面");
    window.location.href = `/${targetPage}?apiUrl=${encodeURIComponent(URL)}`;
    return false;
  }

  try {
    const decoded = jwtDecode(token);
    const exp = Number(decoded.exp) * 1000;

    if (exp && exp < Date.now()) {
      console.log("token已经过期，尝试刷新");
      return true; // 继续执行刷新逻辑
    }

    return true; // token有效，继续执行
  } catch (e) {
    // console.log("token解析失败，跳转到登录页面", e);
    window.location.href = `/${targetPage}?apiUrl=${encodeURIComponent(URL)}`;
    return false;
  }
}
