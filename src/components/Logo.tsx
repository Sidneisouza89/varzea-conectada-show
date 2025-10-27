interface LogoProps {
  variant?: 'full' | 'icon';
  className?: string;
}

const Logo = ({ variant = 'full', className = '' }: LogoProps) => {
  if (variant === 'icon') {
    return (
      <div className={`font-bold text-2xl ${className}`}>
        <span className="text-primary">V</span>
      </div>
    );
  }

  return (
    <div className={`font-bold text-2xl tracking-tight ${className}`}>
      <span className="text-gradient">VARZEANDO</span>
    </div>
  );
};

export default Logo;
