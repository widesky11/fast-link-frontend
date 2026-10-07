/** 用户信息，与后端 UserVO 对应 */
export interface UserVO {
  /** 雪花 ID，后端序列化为字符串避免精度丢失 */
  id: string
  username: string
  nickname: string | null
  email: string | null
  createTime: string
}

/** 登录 / 刷新成功返回，与后端 LoginVO 对应 */
export interface LoginVO {
  accessToken: string
  refreshToken: string
  /** accessToken 有效秒数 */
  accessExpiresIn: number
  user: UserVO
}

/** 注册成功返回，与后端 RegisterVO 对应 */
export interface RegisterVO {
  userId: string
}

/** 登录请求，与后端 LoginRequest 对应 */
export interface LoginRequest {
  username: string
  password: string
}

/** 注册请求，与后端 RegisterRequest 对应 */
export interface RegisterRequest {
  username: string
  password: string
  nickname?: string
  email?: string
}
