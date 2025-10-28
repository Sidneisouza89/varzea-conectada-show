import logoFull from '@/assets/varzeando-logo.png';
import logoIcon from '@/assets/varzeando-icon.png';

interface LogoProps {
  variant?: 'full' | 'icon';
  className?: string;
}

const Logo = ({ variant = 'full', className = '' }: LogoProps) => {
  if (variant === 'icon') {
    return (
      <img 
        src={logoIcon} 
        alt="Varzeando" 
        className={`h-8 w-8 object-contain ${className}`}
      />
    );
  }

  return (
    <img 
      src={logoFull} 
      alt="Varzeando" 
      className={`h-8 object-contain ${className}`}
    />
  );
};

export default Logo;
