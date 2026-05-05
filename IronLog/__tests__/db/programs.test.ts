import { listPublicPrograms, cloneProgram } from '@/lib/db/programs'
import { databases, DATABASE_ID, COLLECTION, Query, ID } from '@/lib/appwrite'

// Mock appwrite
jest.mock('@/lib/appwrite', () => ({
  databases: {
    listDocuments: jest.fn(),
    getDocument: jest.fn(),
    createDocument: jest.fn(),
    updateDocument: jest.fn(),
    deleteDocument: jest.fn(),
  },
  DATABASE_ID: 'test-db',
  COLLECTION: {
    PROGRAMS: 'programs',
    PROGRAM_DAYS: 'program_days',
  },
  ID: {
    unique: jest.fn(() => 'unique-id'),
  },
  Query: {
    equal: jest.fn((...args) => ({ type: 'equal', args })),
    orderDesc: jest.fn((field) => ({ type: 'orderDesc', field })),
    limit: jest.fn((n) => ({ type: 'limit', n })),
    search: jest.fn((field, term) => ({ type: 'search', field, term })),
  },
}))

const mockDatabases = databases as jest.Mocked<typeof databases>

describe('listPublicPrograms', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches public programs without search query', async () => {
    const mockPrograms = [
      { $id: 'p1', name: 'PPL', isPublic: true, userId: 'u1' },
      { $id: 'p2', name: '5/3/1', isPublic: true, userId: 'u2' },
    ]
    mockDatabases.listDocuments.mockResolvedValue({
      documents: mockPrograms,
      total: 2,
    } as any)

    const result = await listPublicPrograms()

    expect(mockDatabases.listDocuments).toHaveBeenCalledWith(
      DATABASE_ID,
      COLLECTION.PROGRAMS,
      expect.arrayContaining([
        expect.objectContaining({ type: 'equal', args: ['isPublic', true] }),
        expect.objectContaining({ type: 'orderDesc', field: '$createdAt' }),
        expect.objectContaining({ type: 'limit', n: 20 }),
      ])
    )
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('PPL')
  })

  it('fetches public programs with search query', async () => {
    const mockPrograms = [
      { $id: 'p1', name: 'Push Pull Legs', isPublic: true, userId: 'u1' },
    ]
    mockDatabases.listDocuments.mockResolvedValue({
      documents: mockPrograms,
      total: 1,
    } as any)

    const result = await listPublicPrograms('push', 10)

    expect(mockDatabases.listDocuments).toHaveBeenCalledWith(
      DATABASE_ID,
      COLLECTION.PROGRAMS,
      expect.arrayContaining([
        expect.objectContaining({ type: 'search', field: 'name', term: 'push' }),
        expect.objectContaining({ type: 'limit', n: 10 }),
      ])
    )
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Push Pull Legs')
  })

  it('returns empty array when no public programs found', async () => {
    mockDatabases.listDocuments.mockResolvedValue({
      documents: [],
      total: 0,
    } as any)

    const result = await listPublicPrograms('nonexistent')

    expect(result).toHaveLength(0)
  })

  it('handles database errors gracefully', async () => {
    mockDatabases.listDocuments.mockRejectedValue(new Error('Network error'))

    await expect(listPublicPrograms()).rejects.toThrow('Network error')
  })
})

describe('cloneProgram', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('clones a public program with its days', async () => {
    const sourceProgram = {
      $id: 'source-1',
      userId: 'original-user',
      name: 'Test Program',
      daysPerWeek: 3,
      totalWeeks: 8,
      currentWeek: 1,
      color: '#e8ff47',
      isPublic: true,
    }
    
    const sourceDays = [
      {
        $id: 'day-1',
        programId: 'source-1',
        userId: 'original-user',
        name: 'Day 1',
        order: 0,
        exercises: [{ exerciseId: 'bench', exerciseName: 'Bench Press', sets: [] }],
      },
      {
        $id: 'day-2',
        programId: 'source-1',
        userId: 'original-user',
        name: 'Day 2',
        order: 1,
        exercises: [],
      },
    ]

    const newProgram = {
      $id: 'new-1',
      userId: 'cloning-user',
      name: 'Test Program',
      daysPerWeek: 3,
      totalWeeks: 8,
      currentWeek: 1,
      color: '#e8ff47',
    }

    mockDatabases.getDocument.mockResolvedValue(sourceProgram as any)
    mockDatabases.createDocument
      .mockResolvedValueOnce(newProgram as any) // create program
      .mockResolvedValueOnce({ ...sourceDays[0], $id: 'new-day-1', programId: 'new-1' } as any)
      .mockResolvedValueOnce({ ...sourceDays[1], $id: 'new-day-2', programId: 'new-1' } as any)
    
    mockDatabases.listDocuments.mockResolvedValue({
      documents: sourceDays,
      total: 2,
    } as any)

    const result = await cloneProgram('source-1', 'cloning-user', 'Test User')

    expect(mockDatabases.getDocument).toHaveBeenCalledWith(
      DATABASE_ID,
      COLLECTION.PROGRAMS,
      'source-1'
    )
    expect(mockDatabases.createDocument).toHaveBeenCalledWith(
      DATABASE_ID,
      COLLECTION.PROGRAMS,
      expect.any(String),
      expect.objectContaining({
        userId: 'cloning-user',
        name: 'Test Program',
        daysPerWeek: 3,
      })
    )
    expect(mockDatabases.createDocument).toHaveBeenCalledTimes(3) // 1 program + 2 days
    expect(result.$id).toBe('new-1')
    expect(result.userId).toBe('cloning-user')
  })
})
