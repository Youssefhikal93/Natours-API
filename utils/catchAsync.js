// module.exports = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (error) {
//     next(error);
//   }
// };

module.exports = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};
