class ApiResponse<T> {
  public success = true;

  constructor(
    public statusCode: number,
    public data: T,
    public message: string = "Success"
  ) {
    // this.success = statusCode < 400;            // Onely if ApiError handles both response and error
  }
}

export default ApiResponse;