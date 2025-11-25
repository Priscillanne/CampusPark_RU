export interface PenaltyRecord {
  bookingId: string;
  userId: string;
  zone: string;
  slotLabel: string;
  originalEndTime: Date;
  penalties: {
    time: Date;
    amount: number;
    minutesLate: number;
    message: string;
  }[];
  totalPenalty: number;
  isPaid: boolean;
  lastChecked: Date;
}

export class PenaltyService {
  static readonly PENALTY_RATE = 10; // RM10 per 5 minutes
  static readonly PENALTY_INTERVAL = 5; // minutes
  static readonly MAX_PENALTY = 30; // Maximum RM30 penalty
  static readonly GRACE_PERIOD = 5; // 5 minutes grace period

  // Calculate penalty for a booking
  static calculatePenalty(originalEndTime: Date, currentTime: Date = new Date()): {
    minutesLate: number;
    penaltyAmount: number;
    penaltyMessages: string[];
    shouldApplyPenalty: boolean;
  } {
    const lateMs = currentTime.getTime() - originalEndTime.getTime();
    const minutesLate = Math.max(0, Math.floor(lateMs / (1000 * 60)));
    
    // No penalty during grace period
    if (minutesLate <= this.GRACE_PERIOD) {
      return { 
        minutesLate, 
        penaltyAmount: 0, 
        penaltyMessages: [],
        shouldApplyPenalty: false 
      };
    }

    // Calculate effective late minutes (after grace period)
    const effectiveLateMinutes = minutesLate - this.GRACE_PERIOD;
    const penaltyIntervals = Math.floor(effectiveLateMinutes / this.PENALTY_INTERVAL);
    const penaltyAmount = Math.min(
      penaltyIntervals * this.PENALTY_RATE,
      this.MAX_PENALTY
    );

    // Generate penalty messages for each interval
    const penaltyMessages: string[] = [];
    for (let i = 1; i <= penaltyIntervals; i++) {
      const intervalMinutes = i * this.PENALTY_INTERVAL;
      const intervalAmount = Math.min(i * this.PENALTY_RATE, this.MAX_PENALTY);
      
      if (intervalAmount <= this.MAX_PENALTY) {
        penaltyMessages.push(
          `Penalty: You are ${intervalMinutes + this.GRACE_PERIOD} minutes late. ` +
          `RM${this.PENALTY_RATE} penalty applied. Total penalty: RM${intervalAmount}.`
        );
      }
    }

    const shouldApplyPenalty = penaltyAmount > 0 && 
      effectiveLateMinutes % this.PENALTY_INTERVAL === 0;

    return { 
      minutesLate, 
      penaltyAmount, 
      penaltyMessages,
      shouldApplyPenalty 
    };
  }

  // Simulate penalty application (in real app, this would save to database)
  static async applyPenalty(bookingData: {
    bookingId: string;
    userId: string;
    zone: string;
    slotLabel: string;
    endTime: Date;
  }): Promise<{ penaltyAmount: number; minutesLate: number; messages: string[] }> {
    
    const { minutesLate, penaltyAmount, penaltyMessages, shouldApplyPenalty } = 
      this.calculatePenalty(bookingData.endTime);

    if (!shouldApplyPenalty) {
      return { penaltyAmount: 0, minutesLate, messages: [] };
    }

    console.log(`💰 Applied RM${penaltyAmount} penalty for booking ${bookingData.bookingId}`);
    
    // In a real app, you would save this to Firebase
    // await this.savePenaltyToDatabase(bookingData, penaltyAmount, minutesLate);
    
    return { penaltyAmount, minutesLate, messages: penaltyMessages };
  }

  // Check all active bookings for penalties
  static async checkActiveBookingsForPenalties(activeBookings: any[]): Promise<{
    totalPenalties: number;
    penaltyDetails: { bookingId: string; amount: number; messages: string[] }[];
  }> {
    const penaltyDetails: { bookingId: string; amount: number; messages: string[] }[] = [];
    let totalPenalties = 0;

    for (const booking of activeBookings) {
      const endTime = booking.endTime?.toDate?.() || new Date(booking.endTime);
      const { penaltyAmount, messages } = await this.applyPenalty({
        bookingId: booking.bookingId,
        userId: booking.userId,
        zone: booking.zone,
        slotLabel: booking.slotLabel,
        endTime: endTime
      });

      if (penaltyAmount > 0) {
        totalPenalties += penaltyAmount;
        penaltyDetails.push({
          bookingId: booking.bookingId,
          amount: penaltyAmount,
          messages: messages
        });
      }
    }

    return { totalPenalties, penaltyDetails };
  }

  // Format penalty message for display
  static formatPenaltyMessage(minutesLate: number, penaltyAmount: number): string {
    if (penaltyAmount === 0) {
      return `⏰ You have ${this.GRACE_PERIOD - minutesLate} minutes of grace period remaining.`;
    }

    const intervals = penaltyAmount / this.PENALTY_RATE;
    const totalLateMinutes = (intervals * this.PENALTY_INTERVAL) + this.GRACE_PERIOD;

    return `⚠️ Penalty: You are ${totalLateMinutes} minutes late. ` +
           `RM${penaltyAmount} penalty applied. ` +
           `Maximum penalty: RM${this.MAX_PENALTY}`;
  }

  // Get penalty status for a booking
  static getPenaltyStatus(booking: any): {
    hasPenalty: boolean;
    message: string;
    amount: number;
    minutesLate: number;
  } {
    const endTime = booking.endTime?.toDate?.() || new Date(booking.endTime);
    const { minutesLate, penaltyAmount, penaltyMessages } = this.calculatePenalty(endTime);

    let message = '';
    if (penaltyAmount > 0) {
      message = penaltyMessages[penaltyMessages.length - 1] || 
                this.formatPenaltyMessage(minutesLate, penaltyAmount);
    } else if (minutesLate > 0) {
      message = this.formatPenaltyMessage(minutesLate, penaltyAmount);
    } else {
      message = '✅ No penalties applied';
    }

    return {
      hasPenalty: penaltyAmount > 0,
      message,
      amount: penaltyAmount,
      minutesLate
    };
  }
}