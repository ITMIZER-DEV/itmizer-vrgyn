export interface Profile {
    fullName: string | null;
    email: string | null;
    theme?: string | null;
}

export interface User {
    id: string;
    email: string;
    roles: string[];
    profile?: Profile;
    isActive?: boolean;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface RegisterDto {
    email: string;
    password: string;
    fullName: string;
}
