const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
const mongoose = require('mongoose')
const Member = require('../models/Member')

async function run() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('✅ Connected')

  const result = await Member.updateMany(
    { role: 'child', phone: { $exists: true, $ne: '' } },
    { $set: { phone: '' } }
  )

  console.log('✅ Cleared phone for', result.modifiedCount, 'children')
  process.exit(0)
}

run().catch(err => { console.error(err); process.exit(1) })
