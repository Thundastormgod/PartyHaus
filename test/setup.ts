import '@testing-library/jest-dom';

// Setup global mocks here (msw will be configured in later PR)
globalThis.IS_REACT_ACT_ENVIRONMENT = true as unknown as boolean;
