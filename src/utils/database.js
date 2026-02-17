/**
 * Database utilities for local storage
 * Simulates database operations using localStorage
 */

const STORAGE_KEY = 'ufugaji-bioid-db';

/**
 * Initialize database with sample data if empty
 */
export async function initializeDB() {
  const existing = localStorage.getItem(STORAGE_KEY);
  
  if (!existing) {
    // Load sample data from db.json
    try {
      const response = await fetch('/db.json');
      const data = await response.json();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.cattle || []));
      return data.cattle || [];
    } catch (error) {
      console.error('Failed to load sample data:', error);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
  }
  
  return JSON.parse(existing);
}

/**
 * Get all cattle from database
 */
export function getAllCattle() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Get cattle by ID
 */
export function getCattleById(id) {
  const cattle = getAllCattle();
  return cattle.find(c => c.id === id);
}

/**
 * Add new cattle to database
 */
export function addCattle(cattleData) {
  const cattle = getAllCattle();
  const newCattle = {
    ...cattleData,
    id: Date.now().toString(),
    registrationDate: new Date().toISOString().split('T')[0],
    certificateId: `UFUGAJI-${new Date().getFullYear()}-${String(cattle.length + 1).padStart(3, '0')}`
  };
  
  cattle.push(newCattle);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cattle));
  
  return newCattle;
}

/**
 * Update cattle data
 */
export function updateCattle(id, updates) {
  const cattle = getAllCattle();
  const index = cattle.findIndex(c => c.id === id);
  
  if (index === -1) {
    return null;
  }
  
  cattle[index] = { ...cattle[index], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cattle));
  
  return cattle[index];
}

/**
 * Delete cattle from database
 */
export function deleteCattle(id) {
  const cattle = getAllCattle();
  const filtered = cattle.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  
  return filtered;
}

/**
 * Search cattle by owner name or cow name
 */
export function searchCattle(query) {
  const cattle = getAllCattle();
  const lowerQuery = query.toLowerCase();
  
  return cattle.filter(c => 
    c.ownerName.toLowerCase().includes(lowerQuery) ||
    c.cowName.toLowerCase().includes(lowerQuery) ||
    c.location.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get statistics
 */
export function getStats() {
  const cattle = getAllCattle();
  
  const breedCount = {};
  const locationCount = {};
  
  cattle.forEach(c => {
    breedCount[c.breed] = (breedCount[c.breed] || 0) + 1;
    locationCount[c.location] = (locationCount[c.location] || 0) + 1;
  });
  
  return {
    total: cattle.length,
    breedCount,
    locationCount
  };
}

/**
 * Export database as JSON
 */
export function exportDatabase() {
  const data = getAllCattle();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `ufugaji-bioid-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}

/**
 * Import database from JSON file
 */
export function importDatabase(jsonData) {
  try {
    const data = JSON.parse(jsonData);
    if (Array.isArray(data)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return { success: true, count: data.length };
    }
    return { success: false, error: 'Invalid format' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
