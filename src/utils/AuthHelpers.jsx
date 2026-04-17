// Shared role utilities — import wherever needed

/**
 * Get the primary role from the user's roles array.
 * Priority: ADMIN > VENDOR > SUPPLIER > OPERATOR > CUSTOMER
 */
export function getPrimaryRole(user) {
  if (!user) return null;
  const roles = user.roles || [];
  if (roles.includes("ADMIN")) return "ADMIN";
  if (roles.includes("VENDOR")) return "VENDOR";
  if (roles.includes("SUPPLIER")) return "SUPPLIER";
  if (roles.includes("OPERATOR")) return "OPERATOR";
  return "CUSTOMER";
}

/**
 * Get the default landing route for a user after login/registration.
 */
export function getDefaultRoute(user) {
  const role = getPrimaryRole(user);
  switch (role) {
    case "ADMIN":
      return "/app/kiosk-home"; // admin can navigate anywhere from sidebar
    case "VENDOR":
      return "/app/business";
    case "SUPPLIER":
      return "/app/supplier";
    case "OPERATOR":
      return "/app/operator";
    default:
      return "/app/kiosk-home"; // CUSTOMER
  }
}

/**
 * Map a ?role= query param to a roles array for registration payload.
 */
export function roleParamToRoles(roleParam) {
  if (!roleParam) return ["CUSTOMER"];
  const map = {
    vendor: ["VENDOR"],
    supplier: ["SUPPLIER"],
    operator: ["OPERATOR"],
    customer: ["CUSTOMER"],
  };
  return map[roleParam.toLowerCase()] || ["CUSTOMER"];
}
