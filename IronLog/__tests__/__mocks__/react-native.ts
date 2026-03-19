// Minimal react-native mock for store tests
export const Platform = { OS: 'ios', select: (obj: Record<string, unknown>) => obj.ios || obj.default }
export const Alert = { alert: jest.fn() }
export const Dimensions = { get: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }) }
export default { Platform, Alert, Dimensions }
