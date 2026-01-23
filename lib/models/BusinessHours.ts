import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

/* =====================
   ATTRIBUTES
===================== */

export interface BusinessHoursAttributes {
  id: string;
  businessId: string;
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

/* =====================
   CREATION ATTRIBUTES
===================== */

export interface BusinessHoursCreationAttributes
  extends Optional<BusinessHoursAttributes, "id"> {}

/* =====================
   MODEL
===================== */

export class BusinessHours
  extends Model<BusinessHoursAttributes, BusinessHoursCreationAttributes>
  implements BusinessHoursAttributes
{
  declare id: string;
  declare businessId: string;
  declare dayOfWeek: number;
  declare isOpen: boolean;
  declare openTime: string;
  declare closeTime: string;
}

BusinessHours.init(
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
    dayOfWeek: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    isOpen: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    openTime: {
      type: DataTypes.STRING,
      defaultValue: "09:00",
    },
    closeTime: {
      type: DataTypes.STRING,
      defaultValue: "23:00",
    },
  },
  {
    sequelize,
    tableName: "BusinessHours",
    timestamps: false,
  }
);
