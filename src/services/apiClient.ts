export class ApiError extends Error { constructor(public status:number,message:string){super(message);} }
const request=async<T>(path:string,init?:RequestInit):Promise<T>=>{const response=await fetch(`/api/v1${path}`,{...init,credentials:'include',headers:{'Content-Type':'application/json',...(init?.headers||{})}});if(response.status===401)window.dispatchEvent(new CustomEvent('prolog:session-expired'));if(!response.ok){let message=`Erro ${response.status}`;try{message=(await response.json()).message||message;}catch{}throw new ApiError(response.status,message);}return response.status===204?undefined as T:response.json();};
export const apiClient={
  bootstrap:()=>request<any>('/bootstrap'),
  createDemand:(data:unknown)=>request<any>('/demands',{method:'POST',body:JSON.stringify(data)}),
  updateDemand:(id:string,data:unknown)=>request<any>(`/demands/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify(data)}),
  deleteDemand:(id:string)=>request<void>(`/demands/${encodeURIComponent(id)}`,{method:'DELETE'}),
  clients:()=>request<any[]>('/clients'), createClient:(data:unknown)=>request<any>('/clients',{method:'POST',body:JSON.stringify(data)}),
  teams:()=>request<any[]>('/teams'), createTeam:(data:unknown)=>request<any>('/teams',{method:'POST',body:JSON.stringify(data)}), updateTeam:(id:string,data:unknown)=>request<any>(`/teams/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify(data)}), deleteTeam:(id:string)=>request<void>(`/teams/${encodeURIComponent(id)}`,{method:'DELETE'}),
  auditLogs:()=>request<any[]>('/audit-logs')
};
