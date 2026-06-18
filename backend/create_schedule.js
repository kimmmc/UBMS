const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://kimclarat23_db_user:qFYOTf3BfF6zDWQE@final.y7h2fks.mongodb.net/?appName=final';

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    const db = mongoose.connection.db;

    // 1. Get ALL buses
    const buses = await db.collection('buses').find({}).toArray();
    console.log(`Found ${buses.length} total buses.`);

    // 2. Get/Create dummy passengers
    const dummyUsers = [];
    for(let i = 1; i <= 3; i++) {
       const res = await db.collection('users').insertOne({
           name: `Super Test Passenger ${i}`,
           email: `super_passenger${i}_${Date.now()}@test.com`,
           password: 'hashedpassword',
           role: 'passenger',
           phone: `+25078${Math.floor(1000000 + Math.random() * 9000000)}`,
           createdAt: new Date(),
           updatedAt: new Date()
       });
       dummyUsers.push({ _id: res.insertedId, name: `Super Test Passenger ${i}` });
    }

    // 3. Get a pickup point
    const point = await db.collection('pickuppoints').findOne({});
    let pickupPointId = point ? point._id : null;

    if (!pickupPointId) {
        const res = await db.collection('pickuppoints').insertOne({
            name: "Mock Pickup Point",
            location: { type: "Point", coordinates: [30.0, -1.9] },
            description: "A test pickup point",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        pickupPointId = res.insertedId;
    }

    let createdSchedules = 0;

    // 4. Create a schedule for EACH bus and seed interests
    for (const bus of buses) {
        const departureTime = new Date();
        departureTime.setMinutes(departureTime.getMinutes() + 30); 

        const schedule = {
            busId: bus._id,
            routeId: bus.routeId,
            departureTime: departureTime,
            status: 'scheduled', 
            estimatedArrivalTimes: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const scheduleRes = await db.collection('busschedules').insertOne(schedule);
        const scheduleId = scheduleRes.insertedId;
        createdSchedules++;

        for (const user of dummyUsers) {
            await db.collection('userinterests').insertOne({
              userId: user._id,
              busScheduleId: scheduleId,
              pickupPointId: pickupPointId,
              status: 'interested',
              createdAt: new Date(),
              updatedAt: new Date()
            });
        }
    }

    console.log(`Successfully created ${createdSchedules} schedules (one for every bus) and seeded passengers!`);

  } catch (error) {
    console.error(error);
  } finally {
    mongoose.disconnect();
  }
}

run();
