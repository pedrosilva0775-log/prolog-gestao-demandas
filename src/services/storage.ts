const KEYS={theme:'prolog_ui_theme',deviceMode:'prolog_ui_device_mode',offlineMode:'prolog_ui_offline_mode',sidebarCollapsed:'prolog_ui_sidebar_collapsed'} as const;
const read=(key:string)=>{try{return localStorage.getItem(key);}catch{return null;}};
const write=(key:string,value:string)=>{try{localStorage.setItem(key,value);}catch{return;}};

export const StorageService={
  getTheme:(): 'light'|'dark'|'system'=>(read(KEYS.theme) as 'light'|'dark'|'system')||'light',
  setTheme:(value:'light'|'dark'|'system')=>write(KEYS.theme,value),
  getDeviceMode:(): 'web'|'android'=>(read(KEYS.deviceMode) as 'web'|'android')||'web',
  setDeviceMode:(value:'web'|'android')=>write(KEYS.deviceMode,value),
  getOfflineMode:()=>read(KEYS.offlineMode)==='true',
  setOfflineMode:(value:boolean)=>write(KEYS.offlineMode,String(value)),
  getSidebarCollapsed:()=>read(KEYS.sidebarCollapsed)==='true',
  setSidebarCollapsed:(value:boolean)=>write(KEYS.sidebarCollapsed,String(value)),
  resetAllToDefault:()=>{for(const key of Object.values(KEYS)){try{localStorage.removeItem(key);}catch{continue;}}},
};
