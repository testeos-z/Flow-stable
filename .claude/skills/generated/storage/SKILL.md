---
name: storage
description: 'Skill for the Storage area of Flow-stable. 95 symbols across 11 files.'
---

# Storage

95 symbols | 11 files | Cohesion: 82%

## When to Use

-   Working with code in `packages/`
-   Understanding how addBase64FilesToStorage, addSingleFileToStorage, getFileFromUpload work
-   Modifying storage-related functionality

## Key Files

| File                                                          | Symbols                                                                                                                        |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `packages/components/src/storage/LocalStorageProvider.ts`     | LocalStorageProvider, addBase64FilesToStorage, addArrayFilesToStorage, addSingleFileToStorage, getFileFromStorage (+16)        |
| `packages/components/src/storage/S3StorageProvider.ts`        | S3StorageProvider, addBase64FilesToStorage, getFileFromStorage, streamStorageFile, cleanEmptyS3Folders (+11)                   |
| `packages/components/src/storage/GCSStorageProvider.ts`       | GCSStorageProvider, normalizePath, addBase64FilesToStorage, addArrayFilesToStorage, addSingleFileToStorage (+10)               |
| `packages/components/src/storage/AzureBlobStorageProvider.ts` | AzureBlobStorageProvider, getFileFromStorage, addBase64FilesToStorage, streamStorageFile, addArrayFilesToStorage (+9)          |
| `packages/components/src/storage/IStorageProvider.ts`         | addBase64FilesToStorage, addSingleFileToStorage, getFileFromUpload, getFilesListFromStorage, streamStorageFile (+4)            |
| `packages/components/src/storageUtils.ts`                     | addBase64FilesToStorage, addSingleFileToStorage, getFileFromUpload, getFilesListFromStorage, removeSpecificFileFromUpload (+3) |
| `packages/components/src/storage/BaseStorageProvider.ts`      | BaseStorageProvider, sanitizeFilename, buildPath, validateChatflowId, validatePathSecurity (+2)                                |
| `packages/server/src/services/documentstore/index.ts`         | \_saveFileToStorage, deleteDocumentStore                                                                                       |
| `packages/server/src/utils/index.ts`                          | getMulterStorage                                                                                                               |
| `packages/components/src/storage/StorageProviderFactory.ts`   | getProvider                                                                                                                    |

## Entry Points

Start here when exploring this area:

-   **`addBase64FilesToStorage`** (Function) — `packages/components/src/storageUtils.ts:5`
-   **`addSingleFileToStorage`** (Function) — `packages/components/src/storageUtils.ts:26`
-   **`getFileFromUpload`** (Function) — `packages/components/src/storageUtils.ts:31`
-   **`getFilesListFromStorage`** (Function) — `packages/components/src/storageUtils.ts:41`
-   **`removeSpecificFileFromUpload`** (Function) — `packages/components/src/storageUtils.ts:71`

## Key Symbols

| Symbol                         | Type     | File                                                          | Line |
| ------------------------------ | -------- | ------------------------------------------------------------- | ---- |
| `S3StorageProvider`            | Class    | `packages/components/src/storage/S3StorageProvider.ts`        | 19   |
| `LocalStorageProvider`         | Class    | `packages/components/src/storage/LocalStorageProvider.ts`     | 8    |
| `GCSStorageProvider`           | Class    | `packages/components/src/storage/GCSStorageProvider.ts`       | 9    |
| `BaseStorageProvider`          | Class    | `packages/components/src/storage/BaseStorageProvider.ts`      | 7    |
| `AzureBlobStorageProvider`     | Class    | `packages/components/src/storage/AzureBlobStorageProvider.ts` | 24   |
| `addBase64FilesToStorage`      | Function | `packages/components/src/storageUtils.ts`                     | 5    |
| `addSingleFileToStorage`       | Function | `packages/components/src/storageUtils.ts`                     | 26   |
| `getFileFromUpload`            | Function | `packages/components/src/storageUtils.ts`                     | 31   |
| `getFilesListFromStorage`      | Function | `packages/components/src/storageUtils.ts`                     | 41   |
| `removeSpecificFileFromUpload` | Function | `packages/components/src/storageUtils.ts`                     | 71   |
| `streamStorageFile`            | Function | `packages/components/src/storageUtils.ts`                     | 86   |
| `getStorageSize`               | Function | `packages/components/src/storageUtils.ts`                     | 99   |
| `getMulterStorage`             | Function | `packages/server/src/utils/index.ts`                          | 1998 |
| `readDirectory`                | Function | `packages/components/src/storage/LocalStorageProvider.ts`     | 177  |
| `calculateSize`                | Function | `packages/components/src/storage/LocalStorageProvider.ts`     | 313  |
| `recursiveS3Delete`            | Function | `packages/components/src/storage/S3StorageProvider.ts`        | 408  |
| `removeFilesFromStorage`       | Function | `packages/components/src/storageUtils.ts`                     | 66   |
| `getProvider`                  | Method   | `packages/components/src/storage/StorageProviderFactory.ts`   | 17   |
| `addBase64FilesToStorage`      | Method   | `packages/components/src/storage/IStorageProvider.ts`         | 31   |
| `addSingleFileToStorage`       | Method   | `packages/components/src/storage/IStorageProvider.ts`         | 41   |

## Connected Areas

| Area          | Connections |
| ------------- | ----------- |
| Documentstore | 2 calls     |

## How to Explore

1. `gitnexus_context({name: "addBase64FilesToStorage"})` — see callers and callees
2. `gitnexus_query({query: "storage"})` — find related execution flows
3. Read key files listed above for implementation details
