// app/api/signup/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { initDb } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Business } from "@/lib/models/Business";
import { BusinessHours } from "@/lib/models/BusinessHours";
import { sendEmail, newBusinessRegistrationEmailToSuperadmin } from "@/lib/email";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .trim();
}

export async function POST(request: Request) {
  try {
    await initDb();

    const body = await request.json();
    const { email, password, name, phone, businessName } = body ?? {};

    console.log("📝 Signup request:", { email, name, businessName, phone: phone ? "***" : undefined });

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    const exists = await User.findOne({ where: { email } });
    if (exists) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      phone,
      role: "BUSINESS_OWNER",
      isEmailVerified: false,
    });

    console.log("✅ Usuario creado:", user.id);

    // Use businessName from form, or fallback to user's name
    const businessNameToUse = businessName || `Negocio de ${name}`;
    const baseSlug = generateSlug(businessNameToUse);
    let slug = baseSlug;
    let counter = 1;

    // Ensure unique slug
    while (await Business.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const business = await Business.create({
      userId: user.id,
      name: businessNameToUse,
      slug: slug,
      isActive: true,
    });

    console.log("✅ Negocio creado:", slug);

    // =====================
    // HORARIOS POR DEFECTO
    // =====================
    // Lunes (1) a Sábado (6): 09:00 - 23:00 (abierto)
    // Domingo (0): Cerrado
    const defaultHours = [
      { dayOfWeek: 0, isOpen: false, openTime: "09:00", closeTime: "23:00" }, // Domingo - Cerrado
      { dayOfWeek: 1, isOpen: true, openTime: "09:00", closeTime: "23:00" },  // Lunes
      { dayOfWeek: 2, isOpen: true, openTime: "09:00", closeTime: "23:00" },  // Martes
      { dayOfWeek: 3, isOpen: true, openTime: "09:00", closeTime: "23:00" },  // Miércoles
      { dayOfWeek: 4, isOpen: true, openTime: "09:00", closeTime: "23:00" },  // Jueves
      { dayOfWeek: 5, isOpen: true, openTime: "09:00", closeTime: "23:00" },  // Viernes
      { dayOfWeek: 6, isOpen: true, openTime: "09:00", closeTime: "23:00" },  // Sábado
    ];

    await Promise.all(
      defaultHours.map((hour) =>
        BusinessHours.create({
          businessId: business.id,
          dayOfWeek: hour.dayOfWeek,
          isOpen: hour.isOpen,
          openTime: hour.openTime,
          closeTime: hour.closeTime,
        })
      )
    );

    console.log("✅ Horarios por defecto creados");

    // =====================
    // EMAIL AL SUPERADMIN
    // =====================
    const superadminEmail = process.env.SUPERADMIN_EMAIL;
    if (superadminEmail) {
      try {
        const registrationDate = new Date().toLocaleString('es-AR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        await sendEmail({
          to: superadminEmail,
          subject: `🎉 Nuevo negocio registrado: ${businessNameToUse}`,
          html: newBusinessRegistrationEmailToSuperadmin({
            ownerName: name,
            ownerEmail: email,
            ownerPhone: phone,
            businessName: businessNameToUse,
            businessSlug: slug,
            registrationDate: registrationDate,
          }),
        });

        console.log("✅ Email de notificación enviado al superadmin");
      } catch (emailError) {
        console.error("❌ Error al enviar email al superadmin:", emailError);
        // No fallar el registro si falla el email
      }
    } else {
      console.warn("⚠️  SUPERADMIN_EMAIL no configurado - no se enviará notificación");
    }

    return NextResponse.json(
      { success: true, userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Signup error:", error);
    return NextResponse.json(
      { error: "Error al registrar usuario" },
      { status: 500 }
    );
  }
}
