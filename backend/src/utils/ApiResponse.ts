class ApiResponse<T> {
  public success = true;

  constructor(
    public statusCode: number,
    public message: string = "Success",
    public data: T,
  ) {
    // this.success = statusCode < 400;            // Onely if ApiError handles both response and error
  }
}

export default ApiResponse;