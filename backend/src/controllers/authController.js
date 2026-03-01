const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "يجب إدخال البريد الإلكتروني وكلمة المرور" });
    }

    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "بيانات اعتماد غير صحيحة" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "حساب المستخدم معطل" });
    }

    const token = generateToken(user._id);
    const userObj = user.toJSON();

    res.json({
      token,
      user: userObj,
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user.toJSON());
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getMe,
};
