import { playAudio } from "openai/helpers/audio.mjs";
import { URL,hubAuthToken } from "../apis/api";
import blocks from "../modules/blocks";
const projects = {


// ====================================用户=========================================

async getAllUsers(){
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

async getSingleUser(id: number){
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

async updateUser(id: number, data: {user_name: string, password: string, user_avatar: string}){
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

async deleteUser(id: number){
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

async refreshHubToken(URL:string,theToken:string){
  try{
    const res = await fetch(`${URL}/api/users/refresh`,{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":`Bearer ${theToken}`
      }
    });

    // if(res.ok){
      const data =await res.json()
      console.log("查看",data)
      return data.token
    // }

  
  }catch(e){
    console.log("获取所有用户失败：",e)
  }
},



// ====================================项目=========================================



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

async getAllProjects(){
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

async getSingleProject(id: number){
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

// ====================================下载=========================================



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
      blocks.popupConfirm("下载失败")
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
},

// ====================================团队协作=========================================

//可选 admin 或 readonly
async sendInvitation(payload:any){
  const tempUrl = "http://localhost:8080"
  // const tempUrl = "http://www.smallwoodice.cn:8080"
  try{
    const res = await fetch(`${tempUrl}/api/team`,{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":`Bearer ${hubAuthToken}`
      },
      body: JSON.stringify(payload)
    });
    console.log(payload)
    if(res.ok){
      blocks.popupConfirm("邀请成功")
      return true
    }else{
      const data = await res.json()
      blocks.popupConfirm("邀请失败")
      return false
    }

  }catch(e){
    return false
  }
},




// /:status 选项 	功能
// /all 	获取该用户发送的所有邀请
// /agree 	获取该用户发送的所有的已经同意的邀请
// /disagree 	获取该用户发送的所有的不同意的邀请
// /pending 	获取该用户发送的所有的待同意的邀请
async getSentInvitations(status: string){
  try{
    const res = await fetch(`${URL}/api/team/send/${status}`,{
      method:"GET",
      headers:{
        "Authorization":`Bearer ${hubAuthToken}`
      }
    });

    if(res.ok){
      const data = await res.json()
      return data
    }

  }catch(e){
    console.log("查询发送的邀请失败：",e)
  }
},




// /:status 选项 	功能
// /all 	获取该用户发送的所有邀请
// /agree 	获取该用户发送的所有的已经同意的邀请
// /disagree 	获取该用户发送的所有的不同意的邀请
// /pending 	获取该用户发送的所有的待同意的邀请
async getReceivedInvitations(status: string){
  try{
    const res = await fetch(`${URL}/api/team/receive/${status}`,{
      method:"GET",
      headers:{
        "Authorization":`Bearer ${hubAuthToken}`
      }
    });

    if(res.ok){
      const data = await res.json()
      return data
    }

  }catch(e){
    console.log("查询接收的邀请失败：",e)
  }
},



// /:status 选项 	功能
// /agree 	同意邀请
// disagree 	不同意邀请
async confirmInvitation(notificationId: number, status: string){
  try{
    const res = await fetch(`${URL}/api/team/confirm/${notificationId}/${status}`,{
      method:"PUT",
      headers:{
        "Authorization":`Bearer ${hubAuthToken}`
      }
    });

    if(res.ok){
      const data = await res.json()
      return data
    }

  }catch(e){
    console.log("确认邀请失败：",e)
  }
},

// ====================================性能监控=========================================

async getMetrics():Promise<any>{
  try{
    const res =await fetch(`${URL}/metrics`,{
      method:"GET",
      headers:{
        "Accept":"application/json"
      }
    });
    const data = await res.json();
    return data
    
  }catch(e){
    throw e
  }
}


}

export default projects;
