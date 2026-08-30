export const getCsrfToken=():string=>{
  const entry=document.cookie.split(';').map(value=>value.trim()).find(value=>value.startsWith('prolog_csrf='));
  return entry?decodeURIComponent(entry.slice('prolog_csrf='.length)):'';
};

export const csrfHeaders=():Record<string,string>=>({'X-CSRF-Token':getCsrfToken()});
