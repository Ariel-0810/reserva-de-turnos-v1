import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "@/lib/sequelize";
// Evitar referencias circulares
// import { Business } from "./Business";
// import { Booking } from "./Booking";

/* =====================
   ATTRIBUTES
===================== */

export interface ServiceAttributes {
  id: string;
  businessId: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: number;
  isActive: boolean;
  createdAt: Date;
}

/* =====================
   CREATION ATTRIBUTES
===================== */

type ServiceCreationAttributes = Optional<
  ServiceAttributes,
  "id" | "description" | "createdAt"
>;

/* =====================
   MODEL
===================== */

export class Service
  extends Model<ServiceAttributes, ServiceCreationAttributes>
  implements ServiceAttributes
{
  declare id: string;
  declare businessId: string;
  declare name: string;
  declare description: string | null;
  declare durationMinutes: number;
  declare price: number;
  declare isActive: boolean;
  declare createdAt: Date;

  // ✅ ASSOCIATIONS - Usar any para evitar referencias circulares
  declare business?: any; // Business
  declare bookings?: any[]; // Booking[]
}

Service.init(
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    },
  },
  {
    sequelize,
    tableName: "Service",
    modelName: "Service",
    timestamps: false,
  }
);
