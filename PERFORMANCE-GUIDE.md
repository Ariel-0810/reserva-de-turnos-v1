# 📊 GUÍA DE PERFORMANCE - Mejores Prácticas

## 🎯 REGLAS DE ORO PARA MANTENER TU APP RÁPIDA

### 1. **CACHÉ DE API ROUTES**

#### ✅ HACER:
```typescript
// Para datos que NO cambian frecuentemente
export const revalidate = 60; // ISR cada 60 segundos

export async function GET() {
  const data = await fetchData();
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  });
}
```

#### ❌ NO HACER:
```typescript
// Forzar dynamic en TODO
export const dynamic = 'force-dynamic';
```

**Cuándo usar cada estrategia:**
- `revalidate: 60` → Datos públicos que cambian poco (info del negocio, servicios)
- `revalidate: 30` → Datos semi-dinámicos (horarios disponibles)
- `dynamic: 'force-dynamic'` → Solo para datos de usuario autenticado o que cambian constantemente

---

### 2. **QUERIES DE BASE DE DATOS**

#### ✅ HACER:
```typescript
// Específico, con índices
const booking = await Booking.findOne({
  where: { 
    id: bookingId,
    businessId: businessId, // ← tiene índice
  },
  attributes: ['id', 'status', 'bookingDate'], // Solo lo necesario
});
```

#### ❌ NO HACER:
```typescript
// Traer TODO sin filtros
const bookings = await Booking.findAll(); // ← MUY LENTO

// Queries sin índices
const booking = await Booking.findOne({
  where: { 
    customerName: 'Juan', // ← NO tiene índice, full table scan
  },
});
```

**Reglas:**
1. Siempre usa `findOne()` cuando buscas UN registro
2. Siempre especifica `attributes` para limitar campos
3. Usa `where` con campos que tienen índices
4. Evita `findAll()` sin límites
5. Usa `limit` y `offset` para paginación

---

### 3. **IMÁGENES**

#### ✅ HACER:
```tsx
import Image from 'next/image';

// Con width/height específicos
<Image
  src="/logo.png"
  width={200}
  height={100}
  alt="Logo"
  priority // Solo para above-the-fold
/>

// Con fill para responsive
<div className="relative w-full h-64">
  <Image
    src="/banner.jpg"
    fill
    className="object-cover"
    alt="Banner"
    sizes="(max-width: 768px) 100vw, 50vw"
  />
</div>
```

#### ❌ NO HACER:
```tsx
// Usar <img> directo
<img src="/logo.png" alt="Logo" />

// Next Image sin dimensiones
<Image src="/logo.png" alt="Logo" />
```

**Tips:**
- Usa `priority` solo para la imagen principal (above-the-fold)
- Especifica `sizes` para responsive
- Convierte imágenes grandes a WebP/AVIF

---

### 4. **LAZY LOADING DE COMPONENTES**

#### ✅ HACER:
```typescript
import dynamic from 'next/dynamic';

// Componentes pesados que NO son críticos
const Chart = dynamic(() => import('./Chart'), {
  loading: () => <div>Cargando gráfico...</div>,
  ssr: false, // Si no necesita SSR
});

const HeavyModal = dynamic(() => import('./HeavyModal'));

// Uso
export function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Chart data={data} /> {/* Se carga solo cuando se necesita */}
    </div>
  );
}
```

#### ✅ Componentes candidatos para lazy loading:
- Modales
- Gráficos (Chart.js, Plotly)
- Calendarios complejos
- Rich text editors
- Mapas
- Componentes de admin que no todos ven

---

### 5. **IMPORTS DE LIBRERÍAS**

#### ✅ HACER:
```typescript
// Importar solo lo necesario
import { format } from 'date-fns';
import debounce from 'lodash-es/debounce';
import { Button } from '@/components/ui/button';
```

#### ❌ NO HACER:
```typescript
// Importar TODO
import * as dateFns from 'date-fns';
import _ from 'lodash';
import * as RadixUI from '@radix-ui/react-dialog';
```

**Librerías a optimizar:**
- `lodash` → `lodash-es` (con imports específicos)
- `date-fns` → importar funciones específicas
- `@radix-ui/*` → ya optimizado en next.config.js

---

### 6. **REACT QUERY / SWR CACHÉ**

#### ✅ HACER:
```typescript
import { useQuery } from '@tanstack/react-query';

function useBusinessData(businessId: string) {
  return useQuery({
    queryKey: ['business', businessId],
    queryFn: () => fetchBusiness(businessId),
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });
}
```

**Configuración global:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1, // Solo 1 retry en caso de error
    },
  },
});
```

---

### 7. **FONTS Y RECURSOS EXTERNOS**

#### ✅ HACER:
```tsx
// layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // ← Importante
  preload: true,
});

// En el head
<link rel="preconnect" href="https://external-api.com" />
<link rel="dns-prefetch" href="https://external-api.com" />
```

#### ❌ NO HACER:
```tsx
// Cargar fonts desde CDN
<link href="https://fonts.googleapis.com/css?family=Inter" rel="stylesheet">
```

---

### 8. **ESTADOS Y RE-RENDERS**

#### ✅ HACER:
```typescript
// Memoizar cálculos pesados
import { useMemo } from 'react';

const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);

// Memoizar callbacks
import { useCallback } from 'react';

const handleSubmit = useCallback((values) => {
  submitForm(values);
}, []);

// Memoizar componentes
import { memo } from 'react';

const ExpensiveComponent = memo(({ data }) => {
  return <div>{/* rendering pesado */}</div>;
});
```

#### ❌ NO HACER:
```typescript
// Crear funciones en cada render
function MyComponent() {
  const handleClick = () => { /* ... */ }; // ← Nueva función cada render
  
  return <Button onClick={handleClick} />;
}
```

---

### 9. **BUNDLE SIZE**

#### Analizar bundle:
```bash
# Instalar
npm install @next/bundle-analyzer

# Ejecutar
ANALYZE=true npm run build
```

**Targets:**
- First Load JS < 200kb (ideal)
- Total bundle < 1MB
- Individual pages < 100kb

---

### 10. **MONITORING EN PRODUCCIÓN**

#### Instalar Vercel Analytics:
```bash
npm install @vercel/analytics @vercel/speed-insights
```

```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

---

## 🎯 CHECKLIST ANTES DE CADA DEPLOY

- [ ] Verificar bundle size con analyzer
- [ ] Revisar Lighthouse score (target: >85)
- [ ] Testear en móvil con Slow 3G
- [ ] Verificar que no hay console.logs en producción
- [ ] Confirmar que imágenes usan next/image
- [ ] Validar que API routes críticos tienen caché
- [ ] Verificar que queries DB usan índices

---

## 📈 MÉTRICAS OBJETIVO

| Métrica | Target | Crítico |
|---------|--------|---------|
| **FCP** (First Contentful Paint) | < 1.8s | < 3s |
| **LCP** (Largest Contentful Paint) | < 2.5s | < 4s |
| **TTI** (Time to Interactive) | < 2.5s | < 5s |
| **TBT** (Total Blocking Time) | < 200ms | < 600ms |
| **CLS** (Cumulative Layout Shift) | < 0.1 | < 0.25 |

---

## 🐛 DEBUGGING PERFORMANCE

### Encontrar queries lentas:
```typescript
// Habilitar logging temporal
const sequelize = new Sequelize(url, {
  logging: (sql, timing) => {
    if (timing > 100) { // Queries > 100ms
      console.warn('SLOW QUERY:', sql, timing);
    }
  },
});
```

### Chrome DevTools:
1. **Performance tab** → Grabar interacción → Buscar Long Tasks
2. **Network tab** → Throttling "Slow 3G"
3. **Lighthouse** → Run audit

---

## 🚨 ANTI-PATTERNS A EVITAR

❌ **N+1 Queries**
```typescript
// MAL
const bookings = await Booking.findAll();
for (const booking of bookings) {
  const service = await Service.findByPk(booking.serviceId); // ← N queries extra
}

// BIEN
const bookings = await Booking.findAll({
  include: [{ model: Service }], // ← 1 query con JOIN
});
```

❌ **useEffect con dependencias faltantes**
```typescript
// MAL
useEffect(() => {
  fetchData(userId); // ← userId no está en deps
}, []);

// BIEN
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

❌ **Fetch en cliente sin caché**
```typescript
// MAL
const [data, setData] = useState();
useEffect(() => {
  fetch('/api/data').then(r => r.json()).then(setData);
}, []);

// BIEN
const { data } = useQuery({
  queryKey: ['data'],
  queryFn: () => fetch('/api/data').then(r => r.json()),
});
```

---

**Mantén estas prácticas y tu app se mantendrá SÚPER RÁPIDA 🚀**
