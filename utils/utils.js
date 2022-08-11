exports.defaultErrorHandling = (e, next) => {
  if (!e.statusCode) {
    e.statusCode === 500;
  }
  next(e);
}