async function testCreateRoute() {
  try {
    const email = `admin_${Date.now()}@test.com`;
    console.log('Signing up', email);
    const registerRes = await fetch('http://localhost:3005/api/auth/signup', {
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
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testCreateRoute();
