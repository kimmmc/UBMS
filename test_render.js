async function testCreateRoute() {
  try {
    // 1. Sign up a temp admin
    const email = `admin_${Date.now()}@test.com`;
    console.log('Signing up', email);
    const registerRes = await fetch('https://ubms-p9jp.onrender.com/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Admin',
        email: email,
        password: 'password123',
        phone: '1234567890',
        role: 'admin'
      })
    });
    const authData = await registerRes.json();
    console.log('Signup res:', authData);
    const token = authData.token;
    
    if (!token) {
        console.log('no token, maybe signup failed');
        return;
    }

    // 2. Create a route
    const response = await fetch('https://ubms-p9jp.onrender.com/api/routes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
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
      console.log('Error Response 1:', response.status, data);
    } else {
      console.log('Success 1:', data);
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testCreateRoute();
