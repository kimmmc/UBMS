const https = require('https');

https.get('https://ubms-p9jp.onrender.com/api/bus-schedules', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(`Successfully fetched schedules from ubms-p9jp API.`);
      console.log(`Number of schedules returned: ${parsed.schedules ? parsed.schedules.length : 0}`);
    } catch(e) {
      console.log('Error parsing response:', e.message);
      console.log('Raw data:', data.substring(0, 500));
    }
  });
}).on('error', (e) => {
  console.error(e);
});
