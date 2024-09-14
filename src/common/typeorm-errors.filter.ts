import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { Response } from 'express';
import { EntityNotFoundError, QueryFailedError, TypeORMError } from 'typeorm';
import { DatabaseError } from 'pg';

@Catch(TypeORMError)
export class TypeORMErrorsFilter implements ExceptionFilter {
  logger = new Logger(TypeORMErrorsFilter.name);

  catch(exception: TypeORMError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = 500;
    let message = 'Internal server error';
    switch (exception.constructor) {
      case EntityNotFoundError:
        status = 404;
        message = 'Not Found';
        break;
      case QueryFailedError: {
        switch ((exception as QueryFailedError).driverError.constructor) {
          case DatabaseError:
            const e = exception as QueryFailedError<DatabaseError>;
            if (
              e.message.includes(
                'duplicate key value violates unique constraint',
              )
            ) {
              const entityName = e.driverError.table ?? 'entity';
              message = `New ${entityName} conflicts with existing ${entityName}${e.driverError.detail ? `: ${e.driverError.detail}` : '.'}`;
              status = 409;
            }
            break;
        }
        break;
      }
    }

    if (status === 500) {
      this.logger.error(
        'Unknown TypeORM error',
        exception.message,
        exception.stack,
      );
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message,
    });
  }
}
