import cron from 'node-cron';
import Bus from '../models/Bus';

// Function to mark buses as offline if they haven't updated location recently
const checkOfflineBuses = async () => {
  try {
    // Increased to 24 hours for development/testing so buses don't keep reverting to inactive
    const timeoutThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    await Bus.updateMany(
      {
        isOnline: true,
        'currentLocation.lastUpdated': { $lt: timeoutThreshold }
      },
      { isOnline: false }
    );
    
    console.log('Checked and updated offline buses');
  } catch (error) {
    console.error('Error checking offline buses:', error);
  }
};

// Schedule to run every minute to check for offline buses
export const startLocationScheduler = () => {
  cron.schedule('* * * * *', checkOfflineBuses);
  console.log('Location scheduler started - checking for offline buses every minute');
};

// Function to clean old location history (older than 24 hours)
const cleanOldLocationHistory = async () => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const BusLocationHistory = require('../models/BusLocationHistory').default;
    const result = await BusLocationHistory.deleteMany({
      timestamp: { $lt: twentyFourHoursAgo }
    });
    
    console.log(`Cleaned ${result.deletedCount} old location records`);
  } catch (error) {
    console.error('Error cleaning old location history:', error);
  }
};

// Schedule to run every hour to clean old location history
export const startLocationHistoryCleanup = () => {
  cron.schedule('0 * * * *', cleanOldLocationHistory);
  console.log('Location history cleanup scheduler started - running every hour');
};