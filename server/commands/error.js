class CustomError extends Error {
  constructor(name, message) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }
    this.name = name;
  }
}

module.exports = CustomError;
