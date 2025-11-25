# TODO: Implement Caching in Pages

## Overview
Implement caching logic in pages that fetch data from Firestore using the storage.ts utility. The pattern is:
- Import storage functions
- On component load (useEffect): Check cache first, display if available, else fetch from Firestore
- After fetching, save to cache

## Pages to Update
- [ ] ParkingPage.tsx: Cache parking spots data
- [ ] ParkingLotPage.tsx: Cache zone and parking spots data
- [ ] Sessions.tsx: Cache bookings data
- [ ] Profile.tsx: Cache user profile data
- [ ] BookingForm.tsx: Cache user data

## Steps
1. Update ParkingPage.tsx
2. Update ParkingLotPage.tsx
3. Update Sessions.tsx
4. Update Profile.tsx
5. Update BookingForm.tsx
6. Test all changes
