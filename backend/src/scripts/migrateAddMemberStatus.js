const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
const mongoose = require('mongoose')
const Member = require('../models/Member')

async function run() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('✅ Connected')

  const total = await Member.countDocuments({})
  const needsMigration = await Member.countDocuments({ status: { $exists: false } })

  console.log('Total members:', total)
  console.log('Need migration:', needsMigration)

  if (needsMigration === 0) {
    console.log('✅ All members already have status field')
    process.exit(0)
  }

  const result = await Member.updateMany(
    { status: { $exists: false } },
    { $set: { status: 'active', archivedAt: null, archivedReason: null } }
  )

  console.log('✅ Updated:', result.modifiedCount, 'members')

  // Verify
  const afterMigration = await Member.countDocuments({ status: 'active' })
  console.log('✅ Active members after migration:', afterMigration)

  process.exit(0)
}
run().catch(err => { console.error(err); process.exit(1) })
