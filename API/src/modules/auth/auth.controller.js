function createAuthController(authService) {
  return {
    login: async (req, res, next) => {
      try {
        const result = await authService.login(req.body);
        return res.json(result);
      } catch (error) {
        return next(error);
      }
    },
  };
}

module.exports = { createAuthController };
