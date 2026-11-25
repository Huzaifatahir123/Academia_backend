
export interface AuthenticatedUser {
  id: bigint;
  roleId: bigint;
  firstName: string;
  roleName: string;
  lastName: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
