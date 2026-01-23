import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

export interface SystemConfigAttributes {
  id: string;
  key: string;
  value: string;
  updatedAt: Date;
}

type SystemConfigCreationAttributes = Optional<
  SystemConfigAttributes,
  "id" | "updatedAt"
>;

export class SystemConfig
  extends Model<SystemConfigAttributes, SystemConfigCreationAttributes>
  implements SystemConfigAttributes
{
  declare id: string;
  declare key: string;
  declare value: string;
  declare updatedAt: Date;
}

SystemConfig.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: sequelize.literal('gen_random_uuid()'),
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    },
  },
  {
    sequelize,
    tableName: "SystemConfig",
    timestamps: false,
  }
);
