import { DataTypes, Model } from "sequelize";
import { sequelize } from "../sequelize";

export class Account extends Model {}

Account.init(
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
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    providerAccountId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    refresh_token: DataTypes.TEXT,
    access_token: DataTypes.TEXT,
    expires_at: DataTypes.INTEGER,
    token_type: DataTypes.STRING,
    scope: DataTypes.STRING,
    id_token: DataTypes.TEXT,
    session_state: DataTypes.STRING,
  },
  {
    sequelize,
    tableName: "Account",
    timestamps: false,
    indexes: [{ unique: true, fields: ["provider", "providerAccountId"] }],
  }
);
