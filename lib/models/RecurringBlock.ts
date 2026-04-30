import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "@/lib/sequelize";

export interface RecurringBlockAttributes {
  id: string;
  businessId: string;
  serviceId: string | null;
  dayOfWeek: number;          // 0 (Dom) – 6 (Sáb)
  startTime: string;          // "HH:MM"
  endTime: string;            // "HH:MM"
  label: string | null;
  startDate: string | null;   // "YYYY-MM-DD"
  endDate: string | null;     // "YYYY-MM-DD"
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type RecurringBlockCreationAttributes = Optional<
  RecurringBlockAttributes,
  "id" | "serviceId" | "label" | "startDate" | "endDate" | "isActive" | "createdAt" | "updatedAt"
>;

export class RecurringBlock
  extends Model<RecurringBlockAttributes, RecurringBlockCreationAttributes>
  implements RecurringBlockAttributes
{
  declare id: string;
  declare businessId: string;
  declare serviceId: string | null;
  declare dayOfWeek: number;
  declare startTime: string;
  declare endTime: string;
  declare label: string | null;
  declare startDate: string | null;
  declare endDate: string | null;
  declare isActive: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
}

RecurringBlock.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: sequelize.literal("gen_random_uuid()"),
      primaryKey: true,
    },
    businessId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    serviceId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    dayOfWeek: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0, max: 6 },
    },
    startTime: {
      type: DataTypes.STRING(5),
      allowNull: false,
    },
    endTime: {
      type: DataTypes.STRING(5),
      allowNull: false,
    },
    label: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
    },
  },
  {
    sequelize,
    tableName: "RecurringBlock",
    modelName: "RecurringBlock",
    timestamps: true,
    indexes: [
      { fields: ["businessId", "dayOfWeek", "isActive"] },
      { fields: ["serviceId"] },
    ],
  }
);
