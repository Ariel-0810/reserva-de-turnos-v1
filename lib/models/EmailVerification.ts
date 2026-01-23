import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "@/lib/sequelize";

/* =====================
   TYPES
===================== */

interface EmailVerificationAttributes {
  id: string;
  userId: string;
  code: string;
  expiresAt: Date;
  createdAt: Date;
}

interface EmailVerificationCreationAttributes
  extends Optional<EmailVerificationAttributes, "id" | "createdAt"> {}

/* =====================
   MODEL
===================== */

export class EmailVerification
  extends Model<
    EmailVerificationAttributes,
    EmailVerificationCreationAttributes
  >
  implements EmailVerificationAttributes
{
  declare id: string;
  declare userId: string;
  declare code: string;
  declare expiresAt: Date;
  declare createdAt: Date;
}

EmailVerification.init(
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
    code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    },
  },
  {
    sequelize,
    tableName: "EmailVerification",
    timestamps: false,
  }
);
