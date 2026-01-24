#!/usr/bin/env tsx

/**
 * Script para limpiar y corregir números de teléfono en la base de datos
 * 
 * Este script:
 * 1. Corrige números de teléfono en la tabla Users (campo phone)
 * 2. Corrige números de WhatsApp en la tabla Business (campos phone y whatsappNumber)
 * 3. Corrige números de clientes en la tabla Bookings (campo customerPhone)
 * 
 * Uso: npm run fix-phones
 * 
 * Nota: Las variables de entorno se cargan automáticamente con --env-file=.env
 */

import { initDb, Op } from '../lib/db';
import { User } from '../lib/models/User';
import { Business } from '../lib/models/Business';
import { Booking } from '../lib/models/Booking';

/**
 * Normaliza un número de teléfono argentino al formato correcto: 549XXXXXXXXXX
 */
function normalizeArgentinaPhone(phone: string | null): string | null {
  if (!phone) return null;
  
  // Eliminar todos los caracteres no numéricos
  let normalized = phone.replace(/\D/g, '');
  
  // Si está vacío, retornar null
  if (!normalized) return null;
  
  console.log(`  Procesando: ${phone} -> ${normalized}`);
  
  // Casos especiales para Argentina:
  
  // 1. Si ya empieza con 549, está correcto
  if (normalized.startsWith('549') && normalized.length >= 12) {
    console.log(`  ✅ Ya correcto: ${normalized}`);
    return normalized;
  }
  
  // 2. Si empieza con 54 pero no con 549
  if (normalized.startsWith('54') && !normalized.startsWith('549')) {
    const rest = normalized.substring(2);
    // Si el resto empieza con 11, 9 u otro código de área, agregar el 9
    if (rest.length >= 10) {
      normalized = '549' + rest;
      console.log(`  🔧 Agregado 9: ${normalized}`);
      return normalized;
    }
  }
  
  // 3. Si empieza con 9 y tiene ~12 dígitos (falta el 54)
  if (normalized.startsWith('9') && normalized.length >= 11 && normalized.length <= 13) {
    normalized = '54' + normalized;
    console.log(`  🔧 Agregado 54: ${normalized}`);
    return normalized;
  }
  
  // 4. Si solo tiene 10 dígitos (número local sin código de país)
  if (normalized.length === 10) {
    normalized = '549' + normalized;
    console.log(`  🔧 Agregado 549: ${normalized}`);
    return normalized;
  }
  
  // 5. Si tiene menos de 10 dígitos, probablemente está mal
  if (normalized.length < 10) {
    console.log(`  ⚠️  Número muy corto, no se modificará: ${normalized}`);
    return phone; // Retornar original sin cambios
  }
  
  // 6. Si llegamos aquí y tiene más de 13 dígitos, algo está muy mal
  if (normalized.length > 13) {
    console.log(`  ⚠️  Número muy largo, no se modificará: ${normalized}`);
    return phone; // Retornar original sin cambios
  }
  
  console.log(`  ✅ Normalizado: ${normalized}`);
  return normalized;
}

async function fixPhoneNumbers() {
  try {
    console.log('🚀 Iniciando corrección de números de teléfono...\n');
    
    await initDb();
    
    // 1. Corregir números en Users
    console.log('📱 Corrigiendo números en tabla Users...');
    const users: any[] = await User.findAll({
      where: {
        phone: { [Op.ne]: null }
      }
    });
    
    let usersFixed = 0;
    for (const user of users) {
      const original = user.phone;
      const fixed = normalizeArgentinaPhone(user.phone);
      
      if (fixed && fixed !== original) {
        await user.update({ phone: fixed });
        console.log(`  ✅ Usuario ${user.email}: ${original} -> ${fixed}`);
        usersFixed++;
      }
    }
    console.log(`✅ Usuarios actualizados: ${usersFixed}/${users.length}\n`);
    
    // 2. Corregir números en Business
    console.log('📱 Corrigiendo números en tabla Business...');
    const businesses: any[] = await Business.findAll();
    
    let businessesFixed = 0;
    for (const business of businesses) {
      let updated = false;
      const updates: any = {};
      
      // Corregir phone
      if (business.phone) {
        const fixed = normalizeArgentinaPhone(business.phone);
        if (fixed && fixed !== business.phone) {
          updates.phone = fixed;
          console.log(`  📞 Business ${business.name} - phone: ${business.phone} -> ${fixed}`);
          updated = true;
        }
      }
      
      // Corregir whatsappNumber
      if (business.whatsappNumber) {
        const fixed = normalizeArgentinaPhone(business.whatsappNumber);
        if (fixed && fixed !== business.whatsappNumber) {
          updates.whatsappNumber = fixed;
          console.log(`  💬 Business ${business.name} - whatsapp: ${business.whatsappNumber} -> ${fixed}`);
          updated = true;
        }
      }
      
      if (updated) {
        await business.update(updates);
        businessesFixed++;
      }
    }
    console.log(`✅ Negocios actualizados: ${businessesFixed}/${businesses.length}\n`);
    
    // 3. Corregir números en Bookings
    console.log('📱 Corrigiendo números en tabla Bookings...');
    const bookings: any[] = await Booking.findAll({
      where: {
        customerPhone: { [Op.ne]: null }
      }
    });
    
    let bookingsFixed = 0;
    for (const booking of bookings) {
      const original = booking.customerPhone;
      const fixed = normalizeArgentinaPhone(booking.customerPhone);
      
      if (fixed && fixed !== original) {
        await booking.update({ customerPhone: fixed });
        console.log(`  ✅ Reserva ${booking.uniqueId}: ${original} -> ${fixed}`);
        bookingsFixed++;
      }
    }
    console.log(`✅ Reservas actualizadas: ${bookingsFixed}/${bookings.length}\n`);
    
    // Resumen final
    console.log('=' .repeat(60));
    console.log('🎉 ¡Corrección completada!');
    console.log('=' .repeat(60));
    console.log(`📊 Resumen:`);
    console.log(`  • Usuarios corregidos: ${usersFixed}/${users.length}`);
    console.log(`  • Negocios corregidos: ${businessesFixed}/${businesses.length}`);
    console.log(`  • Reservas corregidas: ${bookingsFixed}/${bookings.length}`);
    console.log(`  • Total de registros corregidos: ${usersFixed + businessesFixed + bookingsFixed}`);
    console.log('=' .repeat(60));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al corregir números:', error);
    process.exit(1);
  }
}

fixPhoneNumbers();
