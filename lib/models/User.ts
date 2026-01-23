import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";
import { UserRole } from "../emuns";
// No usar 'type' imports para asociaciones de Sequelize
// import type { Business } from "./Business";
// import type { Account } from "./Account";
// import type { Session } from "./Session";
// import type { EmailVerification } from "./EmailVerification";

/**
 * Atributos que EXISTEN en la DB
 */
export interface UserAttributes {
  id: string;
  email: string;
  password: string | null;
  name: string;
  phone: string | null;
  role: typeof UserRole[keyof typeof UserRole];
  isEmailVerified: boolean;
  image: string | null;
  createdAt: Date;
}

/**
 * Atributos requeridos SOLO al crear
 */
export type UserCreationAttributes = Optional<
  UserAttributes,
  "id" | "password" | "phone" | "image" | "createdAt"
>;

export class User extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  declare id: string;
  declare email: string;
  declare password: string | null;
  declare name: string;
  declare phone: string | null;
  declare role: typeof UserRole[keyof typeof UserRole];
  declare isEmailVerified: boolean;
  declare image: string | null;
  declare createdAt: Date;

    // 👇 ASOCIACIONES (CLAVE)
  declare business?: any; // Business
  declare accounts?: any[]; // Account[]
  declare sessions?: any[]; // Session[]
  declare emailVerifications?: any[]; // EmailVerification[]
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: sequelize.literal('gen_random_uuid()'),
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      defaultValue: UserRole.BUSINESS_OWNER,
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    },
  },
  {
    sequelize,
    tableName: "User",
    timestamps: false,
  }
);
