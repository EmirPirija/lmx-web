let appStore = null;

export const setAppStore = (storeInstance) => {
  appStore = storeInstance;
};

export const getAppStore = () => appStore;

export const dispatchWithStore = (action) => {
  if (!appStore) return undefined;
  return appStore.dispatch(action);
};
