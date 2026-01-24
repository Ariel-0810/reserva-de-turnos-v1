// ✅ Forzar renderizado dinámico para esta ruta
export const dynamic = 'force-dynamic';

export default function NegocioDesactivadoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
