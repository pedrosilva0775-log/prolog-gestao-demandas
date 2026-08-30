import React, { useEffect, useState } from 'react';

type UserAvatarProps = {
  name?: string | null;
  src?: string | null;
  className?: string;
  title?: string;
};

export const userInitials = (name?: string | null) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return `${parts[0][0]}${parts.length > 1 ? parts.at(-1)?.[0] || '' : ''}`.toUpperCase();
};

export const UserAvatar: React.FC<UserAvatarProps> = ({ name, src, className = 'w-8 h-8 rounded-full', title }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  const shared = `${className} shrink-0 overflow-hidden`;
  if (src && !failed) {
    return <img src={src} alt={name ? `Avatar de ${name}` : 'Avatar do usuário'} title={title} onError={() => setFailed(true)} className={`${shared} object-cover`} />;
  }
  return <span role="img" aria-label={name ? `Iniciais de ${name}` : 'Usuário sem imagem'} title={title} className={`${shared} inline-grid place-items-center bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-black uppercase select-none`}>{userInitials(name)}</span>;
};
