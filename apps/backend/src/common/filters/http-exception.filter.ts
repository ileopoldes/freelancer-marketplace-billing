import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { log } from 'console'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const request = ctx.getRequest()
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message:
        status !== HttpStatus.INTERNAL_SERVER_ERROR
          ? exception instanceof Error
            ? exception.message
            : 'Bad request'
          : 'Internal server error',
    }

    const errorDetails = {
      requestId: host?.getArgs()[0]?.headers?.['x-request-id'] || 'N/A',
      stackTrace: exception instanceof Error ? exception.stack : 'N/A',
      originalError: exception instanceof Error ? exception : 'Unknown error',
      requestMethod: request.method,
      requestUrl: request.url,
      requestBody: request.body,
    }

    Logger.error(
      `HTTP Exception: ${JSON.stringify(errorResponse)}`,
      { ...errorDetails },
      'HttpExceptionFilter',
    )

    Logger.debug(
      `HttpExceptionFilter - Request ID: ${errorDetails.requestId}, Method: ${errorDetails.requestMethod}, URL: ${errorDetails.requestUrl}`,
      request,
    )

    response.status(status).json(errorResponse)
  }
}
