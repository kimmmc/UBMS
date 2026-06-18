const https = require('https');

https.get('https://capstone1-60ax.onrender.com/api/bus-schedules', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(`Successfully fetched schedules from Render API.`);
      console.log(`Number of schedules returned: ${parsed.schedules ? parsed.schedules.length : 0}`);
      if (parsed.schedules && parsed.schedules.length > 0) {
        console.log(`First schedule ID: ${parsed.schedules[0]._id}`);
      }
    } catch(e) {
      console.log('Error parsing response:', e.message);
      console.log('Raw data:', data.substring(0, 500));
    }
  });
}).on('error', (e) => {
  console.error(e);
});
