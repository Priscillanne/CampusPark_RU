import { LocalNotifications } from '@capacitor/local-notifications';

export interface ParkingReminder {
  id: string;
  title: string;
  body: string;
  scheduleAt: Date;
  parkingData: {
    zone: string;
    lot: string;
    startTime: Date;
    endTime: Date;
    bookingId: string;
  };
}

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  static async scheduleParkingReminders(bookingData: {
    zone: string;
    lot: string;
    startTime: Date;
    endTime: Date;
    bookingId: string;
  }): Promise<void> {
    // Request permissions first
    await this.requestPermissions();
    
    const reminders = this.createParkingReminders(bookingData);
    
    for (const reminder of reminders) {
      await this.scheduleNotification(reminder);
    }
  }

  private static createParkingReminders(bookingData: {
    zone: string;
    lot: string;
    startTime: Date;
    endTime: Date;
    bookingId: string;
  }): ParkingReminder[] {
    const reminders: ParkingReminder[] = [];
    const { zone, lot, startTime, endTime, bookingId } = bookingData;

    // Before parking reminders (15, 10, 5, 0 minutes before)
    const beforeTimes = [15, 10, 5, 0];
    beforeTimes.forEach(minutes => {
      const notifyTime = new Date(startTime.getTime() - minutes * 60000);
      
      reminders.push({
        id: `before_${bookingId}_${minutes}`,
        title: minutes === 0 ? '🅿️ Parking Started' : '🅿️ Parking Reminder',
        body: minutes === 0 
          ? `Your parking at ${zone}, ${lot} has started. Please park your car.`
          : `Reminder: Your parking at ${zone}, ${lot} starts in ${minutes} minutes.`,
        scheduleAt: notifyTime,
        parkingData: bookingData
      });
    });

    // After parking reminders (15, 10, 5, 0 minutes before end)
    const afterTimes = [15, 10, 5, 0];
    afterTimes.forEach(minutes => {
      const notifyTime = new Date(endTime.getTime() - minutes * 60000);
      
      reminders.push({
        id: `after_${bookingId}_${minutes}`,
        title: minutes === 0 ? '🅿️ Parking Ended' : '🅿️ Parking Ending Soon',
        body: minutes === 0 
          ? `Your parking at ${zone}, ${lot} has ended. Please remove your car.`
          : `Reminder: Your parking at ${zone}, ${lot} ends in ${minutes} minutes.`,
        scheduleAt: notifyTime,
        parkingData: bookingData
      });
    });

    return reminders;
  }

  static async schedulePenaltyNotification(bookingData: {
    zone: string;
    lot: string;
    endTime: Date;
    bookingId: string;
    penaltyAmount: number;
    minutesLate: number;
  }): Promise<void> {
    const { zone, lot, bookingId, penaltyAmount, minutesLate } = bookingData;
    
    const penaltyNotification: ParkingReminder = {
      id: `penalty_${bookingId}_${minutesLate}`,
      title: '⚠️ Parking Penalty',
      body: `You are ${minutesLate} minutes late at ${zone}, ${lot}. RM${penaltyAmount} penalty applied.`,
      scheduleAt: new Date(),
      parkingData: bookingData
    };

    await this.scheduleNotification(penaltyNotification);
  }

  private static async scheduleNotification(reminder: ParkingReminder): Promise<void> {
    try {
      // Check if the notification time is in the future
      if (reminder.scheduleAt.getTime() <= Date.now()) {
        console.log(`Skipping past notification: ${reminder.title}`);
        return;
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: this.generateNotificationId(reminder.id),
            title: reminder.title,
            body: reminder.body,
            schedule: { at: reminder.scheduleAt },
            extra: reminder.parkingData
          }
        ]
      });
      console.log(`✅ Scheduled notification: ${reminder.title} at ${reminder.scheduleAt}`);
    } catch (error) {
      console.error('❌ Error scheduling notification:', error);
    }
  }

  private static generateNotificationId(baseId: string): number {
    let hash = 0;
    for (let i = 0; i < baseId.length; i++) {
      const char = baseId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) % 1000000; // Ensure it's within valid range
  }

  static async cancelParkingReminders(bookingId: string): Promise<void> {
    try {
      // Get all pending notifications
      const pending = await LocalNotifications.getPending();
      
      // Find notifications for this booking
      const notificationsToCancel = pending.notifications.filter(notification => 
        notification.extra?.bookingId === bookingId
      );

      if (notificationsToCancel.length > 0) {
        await LocalNotifications.cancel({
          notifications: notificationsToCancel.map(n => ({ id: n.id }))
        });
        console.log(`✅ Cancelled ${notificationsToCancel.length} notifications for booking ${bookingId}`);
      }
    } catch (error) {
      console.error('❌ Error canceling notifications:', error);
    }
  }
}