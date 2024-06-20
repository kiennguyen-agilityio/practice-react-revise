import STATUS_CODE from '@app/constants/statusCode';

type CustomErrors = {
  messageError: string;
  status: number;
};

const customErrors = <T>(response: Response, items: T): T => {
  switch (response.status) {
    case STATUS_CODE.OK:
    case STATUS_CODE.CREATED:
      return items;
    case STATUS_CODE.BAD_REQUEST:
      throw {
        messageError: `${response.status} Bad Request`,
        status: response.status,
      };
    case STATUS_CODE.UNAUTHORIZED:
      throw {
        messageError: `${response.status} Unauthorized`,
        status: response.status,
      };
    case STATUS_CODE.FORBIDDEN:
      throw {
        messageError: `${response.status} Forbidden`,
        status: response.status,
      };
    case STATUS_CODE.NOT_FOUND:
      throw {
        messageError: `${response.status} Page Not Found`,
        status: response.status,
      };
    case STATUS_CODE.INTERNAL_SERVER_ERROR:
      throw {
        messageError: `${response.status} Internal Server Error`,
        status: response.status,
      };
    case STATUS_CODE.SERVER_UNAVAILABLE:
      throw {
        messageError: `${response.status} Service Unavailable`,
        status: response.status,
      };
    default:
      throw {
        messageError: `${response.status} Fail to fetch`,
        status: response.status,
      };
  }
};

export { customErrors };
export type { CustomErrors };
