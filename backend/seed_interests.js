const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://kimclarat23_db_user:qFYOTf3BfF6zDWQE@final.y7h2fks.mongodb.net/?appName=final';

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    const db = mongoose.connection.db;

    // 1. Get ALL scheduled or in-transit BusSchedules
    const schedules = await db.collection('busschedules').find({ status: { $in: ['scheduled', 'in-transit'] } }).toArray();
    if (schedules.length === 0) {
      console.log('No active schedules found. Cannot seed.');
      return;
    }
    console.log(`Found ${schedules.length} active schedules.`);

    // 2. Create 3 dummy users
    const dummyUsers = [];
    for(let i = 1; i <= 3; i++) {
       const res = await db.collection('users').insertOne({
           name: `Test Passenger ${i}`,
           email: `passenger${i}_${Date.now()}@test.com`,
           password: 'hashedpassword',
           role: 'passenger',
           phone: `+25078${Math.floor(1000000 + Math.random() * 9000000)}`,
           createdAt: new Date(),
           updatedAt: new Date()
       });
       dummyUsers.push({ _id: res.insertedId, name: `Test Passenger ${i}` });
    }
    console.log('Created 3 mock passenger users.');

    // 3. Get a pickup point
    const point = await db.collection('pickuppoints').findOne({});
    let defaultPickupPointId = point ? point._id : null;

    if (!defaultPickupPointId) {
        console.log('No pickup points found. Creating a mock pickup point...');
        const res = await db.collection('pickuppoints').insertOne({
            name: "Mock Pickup Point",
            location: { type: "Point", coordinates: [30.0, -1.9] },
            description: "A test pickup point",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        defaultPickupPointId = res.insertedId;
    }

    // 4. Create UserInterests for ALL schedules
    let count = 0;
    for (const schedule of schedules) {
        let pickupPointId = defaultPickupPointId;
        if (schedule.estimatedArrivalTimes && schedule.estimatedArrivalTimes.length > 0) {
            pickupPointId = schedule.estimatedArrivalTimes[0].pickupPointId;
        }

        for (const user of dummyUsers) {
            await db.collection('userinterests').insertOne({
              userId: user._id,
              busScheduleId: schedule._id,
              pickupPointId: pickupPointId,
              status: 'interested',
              createdAt: new Date(),
              updatedAt: new Date()
            });
            count++;
        }
    }

    console.log(`Seed complete! Added ${count} interests across ${schedules.length} schedules.`);

  } catch (error) {
    console.error(error);
  } finally {
    mongoose.disconnect();
  }
}

run();
