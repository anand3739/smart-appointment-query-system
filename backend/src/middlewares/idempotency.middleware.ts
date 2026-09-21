import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import { sendError } from '../utils/apiResponse';

export function idempotency(req: Request, res: Response, next: NextFunction) {
  const idempotencyKey = req.headers['idempotency-key'] as string;
  if (!idempotencyKey) {
    return next();
  }

  const cacheKey = `idempotency:${idempotencyKey}`;

  redis.get(cacheKey).then((cached) => {
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.status === 'processing') {
          return sendError(
            res,
            'CONCURRENT_REQUEST',
            'A request with this idempotency key is currently processing. Please wait.',
            409
          );
        }
        if (parsed.status === 'completed') {
          // Return cached response
          return res.status(parsed.statusCode || 200).json(parsed.body);
        }
      } catch (err) {
        // Continue if parse error
      }
    }

    // Set lock
    redis.set(cacheKey, JSON.stringify({ status: 'processing' }), 'EX', 60);

    // Intercept response to cache completion
    const originalJson = res.json.bind(res);
    res.json = ((body: any) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        redis.set(
          cacheKey,
          JSON.stringify({
            status: 'completed',
            statusCode: res.statusCode,
            body,
          }),
          'EX',
          86400 // 24 hours
        );
      } else {
        // Clear lock on failure so client can retry
        redis.del(cacheKey);
      }
      return originalJson(body);
    }) as any;

    next();
  }).catch(() => {
    next();
  });
}
