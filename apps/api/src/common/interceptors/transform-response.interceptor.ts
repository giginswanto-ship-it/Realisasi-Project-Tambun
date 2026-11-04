import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '@tambun/shared';

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((resData) => {
        // If service returns custom object with { message, data, meta }
        if (resData && typeof resData === 'object' && ('data' in resData || 'message' in resData)) {
          return {
            success: true,
            statusCode,
            message: resData.message || 'Operasi berhasil dieksekusi.',
            data: resData.data !== undefined ? resData.data : resData,
            meta: resData.meta || undefined,
            timestamp: new Date().toISOString(),
          };
        }

        return {
          success: true,
          statusCode,
          message: 'Operasi berhasil dieksekusi.',
          data: resData,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
