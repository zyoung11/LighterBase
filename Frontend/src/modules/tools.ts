import {URL} from "../apis/api";
import {jwtDecode} from "jwt-decode"
import auth from "../apis/auth"
import blocks from "./blocks";
import projects from "../hubUtils/projects";
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
  if (!token || token == null || token === '') {
    window.location.href = `/${targetPage}`;
    return;
  }

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
          // console.log("Token刷新成功");
        }
      } catch (refreshError) {
        // console.error("Token刷新失败", refreshError);
        window.location.href = `/${targetPage}`;
      } finally {
        isRefreshing = false;
      }
    
    } else if (exp && exp <= now) {
      blocks.popupConfirm("token已经过期，请重新登录");
      window.location.href = `/${targetPage}`;
    }

  } catch (e) {
    console.error("token解析失败", e);
    window.location.href = `/${targetPage}`;
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


export {
  compressImage,
  checkAuthentication,
  getCookie,
  parseJwt
  
}
