
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
    'bg-sky-300 text-sky-900',
    'bg-indigo-300 text-indigo-900',
    'bg-rose-300 text-rose-900',
    'bg-amber-300 text-amber-900',
    'bg-emerald-300 text-emerald-900',
    'bg-violet-300 text-violet-900',
    'bg-lime-300 text-lime-900',
    'bg-cyan-300 text-cyan-900',
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