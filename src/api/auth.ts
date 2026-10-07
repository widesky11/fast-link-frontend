import { post } from './request'
import type { LoginRequest, LoginVO, RegisterRequest, RegisterVO } from '@/types/user'

/** 登录 POST /auth/login */
export function login(data: LoginRequest): Promise<LoginVO> {
  return post('/auth/login', data)
}

/** 注册 POST /auth/register */
export function register(data: RegisterRequest): Promise<RegisterVO> {
  return post('/auth/register', data)
}

/** 注销 POST /auth/logout（后端读 Authorization 头将 jti 加入黑名单） */
export function logout(): Promise<void> {
  return post('/auth/logout')
}
