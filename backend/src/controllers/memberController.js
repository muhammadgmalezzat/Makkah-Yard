const Member = require("../models/Member");

const updateMember = async (req, res, next) => {
  try {
    const { fullName, phone, email, gender, nationalId, dateOfBirth } =
      req.body;
    const member = await Member.findByIdAndUpdate(
      req.params.id,
      { $set: { fullName, phone, email, gender, nationalId, dateOfBirth } },
      { new: true, runValidators: true },
    );
    if (!member) {
      return res
        .status(404)
        .json({ success: false, message: "العضو غير موجود" });
    }
    res.json({
      success: true,
      message: "تم تحديث بيانات العضو",
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateMember,
};
