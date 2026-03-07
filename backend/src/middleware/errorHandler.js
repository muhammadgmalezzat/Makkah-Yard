const errorHandler = (err, req, res, next) => {
  console.error(err);

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
    const fieldMessages = {
      phone: "رقم الهاتف مسجل مسبقاً",
      nationalId: "رقم الهوية مسجل مسبقاً",
      email: "البريد الإلكتروني مسجل مسبقاً",
    };
    const message = fieldMessages[field] || "هذه البيانات مسجلة مسبقاً";
    return res.status(400).json({ message });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    return res.status(400).json({ message: messages });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "رمز غير صحيح" });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "انتهت صلاحية الرمز" });
  }

  // Default error
  return res.status(err.status || 500).json({
    message: err.message || "حدث خطأ في الخادم",
  });
};

module.exports = errorHandler;
