# 🐛 GUÍA DE DEBUG - EMAILS NO LLEGAN O LLEGAN TARDE

## ✅ LO QUE YA TIENES CONFIGURADO

- ✅ Dominio `bookingsaas.app` verificado en Resend
- ✅ RESEND_API_KEY configurada
- ✅ Emails aparecen en dashboard de Resend

---

## 🔍 PROBLEMA: Emails llegan tarde o no llegan

### **Causas Posibles:**

1. **DNS no configurado completamente (SPF/DKIM/DMARC)**
2. **Rate limiting de Resend Free**
3. **Emails cayendo en SPAM**
4. **Emails bloqueados síncronamente en el código**

---

## 📋 CHECKLIST DE VERIFICACIÓN

### **PASO 1: Verificar DNS en Resend** ⚠️ CRÍTICO

1. **Abre Resend Console**: https://resend.com/domains
2. **Click en `bookingsaas.app`**
3. **Verifica que todos los registros DNS estén en VERDE:**
   - ✅ SPF (TXT record)
   - ✅ DKIM (TXT record)
   - ✅ DMARC (TXT record) - opcional pero recomendado

**Si alguno está en AMARILLO o ROJO:**
- Copia los registros DNS que te muestra Resend
- Ve a Cloudflare → DNS → Add record
- Agrega cada registro exactamente como aparece en Resend
- Espera 5-10 minutos para propagación

---

### **PASO 2: Verificar límites de Resend Free**

**Plan Free:**
- 100 emails/día
- 10 emails/segundo
- 3,000 emails/mes

**¿Cómo verificar?**
1. Abre Resend Dashboard → Usage
2. Verifica que NO hayas excedido el límite
3. Si lo excediste, los emails se encolan (pueden tardar horas)

**Solución:** Upgradear a Resend Pro ($20/mes) si envías >100 emails/día

---

### **PASO 3: Verificar si caen en SPAM**

**Para Gmail:**
1. Revisa carpeta de SPAM
2. Si está ahí, marca como "No es spam"
3. Agrega noreply@bookingsaas.app a contactos

**Para mejorar deliverability:**
- Configura DMARC en DNS
- Usa un dominio "warm up" (envía pocos emails al inicio)
- Evita palabras de spam en subject/body

---

### **PASO 4: Testear envío directo**

Ejecuta este comando para probar que Resend funciona:

```bash
npm run test:email
```

Si no existe ese script, créalo:

```bash
npx tsx scripts/test-email.ts
```

**O prueba manualmente desde Resend:**
1. Resend Dashboard → API Keys
2. Click en "Send Test Email"
3. Envía a tu email personal
4. Verifica que llegue en <30 segundos

---

## 🔧 CAMBIOS APLICADOS AL CÓDIGO

### ✅ **Email al superadmin ahora es ASÍNCRONO**

**Antes:**
```typescript
await sendEmail({ ... }); // ❌ Bloqueaba la respuesta 5-10s
```

**Después:**
```typescript
sendEmail({ ... }).then(...).catch(...); // ✅ No bloquea
```

**Resultado:** El registro responde instantáneamente, el email se envía en background.

---

## 📊 DEBUGGING EN PRODUCCIÓN

### **Ver logs en Vercel:**

1. Abre Vercel Dashboard → Tu proyecto
2. Click en "Logs" (o "Deployments" → último deploy → "Logs")
3. Busca mensajes relacionados con email:
   - `📧 Intentando enviar email`
   - `✅ Email enviado exitosamente`
   - `❌ Error al enviar email`

### **Ver detalles en Resend:**

1. Abre Resend Dashboard → Emails
2. Click en cualquier email
3. Verifica el "Status":
   - **Sent** ✅ - Email enviado correctamente
   - **Delivered** ✅ - Email recibido por el servidor destino
   - **Bounced** ❌ - Email rebotado (dirección inválida)
   - **Complained** ❌ - Marcado como spam
   - **Queued** ⏳ - En cola (puede tardar si hay rate limit)

---

## 🎯 SOLUCIONES POR CASO

### **CASO 1: Emails en "Queued" en Resend**

**Causa:** Rate limiting (>10 emails/segundo)

**Solución:**
- Reducir velocidad de envío
- Upgradear a Resend Pro
- Implementar cola de emails (bullmq, etc.)

---

### **CASO 2: Emails en "Bounced"**

**Causa:** Email destino inválido

**Solución:**
- Verificar que el email del usuario sea correcto
- Implementar validación de email en frontend

---

### **CASO 3: Emails en "Sent" pero no llegan**

**Causa:** Caen en SPAM

**Solución:**
1. Verificar DNS (SPF, DKIM, DMARC) ← **CRÍTICO**
2. Mejorar contenido del email (evitar palabras de spam)
3. Agregar link de "unsubscribe"
4. Usar dominio "warmed up" (enviar pocos emails al inicio)

---

### **CASO 4: Emails tardan 5-10 minutos**

**Causa:** Proveedor de email destino (Gmail, etc.) haciendo greylisting

**Solución:**
- Normal para dominios nuevos
- Después de enviar ~100 emails, mejora
- Configura DMARC para acelerar

---

## 🚀 OPTIMIZACIONES ADICIONALES

### **1. Implementar Queue de Emails** (Avanzado)

Para >1,000 emails/día:

```bash
npm install bullmq ioredis
```

Usar Upstash Redis (free tier) como queue backend.

---

### **2. Configurar Webhooks de Resend**

Para recibir eventos en tiempo real:

1. Resend Dashboard → Webhooks
2. Add webhook: `https://tu-app.vercel.app/api/webhooks/resend`
3. Eventos a escuchar:
   - `email.sent`
   - `email.delivered`
   - `email.bounced`

---

### **3. Agregar Retry Logic**

```typescript
async function sendEmailWithRetry(params: EmailParams, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const result = await sendEmail(params);
    if (result.success) return result;
    
    console.log(`Retry ${i + 1}/${retries}`);
    await new Promise(r => setTimeout(r, 1000 * (i + 1))); // Exponential backoff
  }
  return { success: false };
}
```

---

## 📝 PRÓXIMOS PASOS

1. **AHORA:** Verifica DNS en Resend (SPF/DKIM/DMARC)
2. **AHORA:** Testea envío directo desde Resend Dashboard
3. **AHORA:** Revisa carpeta de SPAM
4. **Después:** Si sigues con problemas, considera Resend Pro ($20/mes)
5. **Futuro:** Implementa queue si envías >1,000 emails/día

---

## 🔗 RECURSOS

- **Resend Docs:** https://resend.com/docs
- **DNS Checker:** https://dnschecker.org
- **Email Tester:** https://www.mail-tester.com
- **SPF Record Checker:** https://mxtoolbox.com/spf.aspx

---

## 💡 TIP IMPORTANTE

**Para testing inmediato:**

En vez de esperar que los emails lleguen, usa el **dashboard de Resend** para ver el status en tiempo real:

```
Resend → Emails → Últimos envíos
```

Si aparecen como "Delivered" pero no los ves en tu inbox → Revisa SPAM

Si aparecen como "Queued" por >5 minutos → Problema de rate limit

Si aparecen como "Bounced" → Email destino inválido

---

**¿Sigues con problemas después de seguir esta guía?**

1. Revisa logs de Vercel
2. Revisa dashboard de Resend
3. Verifica que DNS esté correctamente configurado (el más común)
