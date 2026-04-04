const mongoose = require('mongoose')

const renewalHistorySchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    type: {
      type: String,
      enum: ['renewal', 'package_change', 'upgrade', 'downgrade'],
      required: true,
    },
    previousPackageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
    },
    newPackageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
    },
    previousEndDate: Date,
    newStartDate: Date,
    newEndDate: Date,
    durationMonths: Number,
    pricePaid: Number,
    paymentMethod: String,
    affectedMembers: [
      {
        memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
        fullName: String,
        role: String,
        action: {
          type: String,
          enum: ['archived', 'added', 'kept'],
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('RenewalHistory', renewalHistorySchema)
