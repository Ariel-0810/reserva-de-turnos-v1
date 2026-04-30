import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "@/lib/sequelize";

export type PaymentMethod = "MANUAL_TRANSFER" | "MERCADOPAGO";

export interface PaymentAttributes {
  id: string;
  subscriptionId: string;
  businessId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  externalRef: string | null;
  paidAt: Date;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
}

type PaymentCreationAttributes = Optional<
  PaymentAttributes,
  "id" | "currency" | "externalRef" | "notes" | "createdAt"
>;

export class Payment
  extends Model<PaymentAttributes, PaymentCreationAttributes>
  implements PaymentAttributes
{
  declare id: string;
  declare subscriptionId: string;
  declare businessId: string;
  declare amount: number;
  declare currency: string;
  declare method: PaymentMethod;
  declare externalRef: string | null;
  declare paidAt: Date;
  declare notes: string | null;
  declare createdBy: string;
  declare createdAt: Date;
}

Payment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: sequelize.literal("gen_random_uuid()"),
      primaryKey: true,
    },
    subscriptionId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    businessId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      get() {
        const raw = this.getDataValue("amount");
        return raw === null || raw === undefined ? 0 : parseFloat(raw as unknown as string);
      },
    },
    currency: {
      type: DataTypes.STRING(8),
      allowNull: false,
      defaultValue: "ARS",
    },
    method: {
      type: DataTypes.ENUM("MANUAL_TRANSFER", "MERCADOPAGO"),
      allowNull: false,
      defaultValue: "MANUAL_TRANSFER",
    },
    externalRef: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
    },
  },
  {
    sequelize,
    tableName: "Payment",
    modelName: "Payment",
    timestamps: false,
  }
);
