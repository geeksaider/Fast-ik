import 'dotenv/config';

const numberFromEnv = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  apiPort: numberFromEnv(process.env.API_PORT, 4200),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  databaseUrl:
    process.env.DATABASE_URL ?? 'postgresql://fastik:fastik_password@localhost:5432/fastik',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'change_me_access_secret',
  jwtAccessTtl: process.env.JWT_ACCESS_TTL ?? '2h',
};
