import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/config/firebase';

/**
 * @typedef {'sharing'|'no_share'} TrackingStatus
 */

/**
 * Update the current user's tracking status in Firestore.
 * Path: trips/{tripId}/members/{uid}
 *   → tracking.status, tracking.updated_at
 *
 * @param {string} tripId
 * @param {'sharing'|'no_share'} status
 */
async function setTrackingStatus(tripId, status) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('User not authenticated');

  const memberRef = doc(db, 'trips', tripId, 'members', uid);
  await updateDoc(memberRef, {
    'tracking.status': status,
    'tracking.updated_at': serverTimestamp(),
  });
}

/**
 * Update the current user's location coordinates in Firestore.
 * Path: trips/{tripId}/members/{uid}
 *   → tracking.lat, tracking.lng, tracking.updated_at
 *
 * @param {string} tripId
 * @param {number} lat
 * @param {number} lng
 */
async function updateLocation(tripId, lat, lng) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('User not authenticated');

  const memberRef = doc(db, 'trips', tripId, 'members', uid);
  await updateDoc(memberRef, {
    'tracking.lat': lat,
    'tracking.lng': lng,
    'tracking.updated_at': serverTimestamp(),
  });
}

/**
 * Request geolocation permission from the browser.
 * If granted → set tracking.status = 'sharing' and start watching position.
 * If denied  → set tracking.status = 'no_share'.
 *
 * @param {string} tripId
 * @returns {Promise<{ watchId: number|null, status: TrackingStatus }>}
 */
export async function requestLocationAndStartTracking(tripId) {
  if (!navigator.geolocation) {
    console.warn('[locationTracking] Geolocation not supported');
    return { watchId: null, status: 'no_share' };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // Permission granted
        try {
          await setTrackingStatus(tripId, 'sharing');
          await updateLocation(tripId, position.coords.latitude, position.coords.longitude);
        } catch (err) {
          console.error('[locationTracking] Failed to update Firestore after permission grant:', err);
        }

        // Watch for subsequent position changes
        const watchId = navigator.geolocation.watchPosition(
          async (pos) => {
            try {
              await updateLocation(tripId, pos.coords.latitude, pos.coords.longitude);
            } catch (err) {
              console.error('[locationTracking] Failed to update location:', err);
            }
          },
          (err) => {
            console.warn('[locationTracking] watchPosition error:', err.message);
          },
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
        );

        resolve({ watchId, status: 'sharing' });
      },
      async (err) => {
        // Permission denied or error
        console.warn('[locationTracking] Permission denied or error:', err.message);
        try {
          await setTrackingStatus(tripId, 'no_share');
        } catch (firestoreErr) {
          console.error('[locationTracking] Failed to update status to no_share:', firestoreErr);
        }
        resolve({ watchId: null, status: 'no_share' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

/**
 * Stop watching position and set tracking status back to 'no_share'.
 *
 * @param {string} tripId
 * @param {number|null} watchId - ID returned by watchPosition
 */
export async function stopLocationTracking(tripId, watchId) {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
  }
  try {
    await setTrackingStatus(tripId, 'no_share');
  } catch (err) {
    console.error('[locationTracking] Failed to set status to no_share on stop:', err);
  }
}
