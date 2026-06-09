const mongoose = require('mongoose');
const Route = require('./src/models/Route').default;

async function testDB() {
  await mongoose.connect('mongodb+srv://kimclarat23_db_user:qFYOTf3BfF6zDWQE@final.y7h2fks.mongodb.net/?appName=final');
  console.log('Connected');
  try {
    const route = new Route({
      name: 'Test Route Duplicate Check',
      estimatedDuration: 45,
      fare: 500,
      origin: 'A',
      destination: 'B'
    });
    await route.save();
    console.log('Saved first time');

    const route2 = new Route({
      name: 'Test Route Duplicate Check',
      estimatedDuration: 45,
      fare: 500,
      origin: 'A',
      destination: 'B'
    });
    await route2.save();
    console.log('Saved second time');
  } catch (error) {
    console.log('DB Error:', error.message, error.code);
  }
  mongoose.disconnect();
}
testDB();
