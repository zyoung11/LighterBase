import { URL } from "../apis/api";
import blocks from "../modules/blocks";
const projects = {

async getAllUsers(hubAuthToken:string){
  try{
    const res = await fetch(`${URL}/api/users`,{
      method:"GET",
      headers:{
        // "Content-Type":"application/json",
        "Authorization":`Bearer ${hubAuthToken}`
      }
    });

    if(res.ok){
      const data =await res.json()
      console.log(data)
      return data
    }

  
  }catch(e){
    console.log("获取所有用户失败：",e)
  }
},

async getSingleUser(id: number, hubAuthToken: string){
  try{
    const res = await fetch(`${URL}/api/users/${id}`,{
      method:"GET",
      headers:{
        "Authorization":`Bearer ${hubAuthToken}`
      }
    });

    if(res.ok){
      const data =await res.json()
      return data
    }

  
  }catch(e){
    console.log("获取单个用户失败：",e)
  }
},

async updateUser(id: number, data: {user_name: string, password: string, user_avatar: string}, hubAuthToken: string){
  try{
    const res = await fetch(`${URL}/api/users/${id}`,{
      method:"PUT",
      headers:{
        "Content-Type":"application/json",
        "Authorization":`Bearer ${hubAuthToken}`
      },
      body: JSON.stringify(data)
    });

    if(res.ok){
      const data =await res.json()
      return data
    }

  
  }catch(e){
    console.log("更新用户失败：",e)
  }
},

async deleteUser(id: number, hubAuthToken: string){
  try{
    const res = await fetch(`${URL}/api/users/${id}`,{
      method:"DELETE",
      headers:{
        "Authorization":`Bearer ${hubAuthToken}`
      }
    });

    if(res.status === 204){
      return null
    }

  
  }catch(e){
    console.log("删除用户失败：",e)
  }
},

async checkInit(){
  try{
    const res = await fetch(`${URL}/api/users/check/init`,{
      method:"GET"
    });

    if(res.ok){
      const data =await res.json()
      return data
    }

  
  }catch(e){
    console.log("检查初始化失败：",e)
  }
},

async createProject(data: {project_name: string, project_avatar: string, project_description: string}, hubAuthToken: string){
  try{
    const res = await fetch(`${URL}/api/projects`,{
      method:"POST",
      headers:{
        "Authorization":`Bearer ${hubAuthToken}`,
        "Content-Type":"application/json"
      },
      body: JSON.stringify(data)
    });
    if(res.ok){
      const data =await res.json()
      console.log(data)
      return data
    }

  
  }catch(e){
    console.log("创建项目失败：",e)
  }
},

async getAllProjects(hubAuthToken: string){
  try{
    const res = await fetch(`${URL}/api/projects`,{
      method:"GET",
      headers:{
        "Authorization":`Bearer ${hubAuthToken}`
      }
    });
    console.log(hubAuthToken)
    if(res.ok){
      const data =await res.json()
      console.log(data)
      return data
    }

  
  }catch(e){
    console.log("获取所有项目失败：",e)
  }
},

async getSingleProject(id: number, hubAuthToken: string){
  try{
    const res = await fetch(`${URL}/api/projects/${id}`,{
      method:"GET",
      headers:{
        "Authorization":`Bearer ${hubAuthToken}`
      }
    });

    if(res.ok){
      const data =await res.json()
      return data
    }

  
  }catch(e){
    console.log("获取单个项目失败：",e)
  }
},

async updateProject(id: number, data: {project_name: string, project_avatar: string, project_description: string}, hubAuthToken: string){
  try{
    const res = await fetch(`${URL}/api/projects/${id}`,{
      method:"PUT",
      headers:{
        "Content-Type":"application/json",
        "Authorization":`Bearer ${hubAuthToken}`
      },
      body: JSON.stringify(data)
    });

    if(res.ok){
      const data =await res.json()
      return data
    }

  
  }catch(e){
    console.log("更新项目失败：",e)
  }
},

async deleteProject(id: number, hubAuthToken: string){
  try{
    const res = await fetch(`${URL}/api/projects/${id}`,{
      method:"DELETE",
      headers:{
        "Authorization":`Bearer ${hubAuthToken}`
      }
    });

    if(res.status === 204){
      return null
    }

  
  }catch(e){
    console.log("删除项目失败：",e)
  }
},


async downloadApp(os: string) {
  try {
    // 方案 1：直接构造 URL 跳转，让浏览器原生处理下载
    const downloadUrl = `${URL}/api/download/app/${os}`;
    
    // 创建一个隐藏的 a 标签并触发点击
    const a = document.createElement('a');
    a.href = downloadUrl;
    // 如果后端配置了 Content-Disposition，这行其实可以省略
    a.download = os === 'windows' ? 'LighterBase-windows.exe' : 'LighterBase-linux';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    return true;
  } catch (e) {
    console.error("触发下载失败:", e);
    return false;
  }
},






async downloadProject(projectId: number, hubAuthToken: string){
  try{
    const res = await fetch(`${URL}/api/projects/download/${projectId}`,{
      method:"GET",
      headers:{
        "Authorization": `Bearer ${hubAuthToken}`
      }
    })

    if(!res.ok){
      console.error('下载请求失败:', res.status, res.statusText);
      blocks.popupConfirm("下载失败：服务器返回错误")
      return false
    }

    const contentDisposition = res.headers.get('Content-Disposition');
    let filename = '';

    if (contentDisposition) {
        const matches = contentDisposition.match(/filename="?([^"]+)"?/i);
        if (matches && matches[1]) {
            filename = matches[1];
        }
    }

    if (!filename) {
        filename = `project-${projectId}.zip`;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    return true

  }catch(e){
    console.error("下载过程中发生错误:", e);
    blocks.popupConfirm("下载失败")
    return false
  }
}
}

export default projects;
