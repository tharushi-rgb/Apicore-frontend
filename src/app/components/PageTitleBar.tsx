interface PageTitleBarProps {
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PageTitleBar({ title, subtitle, size = 'md' }: PageTitleBarProps) {
  const titleClass = size === 'sm'
    ? 'text-[1.1rem]'
    : size === 'lg'
      ? 'text-2xl'
      : 'text-xl';

  const subtitleClass = size === 'sm' ? 'text-[0.75rem]' : 'text-sm';

  return (
    <div className="px-6 pb-4 border-t border-stone-100">
      <h1 className={`${titleClass} font-bold text-stone-800`}>{title}</h1>
      {subtitle && <p className={`text-stone-500 mt-1 ${subtitleClass}`}>{subtitle}</p>}
    </div>
  );
}
