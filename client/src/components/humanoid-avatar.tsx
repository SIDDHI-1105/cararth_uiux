/**
 * Humanoid Avatar Component for CarArth Assistant
 * Creates a friendly, approachable human-like avatar instead of a generic bot icon
 */

interface HumanoidAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  isActive?: boolean;
  mood?: 'happy' | 'thinking' | 'helpful' | 'excited';
}

export function HumanoidAvatar({ 
  size = 'md', 
  className = '',
  isActive = false,
  mood = 'helpful'
}: HumanoidAvatarProps) {
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10', 
    lg: 'w-12 h-12'
  };

  const eyeShape = mood === 'happy' ? '^' : mood === 'thinking' ? '-' : '•';
  const mouthShape = mood === 'happy' ? 'smile' : mood === 'thinking' ? 'line' : mood === 'excited' ? 'wow' : 'smile';

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <div className="w-full h-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg overflow-hidden relative">
        {/* Face background with skin tone */}
        <div className="absolute inset-1 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full"></div>
        
        {/* Hair */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-6 h-3 bg-gradient-to-r from-amber-800 to-amber-700 rounded-t-full"></div>
        
        {/* Eyes */}
        <div className="absolute top-3 left-2.5 w-1 h-1 bg-gray-800 rounded-full animate-pulse"></div>
        <div className="absolute top-3 right-2.5 w-1 h-1 bg-gray-800 rounded-full animate-pulse"></div>
        
        {/* Nose */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-0.5 h-0.5 bg-amber-300 rounded-full"></div>
        
        {/* Mouth */}
        <div className={`absolute top-5 left-1/2 transform -translate-x-1/2 ${
          mouthShape === 'smile' ? 'w-2 h-0.5 bg-rose-400 rounded-full' :
          mouthShape === 'line' ? 'w-1.5 h-0.5 bg-gray-600 rounded-full' :
          mouthShape === 'wow' ? 'w-1 h-1 bg-rose-400 rounded-full' :
          'w-2 h-0.5 bg-rose-400 rounded-full'
        }`}></div>
        
        {/* Subtle animation when active */}
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-green-200/30 to-blue-200/30 rounded-full animate-pulse"></div>
        )}
      </div>
      
      {/* Activity indicator */}
      {isActive && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-bounce">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      )}
    </div>
  );
}

export default HumanoidAvatar;