export {};

declare global {
    interface IBackendRes<T> {
        error?: string | string[];
        message: string | string[];
        statusCode: number | string;
        data?: T;
}

    interface ILogin {
      access_token: string;
      user: {
        email: string;
        phone: string;
        fullName: string;
        role: string;
        avatar: string;
        id: string;
      };
    }

    interface IRegister {
      _id: string,
      email: string,
      fullName: string 
  }

  interface IAppContext {
    isAuthenticated: boolean;
    user: {
      email: string;
      phone: string;
      fullName: string;
      role: string;
      avatar: string;
      id: string;
    };
  }

  interface IUser {
    email: string;
    phone: string;
    fullName: string;
    role: string;
    avatar: string;
    id: string;
  }

  interface IFetchAccount {
    user: IUser
  }

  // ================= HRM extensions =================
  interface IUserHRM extends IUser {
    employeeCode: string;
    branchCode?: string;
    departmentCode?: string;
    employmentStatus?: 'active' | 'inactive' | 'on_leave' | 'terminated';
    department?: {
      id: string;
      name: string;
      code?: string;
    };
    position?: {
      id: string;
      title: string;
      code?: string;
    };
  }

  interface IAuthTokens {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  }

  interface ILoginHRM {
    user: IUserHRM | IUser;
    tokens?: IAuthTokens; // preferred HRM shape
    access_token?: string; // backward-compat
    mfa_required?: boolean;
  }

  interface IActivateAccountReq {
    employeeCode: string;
    workEmail: string;
    idLast4?: string;
    dob?: string; // yyyy-MM-dd
    newPassword: string;
  }

  interface IActivateAccountRes {
    user: IUserHRM | IUser;
  }

}

declare module "*.png" {
  const value: import("react-native").ImageSourcePropType;
  export default value;
}

declare module "*.jpg" {
  const value: import("react-native").ImageSourcePropType;
  export default value;
}

declare module "*.png" {
  const value: import("react-native").ImageSourcePropType;
  export default value;
}