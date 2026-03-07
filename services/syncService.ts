export interface SyncStatus {
  lastSynced: string
  deviceCount: number
  status: 'Active' | 'Inactive'
}

const SENSOR_API_URL = process.env.EXPO_PUBLIC_SENSOR_API_URL as string;

export const fetchSyncStatus = async (): Promise<SyncStatus> => {
  try {
    const response = await fetch(SENSOR_API_URL)
    if (!response.ok) throw new Error(`Request failed (${response.status}`)

    const payload = await response.json()

    const data =
      payload && typeof payload === 'object' && 'data' in payload
        ? payload.data
        : payload

    if (!data || typeof data !== 'object') {
      throw new Error('Unexpected response format')
    }

    let timestamp = data.timestamp

    // Handle seconds vs milliseconds
    if (timestamp) {
      timestamp = Number(timestamp)

      // If timestamp is seconds convert to ms
      if (timestamp < 1000000000000) {
        timestamp = timestamp * 1000
      }
    } else {
      timestamp = Date.now()
    }

    const lastSyncedDate = new Date(timestamp)

    return {
      lastSynced: lastSyncedDate.toISOString(),
      deviceCount: 1,
      status: 'Active'
    }

  } catch (error) {
    console.error('Error fetching sync status:', error)

    return {
      lastSynced: new Date().toISOString(),
      deviceCount: 0,
      status: 'Inactive'
    }
  }
}