function validate(schema, target = "body") {
  return (req, _res, next) => {
    try {
      req[target] = schema.parse(req[target]);
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = { validate };
