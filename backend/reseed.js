const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://kimclarat23_db_user:qFYOTf3BfF6zDWQE@final.y7h2fks.mongodb.net/?appName=final';

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;

    console.log('Finding test users...');
    const testUsers = await db.collection('users').find({ name: { $regex: /Test Passenger/ } }).toArray();
    const testUserIds = testUsers.map(u => u._id);
    const testUserIdsStrings = testUsers.map(u => u._id.toString());
    
    // Delete all their existing bad interests (with ObjectIds)
    const delRes1 = await db.collection('userinterests').deleteMany({ userId: { $in: testUserIds } });
    const delRes2 = await db.collection('userinterests').deleteMany({ userId: { $in: testUserIdsStrings } });
    console.log(`Deleted ${delRes1.deletedCount + delRes2.deletedCount} old test interests.`);

    // Re-seed for all active schedules
    const schedules = await db.collection('busschedules').find({ status: { $in: ['scheduled', 'in-transit'] } }).toArray();
    console.log(`Found ${schedules.length} active schedules.`);

    const point = await db.collection('pickuppoints').findOne({});
    const defaultPickupPointIdStr = point ? point._id.toString() : null;

    let count = 0;
    const operations = [];

    for (const schedule of schedules) {
        let pickupPointIdStr = defaultPickupPointIdStr;
        if (schedule.estimatedArrivalTimes && schedule.estimatedArrivalTimes.length > 0) {
            const pid = schedule.estimatedArrivalTimes[0].pickupPointId;
            pickupPointIdStr = pid ? pid.toString() : defaultPickupPointIdStr;
        }

        for (const user of testUsers) {
            operations.push({
                insertOne: {
                    document: {
                        userId: user._id.toString(),
                        busScheduleId: schedule._id.toString(),
                        pickupPointId: pickupPointIdStr,
                        status: 'interested',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                }
            });
            count++;
        }
    }

    if (operations.length > 0) {
        await db.collection('userinterests').bulkWrite(operations);
        console.log(`Successfully bulk inserted ${count} test interests with String IDs!`);
    } else {
        console.log('No operations to perform.');
    }

  } catch (error) {
    console.error(error);
  } finally {
    mongoose.disconnect();
  }
}

run();
