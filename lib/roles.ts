export const ROLE_LABEL = {
  admin: "Administrador",
  supervisor: "Supervisor",
  counter: "Contador",
} as const;

export type RoleKey = keyof typeof ROLE_LABEL;
