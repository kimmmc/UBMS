async function testLogin() {
  try {
    const loginRes = await fetch('https://ubms-p9jp.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@ridra.com',
        password: 'admin123'
      })
    });
    const data = await loginRes.json();
    console.log('Login status:', loginRes.status);
    console.log('Login res:', data);
    
    if (data.token) {
        // Now try routes
        const response = await fetch('https://ubms-p9jp.onrender.com/api/routes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.token}`
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
        console.log('Route response status:', response.status);
        console.log('Route response:', await response.json());
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testLogin();
