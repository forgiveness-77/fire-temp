const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  VIEWER: 'viewer',
};

const ALL_ROLES = Object.values(ROLES);
const CAN_WRITE = [ROLES.ADMIN, ROLES.MANAGER];

module.exports = { ROLES, ALL_ROLES, CAN_WRITE };
