import { Droplets, Sun, Ruler, Sprout, PawPrint, Package, Clock, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TenantBrand } from '@/components/TenantBrand';
import { useTenant } from '@/contexts/TenantContext';
import type { Plant } from '@/types';

const CATEGORY_PT: Record<string, string> = {
  flowers: 'Flor', succulents: 'Suculenta', trees: 'Árvore', foliage: 'Folhagem',
  herbs: 'Erva', cacti: 'Cacto', orchids: 'Orquídea', bonsai: 'Bonsai',
};
const CARE_PT: Record<string, string> = {
  beginner: 'Iniciante', easy: 'Fácil', moderate: 'Moderado', advanced: 'Avançado', expert: 'Expert',
};
const SUN_PT: Record<string, string> = {
  'full-sun': 'Sol pleno', 'partial-sun': 'Meia sombra',
  'indirect-light': 'Luz indireta', shade: 'Sombra',
};

interface PlantDetailDialogProps {
  plant: Plant | null;
  onClose: () => void;
}

export function PlantDetailDialog({ plant, onClose }: PlantDetailDialogProps) {
  const { tenant } = useTenant();
  if (!plant) return null;

  const facts = [
    { icon: Sun, label: 'Luz', value: SUN_PT[plant.sunlight] ?? plant.sunlight },
    { icon: Droplets, label: 'Rega', value: plant.wateringFrequency },
    { icon: Sprout, label: 'Cuidado', value: CARE_PT[plant.careLevel] ?? plant.careLevel },
    { icon: Ruler, label: 'Altura', value: plant.size.height },
    { icon: PawPrint, label: 'Pets', value: plant.petFriendly ? 'Segura' : 'Tóxica' },
    { icon: Package, label: 'Estoque', value: `${plant.stock} un.` },
  ];

  const whatsappUrl = tenant.contact.whatsapp
    ? `https://wa.me/55${tenant.contact.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Olá! Vi a ${plant.name} (R$ ${plant.price.toFixed(2)}) no site e tenho interesse.`
      )}`
    : null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-lg p-0 gap-0 overflow-hidden"
        style={{ backgroundColor: tenant.theme.colors.surface }}
      >
        {/* Imagem com marca da loja sobreposta */}
        <div className="relative">
          <img
            src={plant.image}
            alt={plant.name}
            className="w-full h-52 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                `https://placehold.co/600x400/${tenant.theme.colors.primary.replace('#', '')}/white?text=${encodeURIComponent(plant.name)}`;
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-2 left-4 [&_span]:!text-white">
            <TenantBrand />
          </div>
          {plant.petFriendly && (
            <span
              className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: tenant.theme.colors.success }}
            >
              🐾 Pet friendly
            </span>
          )}
        </div>

        {/* Conteúdo rolável */}
        <div className="max-h-[50vh] overflow-y-auto px-5 py-4 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                style={{
                  backgroundColor: `${tenant.theme.colors.primary}15`,
                  color: tenant.theme.colors.primary,
                }}
              >
                {CATEGORY_PT[plant.category] ?? plant.category}
              </Badge>
              <span className="text-xs italic" style={{ color: tenant.theme.colors.textMuted }}>
                {plant.scientificName}
              </span>
            </div>
            <DialogTitle
              className="text-2xl"
              style={{
                color: tenant.theme.colors.text,
                fontFamily: tenant.theme.typography.headingFont,
              }}
            >
              {plant.name}
            </DialogTitle>
            <p className="text-sm leading-relaxed" style={{ color: tenant.theme.colors.textMuted }}>
              {plant.description}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {facts.map((f) => (
              <div
                key={f.label}
                className="rounded-xl px-3 py-2.5 border"
                style={{
                  backgroundColor: tenant.theme.colors.background,
                  borderColor: tenant.theme.colors.border,
                }}
              >
                <span
                  className="flex items-center gap-1 text-[11px] uppercase tracking-wide"
                  style={{ color: tenant.theme.colors.textMuted }}
                >
                  <f.icon className="w-3.5 h-3.5" style={{ color: tenant.theme.colors.primary }} />
                  {f.label}
                </span>
                <span
                  className="block text-sm font-semibold mt-0.5 truncate"
                  style={{ color: tenant.theme.colors.text }}
                  title={f.value}
                >
                  {f.value}
                </span>
              </div>
            ))}
          </div>

          {plant.benefits.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {plant.benefits.map((b) => (
                <span
                  key={b}
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: `${tenant.theme.colors.secondary}15`,
                    color: tenant.theme.colors.secondary,
                  }}
                >
                  {b}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé fixo: preço + ação */}
        <div
          className="px-5 py-4 border-t flex items-center justify-between gap-3"
          style={{
            borderColor: tenant.theme.colors.border,
            backgroundColor: tenant.theme.colors.background,
          }}
        >
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold" style={{ color: tenant.theme.colors.primary }}>
                R$ {plant.price.toFixed(2)}
              </span>
              {plant.originalPrice && (
                <span
                  className="text-sm line-through"
                  style={{ color: tenant.theme.colors.textMuted }}
                >
                  R$ {plant.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: tenant.theme.colors.textMuted }}
            >
              <Clock className="w-3 h-3" />
              {tenant.contact.workingHours}
            </span>
          </div>

          {whatsappUrl && (
            <Button
              asChild
              className="gap-2"
              style={{ backgroundColor: tenant.theme.colors.primary }}
            >
              <a href={whatsappUrl} target="_blank" rel="noreferrer">
                <MessageCircle className="w-4 h-4" />
                Reservar
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
