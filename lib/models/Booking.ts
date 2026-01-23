import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "@/lib/sequelize";
// Evitar referencias circulares
// import { Service } from "./Service";
// import { Business } from "./Business";

/* =====================
   ATTRIBUTES
===================== */

export interface BookingAttributes {
  id: string;
  businessId: string;
  serviceId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  uniqueId: string;
  createdAt: Date;
}

/* =====================
   CREATION ATTRIBUTES
===================== */

type BookingCreationAttributes = Optional<
  BookingAttributes,
  "id" | "customerEmail" | "createdAt"
>;

/* =====================
   MODEL
===================== */

export class Booking
  extends Model<BookingAttributes, BookingCreationAttributes>
  implements BookingAttributes
{
  declare id: string;
  declare businessId: string;
  declare serviceId: string;
  declare customerName: string;
  declare customerPhone: string;
  declare customerEmail: string | null;
  declare bookingDate: string;
  declare startTime: string;
  declare endTime: string;
  declare status: "PENDING" | "CONFIRMED" | "CANCELLED";
  declare uniqueId: string;
  declare createdAt: Date;

  // ✅ ASSOCIATIONS - Usar any para evitar referencias circulares
  declare service?: any; // Service
  declare business?: any; // Business
}

Booking.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: sequelize.literal('gen_random_uuid()'),
      primaryKey: true,
    },
    businessId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    serviceId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customerPhone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customerEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bookingDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("PENDING", "CONFIRMED", "CANCELLED"),
      defaultValue: "PENDING",
    },
    uniqueId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    },
  },
  {
    sequelize,
    tableName: "Booking",
    modelName: "Booking",
    timestamps: false,
  }
);
