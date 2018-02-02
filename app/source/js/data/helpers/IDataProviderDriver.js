/**
 * @typedef {Object} IDataProviderDriver Interface defining methods to interact
 * with a data store, in the way expected by a DataProvider class and connecting
 * to a specific data driver.
 * @method fetch Accepts no arguments, returns a Promise that resolves with the
 * data
 * @method push Accepts one argument, the data to be sent for storage. Returns
 * a Promise that resolves with the data as given by the storage.
 * @method delete Accepts no arguments, request to delete the whole data. Returns
 * a Promise that can resolves with anything the storage wants to return
 * (dependent on the storage, can be nothing, a copy of deleted data, or
 * metadata about).
 */

// NOTE: Yes, this is empty and doesn't needs to be imported elsewhere, this file
// just works as documentation for an interface used by CachedDataProviders
// and implementations.
