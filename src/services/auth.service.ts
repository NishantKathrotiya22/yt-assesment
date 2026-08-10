import { userRepository } from '../repositories/user.repository';
import { refreshTokenRepository } from '../repositories/refresh-token.repository';
import { RefreshToken } from '../entities/RefreshToken.entity';
import { User, UserRole } from '../entities/User.entity';
import { comparePassword } from '../utils/password.util';
import { signAccessToken, signRefreshToken, verifyRefreshToken, getTokenExpiry } from '../utils/jwt.util';
import { hashToken } from '../utils/crypto.util';
import { ApiError } from '../utils/ApiError';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

async function issueTokenPair(userId: string, role: UserRole): Promise<TokenPair & { record: RefreshToken }> {
  const accessToken = signAccessToken({ sub: userId, role });
  const refreshToken = signRefreshToken({ sub: userId });
  const record = await refreshTokenRepository.create({
    userId,
    tokenHash: hashToken(refreshToken),
    expiresAt: getTokenExpiry(refreshToken),
  });
  return { accessToken, refreshToken, record };
}

function sanitizeUser(user: User) {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

export async function login(email: string, password: string) {
  const user = await userRepository.findByEmailWithPassword(email);
  if (!user) throw new ApiError('AUTH_INVALID_CREDENTIALS');

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw new ApiError('AUTH_INVALID_CREDENTIALS');

  const { record: _record, ...tokens } = await issueTokenPair(user.id, user.role);
  return { user: sanitizeUser(user), ...tokens };
}

export async function refresh(refreshToken: string): Promise<TokenPair> {
  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError('AUTH_REFRESH_TOKEN_INVALID');
  }

  const stored = await refreshTokenRepository.findByHash(hashToken(refreshToken));
  if (!stored) throw new ApiError('AUTH_REFRESH_TOKEN_INVALID');

  if (stored.revokedAt) {
    // A previously-rotated token came back — treat as theft and kill every session for this user.
    await refreshTokenRepository.revokeAllForUser(stored.userId);
    throw new ApiError('AUTH_REFRESH_TOKEN_REUSED');
  }

  if (stored.expiresAt.getTime() < Date.now()) {
    throw new ApiError('AUTH_REFRESH_TOKEN_INVALID');
  }

  const user = await userRepository.findById(payload.sub);
  if (!user) throw new ApiError('AUTH_REFRESH_TOKEN_INVALID');

  const { record, ...tokens } = await issueTokenPair(user.id, user.role);
  await refreshTokenRepository.revoke(stored.id, record.id);

  return tokens;
}

export async function logout(refreshToken: string): Promise<void> {
  const stored = await refreshTokenRepository.findByHash(hashToken(refreshToken));
  if (stored && !stored.revokedAt) {
    await refreshTokenRepository.revoke(stored.id);
  }
}
