import HttpStatus from 'http-status-codes';

export const HTTP_ERROR_STATUSES = [
  HttpStatus.BAD_REQUEST,
  HttpStatus.CONFLICT,
  HttpStatus.FORBIDDEN,
  HttpStatus.INTERNAL_SERVER_ERROR,
  HttpStatus.LOCKED,
  HttpStatus.METHOD_NOT_ALLOWED,
  HttpStatus.NOT_FOUND,
  HttpStatus.PAYMENT_REQUIRED,
  HttpStatus.REQUEST_TIMEOUT,
  HttpStatus.REQUEST_TOO_LONG,
  HttpStatus.SERVICE_UNAVAILABLE,
  HttpStatus.TOO_MANY_REQUESTS,
  HttpStatus.UNAUTHORIZED,
  HttpStatus.UNSUPPORTED_MEDIA_TYPE,
];

export const filterHttpStatus = (s) => (HTTP_ERROR_STATUSES.includes(s) ? s : 'default');
