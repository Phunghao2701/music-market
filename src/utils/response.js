/**
 * Uniform response helper class to standardize API responses
 */
export class ApiResponse {
  /**
   * Send a success response
   * @param {object} res Express response object
   * @param {string} message Description message of success
   * @param {any} data Response data payload
   * @param {number} statusCode HTTP Status code (default 200)
   */
  static success(res, message = 'Success', data = null, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  /**
   * Send an error response
   * @param {object} res Express response object
   * @param {string} message Description message of error
   * @param {number} statusCode HTTP Status code (default 500)
   * @param {any} errors Optional detailed errors (validation errors, etc.)
   */
  static error(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
    const responsePayload = {
      success: false,
      message,
    };

    if (errors) {
      responsePayload.errors = errors;
    }

    return res.status(statusCode).json(responsePayload);
  }
}
