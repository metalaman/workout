// Mock for react-native-appwrite
export const Client = jest.fn().mockImplementation(() => ({
  setEndpoint: jest.fn().mockReturnThis(),
  setProject: jest.fn().mockReturnThis(),
  setPlatform: jest.fn().mockReturnThis(),
}))

export const Account = jest.fn().mockImplementation(() => ({
  get: jest.fn(),
  createEmailPasswordSession: jest.fn(),
  deleteSession: jest.fn(),
  create: jest.fn(),
}))

export const Databases = jest.fn().mockImplementation(() => ({
  listDocuments: jest.fn(),
  createDocument: jest.fn(),
  updateDocument: jest.fn(),
  deleteDocument: jest.fn(),
  getDocument: jest.fn(),
}))

export const Storage = jest.fn().mockImplementation(() => ({
  createFile: jest.fn(),
  getFileView: jest.fn(),
  deleteFile: jest.fn(),
}))

export const Query = {
  equal: jest.fn((...args: unknown[]) => `equal(${args})`),
  orderDesc: jest.fn((field: string) => `orderDesc(${field})`),
  orderAsc: jest.fn((field: string) => `orderAsc(${field})`),
  limit: jest.fn((n: number) => `limit(${n})`),
  offset: jest.fn((n: number) => `offset(${n})`),
  greaterThan: jest.fn((...args: unknown[]) => `greaterThan(${args})`),
  lessThan: jest.fn((...args: unknown[]) => `lessThan(${args})`),
  search: jest.fn((...args: unknown[]) => `search(${args})`),
}

export const ID = {
  unique: jest.fn(() => `unique-${Date.now()}`),
}

export const Permission = {
  read: jest.fn((role: string) => `read("${role}")`),
  write: jest.fn((role: string) => `write("${role}")`),
  update: jest.fn((role: string) => `update("${role}")`),
  delete: jest.fn((role: string) => `delete("${role}")`),
}

export const Role = {
  any: jest.fn(() => 'any'),
  user: jest.fn((id: string) => `user:${id}`),
  users: jest.fn(() => 'users'),
}
