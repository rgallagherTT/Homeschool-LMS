import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, any>;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((responseData) => {
        // If the response already has a success property, pass through
        if (responseData && typeof responseData === 'object' && 'success' in responseData) {
          return responseData;
        }

        // Extract meta if present
        let data = responseData;
        let meta: Record<string, any> | undefined;

        if (responseData && typeof responseData === 'object' && '_meta' in responseData) {
          const { _meta, ...rest } = responseData;
          meta = _meta;
          data = rest.data !== undefined ? rest.data : rest;
        }

        return {
          success: true,
          data,
          ...(meta && { meta }),
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
