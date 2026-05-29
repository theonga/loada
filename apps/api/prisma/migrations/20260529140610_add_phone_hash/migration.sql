-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phoneHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneHash_key" ON "User"("phoneHash");

