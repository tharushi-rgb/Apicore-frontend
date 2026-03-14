interface PageTitleBarProps {
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PageTitleBar({ title, subtitle, size = 'md' }: PageTitleBarProps) {
  const titleClass = size === 'sm'
    ? 'text-[0.98rem]'
    : size === 'lg'
      ? 'text-[1.18rem]'
      : 'text-[1.05rem]';

  const subtitleClass = size === 'sm' ? 'text-[0.66rem]' : 'text-[0.72rem]';

  return (
    <div className="px-4 pt-2 pb-2.5 border-t border-stone-100">
      <h1 className={`${titleClass} font-semibold text-stone-800 leading-tight tracking-tight`}>{title}</h1>
      {subtitle && <p className={`text-stone-500 mt-0.5 ${subtitleClass} leading-tight`}>{subtitle}</p>}
    </div>
  );
}
