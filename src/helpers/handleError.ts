import STATUS_CODE from '@app/constants/statusCode';

class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }

  // Kept for compatibility with the previous `{ messageError, status }` shape.
  get messageError() {
    return this.message;
  }
}

type CustomErrors = HttpError;

const ERROR_MESSAGES: Record<number, string> = {
  [STATUS_CODE.BAD_REQUEST]: 'Bad Request',
  [STATUS_CODE.UNAUTHORIZED]: 'Unauthorized',
  [STATUS_CODE.FORBIDDEN]: 'Forbidden',
  [STATUS_CODE.NOT_FOUND]: 'Page Not Found',
  [STATUS_CODE.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
  [STATUS_CODE.SERVER_UNAVAILABLE]: 'Service Unavailable',
};

const customErrors = <T>(response: Response, items: T): T => {
  switch (response.status) {
    case STATUS_CODE.OK:
    case STATUS_CODE.CREATED:
      return items;
    default: {
      const reason = ERROR_MESSAGES[response.status] ?? 'Fail to fetch';

      throw new HttpError(response.status, `${response.status} ${reason}`);
    }
  }
};

export { customErrors, HttpError };
export type { CustomErrors };
