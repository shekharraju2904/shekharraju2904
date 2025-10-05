
import React from 'react';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const Avatar: React.FC<AvatarProps> = ({ name, size = 'md' }) => {
  const getInitials = (nameStr: string) => {
    if (!nameStr) return '';
    const names = nameStr.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return nameStr.substring(0, 2).toUpperCase();
  };

  const colors = [
    'bg-sky-200 text-sky-800',
    'bg-indigo-200 text-indigo-800',
    'bg-rose-200 text-rose-800',
    'bg-amber-200 text-amber-800',
    'bg-emerald-200 text-emerald-800',
    'bg-violet-200 text-violet-800',
    'bg-lime-200 text-lime-800',
    'bg-cyan-200 text-cyan-800',
  ];

  const colorIndex = (name.charCodeAt(0) + name.length) % colors.length;
  const colorClass = colors[colorIndex];


  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  return (
    <span className={`inline-flex items-center justify-center rounded-full font-bold ${sizeClasses[size]} ${colorClass}`}>
      <span className="leading-none">{getInitials(name)}</span>
    </span>
  );
};

export default Avatar;