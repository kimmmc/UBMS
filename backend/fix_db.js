const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://kimclarat23_db_user:qFYOTf3BfF6zDWQE@final.y7h2fks.mongodb.net/?appName=final';

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;

    const testInterest = await db.collection('userinterests').findOne({});
    console.log('Type of busScheduleId:', typeof testInterest.busScheduleId, testInterest.busScheduleId.constructor.name);
    console.log('Value:', testInterest.busScheduleId);

    // FIX: Update all userinterests to use Strings
    const allInterests = await db.collection('userinterests').find({}).toArray();
    let updated = 0;
    for (const interest of allInterests) {
      if (typeof interest.busScheduleId === 'object') {
        await db.collection('userinterests').updateOne(
          { _id: interest._id },
          { $set: {
              userId: interest.userId.toString(),
              busScheduleId: interest.busScheduleId.toString(),
              pickupPointId: interest.pickupPointId ? interest.pickupPointId.toString() : null
            }
          }
        );
        updated++;
      }
    }
    console.log(`Updated ${updated} userinterests to use String IDs instead of ObjectIds.`);

    // Wait, let's also fix busschedules?
    // BusSchedule schema: busId: { type: String }, routeId: { type: String }
    const schedules = await db.collection('busschedules').find({}).toArray();
    let updatedSchedules = 0;
    for (const s of schedules) {
      let needsUpdate = false;
      const setFields = {};
      if (typeof s.busId === 'object') {
         setFields.busId = s.busId.toString();
         needsUpdate = true;
      }
      if (typeof s.routeId === 'object' && s.routeId !== null) {
         setFields.routeId = s.routeId.toString();
         needsUpdate = true;
      }
      if (needsUpdate) {
         await db.collection('busschedules').updateOne({ _id: s._id }, { $set: setFields });
         updatedSchedules++;
      }
    }
    console.log(`Updated ${updatedSchedules} busschedules to use String IDs instead of ObjectIds.`);

  } catch (error) {
    console.error(error);
  } finally {
    mongoose.disconnect();
  }
}

run();
