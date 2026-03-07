const Package = require("../models/Package");

const getPackages = async (req, res, next) => {
  try {
    const { category, sport, isFlexibleDuration } = req.query;

    let filter = { isActive: true };

    if (category) {
      filter.category = category;
    }

    if (sport) {
      filter.sport = sport;
    }

    if (isFlexibleDuration !== undefined) {
      filter.isFlexibleDuration = isFlexibleDuration === "true";
    }

    const packages = await Package.find(filter).sort({ category: 1, price: 1 });

    res.json(packages);
  } catch (error) {
    next(error);
  }
};

const createPackage = async (req, res, next) => {
  try {
    const {
      name,
      category,
      sport,
      durationMonths,
      price,
      isFlexibleDuration,
      pricePerMonth,
    } = req.body;

    const pkg = new Package({
      name,
      category,
      sport,
      durationMonths,
      price,
      isFlexibleDuration,
      pricePerMonth,
    });

    await pkg.save();

    res.status(201).json(pkg);
  } catch (error) {
    next(error);
  }
};

const updatePackage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const pkg = await Package.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!pkg) {
      return res.status(404).json({ message: "الحزمة غير موجودة" });
    }

    res.json(pkg);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPackages,
  createPackage,
  updatePackage,
};
