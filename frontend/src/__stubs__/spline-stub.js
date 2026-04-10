// Server-side stub for @splinetool/react-spline
// The real library uses browser WebGL APIs at module init level, which breaks SSR
function SplineStub() {
  return null;
}
module.exports = SplineStub;
module.exports.default = SplineStub;
