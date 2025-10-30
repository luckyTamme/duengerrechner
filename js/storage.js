// Storage module for managing localStorage operations
// Handles fertilizer persistence, water data, and custom fertilizers

// Storage keys
const STORAGE_KEYS = {
  WATER_DATA: "waterData",
  CUSTOM_FERT_DATA: "customFertData",
  PERSIST_FERTILIZERS: "persistFertilizers",
  SAVED_FERTILIZERS: "savedFertilizers",
  FERTILIZER_SCHEMAS: "fertilizerSchemas",
};

// Safe localStorage getter with error handling
const getFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

// Safe localStorage setter with error handling
const setToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
    return false;
  }
};

// Safe localStorage remover
const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
    return false;
  }
};

// Clear all application data from localStorage
const clearAllStorage = () => {
  Object.values(STORAGE_KEYS).forEach((key) => removeFromStorage(key));
};

// Water data management
const getWaterData = () => getFromStorage(STORAGE_KEYS.WATER_DATA, {});
const setWaterData = (data) => setToStorage(STORAGE_KEYS.WATER_DATA, data);

// Custom fertilizer data management
const getCustomFertData = () => getFromStorage(STORAGE_KEYS.CUSTOM_FERT_DATA, []);
const setCustomFertData = (data) => setToStorage(STORAGE_KEYS.CUSTOM_FERT_DATA, data);

// Persistence toggle management
const getPersistFertilizers = () => getFromStorage(STORAGE_KEYS.PERSIST_FERTILIZERS, false);
const setPersistFertilizers = (enabled) => setToStorage(STORAGE_KEYS.PERSIST_FERTILIZERS, enabled);

// Saved fertilizers management
const getSavedFertilizers = () => getFromStorage(STORAGE_KEYS.SAVED_FERTILIZERS, []);
const setSavedFertilizers = (data) => setToStorage(STORAGE_KEYS.SAVED_FERTILIZERS, data);
const clearSavedFertilizers = () => removeFromStorage(STORAGE_KEYS.SAVED_FERTILIZERS);

// Fertilizer schemas management
const getFertilizerSchemas = () => getFromStorage(STORAGE_KEYS.FERTILIZER_SCHEMAS, []);
const setFertilizerSchemas = (data) => setToStorage(STORAGE_KEYS.FERTILIZER_SCHEMAS, data);
const addFertilizerSchema = (schema) => {
  const schemas = getFertilizerSchemas();
  schemas.push(schema);
  return setFertilizerSchemas(schemas);
};
const deleteFertilizerSchema = (schemaName) => {
  const schemas = getFertilizerSchemas();
  const filtered = schemas.filter((s) => s.name !== schemaName);
  return setFertilizerSchemas(filtered);
};
