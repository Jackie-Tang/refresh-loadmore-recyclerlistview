import { Exception } from './CustomError';

const RecyclerListViewExceptions: { [key: string]: Exception } = {
  initializationException: {
    message: 'Parameters required for initializing the module are missing',
    type: 'Initialization essentials missing',
  },
  itemBoundsException: {
    message:
      'Dimensions cannot be undefined or null, check if LayoutProvider returns irregular values',
    type: 'ItemBoundsException',
  },
  itemTypeNullException: {
    message:
      'FindRecyclerListView items always require a type, check if LayoutProvider returns irregular values',
    type: 'ItemTypeNullException',
  },
  layoutException: {
    message: 'FindRecyclerListView needs to have a bounded size. Currently height or, width is 0',
    type: 'LayoutException',
  },
  platformNotDetectedException: {
    message:
      "Unable to detect the running platform, if you're trying to run recyclerlistview " +
      'in browser make sure process.env.RLV_ENV is set to browser in webpack config',
    type: 'PlatformNotDetectedException',
  },
  unresolvedDependenciesException: {
    message: 'missing datasource or layout provider, cannot proceed without it',
    type: 'UnresolvedDependenciesException',
  },
};

export default RecyclerListViewExceptions;
