import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { Response } from 'express';
import { DatabaseError } from 'pg';
import { EntityNotFoundError, QueryFailedError, TypeORMError } from 'typeorm';

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
            const entityName = (e.driverError.table ?? 'entity').replace(
              /_/g,
              ' ',
            );
            const operation = e.query.startsWith('INSERT')
              ? 'creation'
              : e.query.startsWith('UPDATE')
                ? 'update'
                : e.query.startsWith('DELETE')
                  ? 'deletion'
                  : 'operation';
            if (
              e.message.includes(
                'duplicate key value violates unique constraint',
              )
            ) {
              message = `New ${entityName} conflicts with existing ${entityName}${e.driverError.detail ? `: ${e.driverError.detail}` : '.'}`;
              status = 409;
            } else if (
              e.message.includes('violates foreign key constraint') ||
              e.message.includes('violates check constraint')
            ) {
              message = `An existing ${entityName} is not allowing this ${operation} to complete.`;
              status = 400;
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
