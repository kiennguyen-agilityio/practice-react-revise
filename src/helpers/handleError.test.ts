import { describe, expect, it } from 'vitest';

// constants
import STATUS_CODE from '@app/constants/statusCode';

// helpers
import { customErrors, HttpError } from '@app/helpers/handleError';

const makeResponse = (status: number) => ({ status }) as Response;

const catchError = (status: number) => {
  try {
    customErrors(makeResponse(status), {});
  } catch (error) {
    return error;
  }
  throw new Error(`customErrors did not throw for status ${status}`);
};

describe('customErrors', () => {
  it.each([STATUS_CODE.OK, STATUS_CODE.CREATED])(
    'returns the items untouched for status %i',
    (status) => {
      const items = { id: 1 };

      expect(customErrors(makeResponse(status), items)).toBe(items);
    },
  );

  it.each([
    [STATUS_CODE.BAD_REQUEST, '400 Bad Request'],
    [STATUS_CODE.UNAUTHORIZED, '401 Unauthorized'],
    [STATUS_CODE.FORBIDDEN, '403 Forbidden'],
    [STATUS_CODE.NOT_FOUND, '404 Page Not Found'],
    [STATUS_CODE.INTERNAL_SERVER_ERROR, '500 Internal Server Error'],
    [STATUS_CODE.SERVER_UNAVAILABLE, '503 Service Unavailable'],
    [418, '418 Fail to fetch'],
  ])('throws an HttpError with a message for status %i', (status, message) => {
    const error = catchError(status);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).status).toBe(status);
    expect((error as HttpError).message).toBe(message);
    expect((error as HttpError).message).not.toBe('');
  });

  it('keeps messageError as an alias of message', () => {
    const error = catchError(STATUS_CODE.NOT_FOUND) as HttpError;

    expect(error.messageError).toBe(error.message);
  });
});
