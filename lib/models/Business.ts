import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "@/lib/sequelize";
// No importar modelos relacionados aquí para evitar referencias circulares
// import { User } from "./User";
// import { Service } from "./Service";
// import { Booking } from "./Booking";
// import { BusinessHours } from "./BusinessHours";

/* =====================
   ATTRIBUTES
===================== */

export interface BusinessAttributes {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsappNumber?: string | null;
  isActive: boolean;
  createdAt: Date;
}

/* =====================
   CREATION ATTRIBUTES
===================== */

type BusinessCreationAttributes = Optional<
  BusinessAttributes,
  "id" | "description" | "address" | "phone" | "whatsappNumber" | "isActive" | "createdAt"
>;

/* =====================
   MODEL
===================== */

export class Business
  extends Model<BusinessAttributes, BusinessCreationAttributes>
  implements BusinessAttributes
{
  declare id: string;
  declare userId: string;
  declare name: string;
  declare slug: string;
  declare description: string | null;
  declare address: string | null;
  declare phone: string | null;
  declare whatsappNumber: string | null;
  declare isActive: boolean;
  declare createdAt: Date;

  // ✅ ASSOCIATIONS - Usar any para evitar referencias circulares
  declare user?: any; // User
  declare services?: any[]; // Service[]
  declare bookings?: any[]; // Booking[]
  declare hours?: any[]; // BusinessHours[]
}

Business.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: sequelize.literal('gen_random_uuid()'),
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    whatsappNumber: {
      type: DataTypes.STRING,
      allowNull: true,
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
    tableName: "Business",
    modelName: "Business",
    timestamps: false,
  }
);
