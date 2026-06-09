async function testCreateRoute() {
  try {
    const response = await fetch('https://ubms-p9jp.onrender.com/api/routes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `Test Route ${Date.now()}`,
        description: 'Test Description',
        estimatedDuration: 45,
        origin: 'Test Origin',
        destination: 'Test Destination',
        fare: 500
      })
    });
    const data = await response.json();
    if (!response.ok) {
      console.log('Error Response:', response.status, data);
    } else {
      console.log('Success:', data);
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testCreateRoute();
