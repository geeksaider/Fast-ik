import type { RequestHandler } from 'express';

type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
  message: string;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export const createRateLimit = (options: RateLimitOptions): RequestHandler => {
  const buckets = new Map<string, RateLimitBucket>();

  return (request, response, next) => {
    const now = Date.now();
    const key = request.ip ?? request.socket.remoteAddress ?? 'unknown';
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    bucket.count += 1;

    if (bucket.count > options.maxRequests) {
      response
        .status(429)
        .setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000).toString())
        .json({ error: { message: options.message } });
      return;
    }

    next();
  };
};
