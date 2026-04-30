import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "@/lib/sequelize";

export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "PAST_DUE" | "SUSPENDED" | "CANCELLED";

export interface SubscriptionAttributes {
  id: string;
  businessId: string;
  status: SubscriptionStatus;
  monthlyPrice: number;
  trialEndsAt: Date | null;
  paidUntil: Date | null;
  lastPaymentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type SubscriptionCreationAttributes = Optional<
  SubscriptionAttributes,
  "id" | "trialEndsAt" | "paidUntil" | "lastPaymentAt" | "createdAt" | "updatedAt"
>;

export class Subscription
  extends Model<SubscriptionAttributes, SubscriptionCreationAttributes>
  implements SubscriptionAttributes
{
  declare id: string;
  declare businessId: string;
  declare status: SubscriptionStatus;
  declare monthlyPrice: number;
  declare trialEndsAt: Date | null;
  declare paidUntil: Date | null;
  declare lastPaymentAt: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Subscription.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: sequelize.literal("gen_random_uuid()"),
      primaryKey: true,
    },
    businessId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM("TRIAL", "ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELLED"),
      allowNull: false,
      defaultValue: "TRIAL",
    },
    monthlyPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        const raw = this.getDataValue("monthlyPrice");
        return raw === null || raw === undefined ? 0 : parseFloat(raw as unknown as string);
      },
    },
    trialEndsAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    paidUntil: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastPaymentAt: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: "Subscription",
    modelName: "Subscription",
    timestamps: true,
  }
);
