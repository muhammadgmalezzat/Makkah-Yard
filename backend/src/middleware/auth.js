const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "عدم التفويض: لا يوجد رمز" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res
        .status(401)
        .json({ message: "عدم التفويض: المستخدم غير موجود" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "عدم التفويض: رمز غير صحيح" });
  }
};

const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "ممنوع: ليس لديك صلاحية" });
    }
    next();
  };
};

module.exports = { protect, allowRoles };
