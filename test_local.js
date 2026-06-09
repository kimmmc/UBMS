async function testCreateRoute() {
  try {
    const registerRes = await fetch('http://localhost:3005/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@ridra.com',
        password: 'admin123'
      })
    });
    const authData = await registerRes.json();
    console.log('Login res:', authData);
    const token = authData.token;
    
    if (!token) {
        console.log('no token');
        return;
    }

    // 2. Create a route
    const response = await fetch('http://localhost:3005/api/routes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: `Test Route`,
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
      
      // Try duplicate
      const response2 = await fetch('http://localhost:3005/api/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: `Test Route`,
          description: 'Test Description 2',
          estimatedDuration: 45,
          origin: 'Test Origin',
          destination: 'Test Destination',
          fare: 500
        })
      });
      console.log('Duplicate Response:', response2.status, await response2.json());
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testCreateRoute();
