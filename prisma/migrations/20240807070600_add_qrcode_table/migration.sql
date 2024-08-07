/*
  Warnings:

  - Added the required column `shopifyProductId` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shopifyProductId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "totalQuantitySold" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "price" REAL,
    "compareAtPrice" REAL,
    "productType" TEXT,
    "tags" TEXT,
    "vendor" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Product" ("createdAt", "id", "imageUrl", "title", "totalQuantitySold", "updatedAt") SELECT "createdAt", "id", "imageUrl", "title", "totalQuantitySold", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_shopifyProductId_key" ON "Product"("shopifyProductId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
