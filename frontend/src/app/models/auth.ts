import { UserState } from './user';

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserState;
}

export interface TokenPayload {
  sub: string;
  role: string;
  is_active?: boolean;
}
