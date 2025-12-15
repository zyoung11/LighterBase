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

async downloadApp(os:string){
try{
  const res = await fetch(`${URL}/api/download/app/${os}`)
  console.log(res);
  if(res.ok){
    return true
  }
}catch(e){
  blocks.popupConfirm("下载失败")
}
  
}

}

export default projects;
