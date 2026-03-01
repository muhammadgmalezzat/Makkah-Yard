const Account = require("../models/Account");
const Member = require("../models/Member");
const Subscription = require("../models/Subscription");
const Payment = require("../models/Payment");
const AuditLog = require("../models/AuditLog");

const createNewSubscription = async ({
  memberData,
  packageData,
  paymentData,
  userId,
}) => {
  try {
    // 1. Create Account
    const account = new Account({
      type: packageData.category,
      createdBy: userId,
    });
    await account.save();

    // 2. Create Member
    const member = new Member({
      accountId: account._id,
      ...memberData,
      role: "primary",
    });
    await member.save();

    // 3. Update Account.primaryMemberId
    account.primaryMemberId = member._id;
    await account.save();

    // 4. Calculate subscription dates
    const startDate = new Date(paymentData.startDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + packageData.durationMonths);

    // 5. Create Subscription
    const subscription = new Subscription({
      memberId: member._id,
      accountId: account._id,
      packageId: packageData._id,
      type: packageData.sport === "general" ? "gym" : "academy",
      startDate,
      endDate,
      pricePaid: packageData.price,
      sport: packageData.sport,
      status: "active",
      createdBy: userId,
    });
    await subscription.save();

    // 6. Create Payment
    const payment = new Payment({
      subscriptionId: subscription._id,
      memberId: member._id,
      amount: packageData.price,
      method: paymentData.method,
      type: "new",
      paidAt: new Date(paymentData.paidAt || new Date()),
      createdBy: userId,
    });
    await payment.save();

    // 7. Create AuditLog
    const auditLog = new AuditLog({
      action: "create_subscription",
      subscriptionId: subscription._id,
      performedBy: userId,
      after: {
        subscription: subscription.toObject(),
        member: member.toObject(),
        account: account.toObject(),
      },
    });
    await auditLog.save();

    return {
      subscription,
      member,
      account,
      payment,
    };
  } catch (error) {
    throw error;
  }
};

const renewSubscription = async ({
  subscriptionId,
  packageData,
  paymentData,
  userId,
}) => {
  try {
    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      throw new Error("الاشتراك غير موجود");
    }

    // Store before state
    const before = subscription.toObject();

    // Calculate new dates
    const startDate = new Date(paymentData.startDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + packageData.durationMonths);

    // Update subscription
    subscription.status = "renewed";
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    subscription.packageId = packageData._id;
    subscription.pricePaid = packageData.price;
    subscription.renewalCount += 1;
    subscription.freezeCount = 0;
    subscription.isFrozen = false;
    subscription.freezeStart = null;
    subscription.freezeEnd = null;

    await subscription.save();

    // Create Payment
    const payment = new Payment({
      subscriptionId: subscription._id,
      memberId: subscription.memberId,
      amount: packageData.price,
      method: paymentData.method,
      type: "renewal",
      paidAt: new Date(paymentData.paidAt || new Date()),
      createdBy: userId,
    });
    await payment.save();

    // Create AuditLog
    const auditLog = new AuditLog({
      action: "renew_subscription",
      subscriptionId: subscription._id,
      performedBy: userId,
      before,
      after: subscription.toObject(),
    });
    await auditLog.save();

    return {
      subscription,
      payment,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createNewSubscription,
  renewSubscription,
};
