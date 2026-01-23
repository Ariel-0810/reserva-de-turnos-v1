import { User } from "./User";
import { Business } from "./Business";
import { Account } from "./Account";
import { Session } from "./Session";
import { EmailVerification } from "./EmailVerification";
import { Service } from "./Service";
import { Booking } from "./Booking";
import { BusinessHours } from "./BusinessHours";

// =====================
// ASSOCIATIONS
// =====================

export function initAssociations() {
  User.hasOne(Business, { foreignKey: "userId", as: "business" });
  User.hasMany(Account, { foreignKey: "userId", as: "accounts" });
  User.hasMany(Session, { foreignKey: "userId", as: "sessions" });
  User.hasMany(EmailVerification, {
    foreignKey: "userId",
    as: "emailVerifications",
  });

  Account.belongsTo(User, { foreignKey: "userId", as: "user" });
  Session.belongsTo(User, { foreignKey: "userId", as: "user" });

  Business.belongsTo(User, { foreignKey: "userId", as: "user" });
  Business.hasMany(Service, { foreignKey: "businessId", as: "services" });
  Business.hasMany(Booking, { foreignKey: "businessId", as: "bookings" });
  Business.hasMany(BusinessHours, { foreignKey: "businessId", as: "hours" });

  Service.belongsTo(Business, { foreignKey: "businessId", as: "business" });
  Service.hasMany(Booking, { foreignKey: "serviceId", as: "bookings" });

  Booking.belongsTo(Business, { foreignKey: "businessId", as: "business" });
  Booking.belongsTo(Service, { foreignKey: "serviceId", as: "service" });
}
