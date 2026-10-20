import { get, put } from './request'
import type { UpdatePasswordRequest, UpdateProfileRequest, UserVO } from '@/types/user'

/** 当前用户信息 GET /users/me */
export function getMe(): Promise<UserVO> {
  return get('/users/me')
}

/** 更新当前用户资料 PUT /users/me，返回最新 UserVO */
export function updateProfile(data: UpdateProfileRequest): Promise<UserVO> {
  return put('/users/me', data)
}

/** 修改密码 PUT /users/me/password（成功后后端使 refresh token 失效，需重新登录） */
export function updatePassword(data: UpdatePasswordRequest): Promise<void> {
  return put('/users/me/password', data)
}
