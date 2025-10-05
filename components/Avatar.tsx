import React from 'react';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', className }) => {
  const getInitials = (nameStr: string) => {
    if (!nameStr) return '?';
    const names = nameStr.split(' ');
    if (names.length > 1 && names[0] && names[names.length - 1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return nameStr.substring(0, 2).toUpperCase();
  };

  const colors = [
    'from-sky-500 to-cyan-400',
    'from-indigo-500 to-blue-400',
    'from-rose-500 to-pink-400',
    'from-amber-500 to-yellow-400',
    'from-emerald-500 to-green-400',
    'from-violet-500 to-purple-400',
    'from-lime-500 to-teal-400',
  ];

  const colorIndex = name ? (name.charCodeAt(0) + name.length) % colors.length : 0;
  const colorClass = colors[colorIndex];


  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  return (
    <div className={`inline-flex items-center justify-center rounded-full font-bold text-white bg-gradient-to-br ${sizeClasses[size]} ${colorClass} ${className}`}>
      <span className="leading-none">{getInitials(name)}</span>
    </div>
  );
};

export default Avatar;