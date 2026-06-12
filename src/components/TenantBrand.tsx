import { Leaf } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';

// Marca da loja (logo + nome) para os cabeçalhos internos do app
export function TenantBrand({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const { tenant } = useTenant();
  const iconBox = size === 'md' ? 'w-10 h-10' : 'w-8 h-8';
  const icon = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  const text = size === 'md' ? 'text-xl' : 'text-base';

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${iconBox} rounded-full flex items-center justify-center flex-shrink-0`}
        style={{ backgroundColor: tenant.theme.colors.primary }}
      >
        <Leaf className={`${icon} text-white`} />
      </div>
      <span
        className={`${text} font-bold whitespace-nowrap`}
        style={{
          color: tenant.theme.colors.text,
          fontFamily: tenant.theme.typography.headingFont,
        }}
      >
        {tenant.name}
      </span>
    </div>
  );
}
