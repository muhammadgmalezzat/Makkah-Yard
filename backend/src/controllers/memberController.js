const Member = require("../models/Member");

const updateMember = async (req, res, next) => {
  try {
    const { fullName, phone, email, gender, nationalId, dateOfBirth } =
      req.body;
    const memberId = req.params.id;

    // Check phone uniqueness (exclude current member)
    // if (phone) {
    //   const existingPhone = await Member.findOne({
    //     phone,
    //     _id: { $ne: memberId },
    //   });
    //   if (existingPhone) {
    //     return res.status(400).json({
    //       success: false,
    //       message: "رقم الهاتف مسجل مسبقاً",
    //     });
    //   }
    // }

    // Check nationalId uniqueness (exclude current member)
    if (nationalId) {
      const existingNationalId = await Member.findOne({
        nationalId,
        _id: { $ne: memberId },
      });
      if (existingNationalId) {
        return res.status(400).json({
          success: false,
          message: "رقم الهوية مسجل مسبقاً",
        });
      }
    }

    const member = await Member.findByIdAndUpdate(
      memberId,
      { $set: { fullName, phone, email, gender, nationalId, dateOfBirth } },
      { new: true },
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
