/*
  Warnings:

  - The primary key for the `Device` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the `SensorLog` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `deviceID` to the `Device` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deviceType` to the `Device` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gatewayID` to the `Device` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastHearbeat` to the `Device` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `Device` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sensitivity` to the `Device` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stagnationTime` to the `Device` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "SensorLog" DROP CONSTRAINT "SensorLog_deviceId_fkey";

-- AlterTable
ALTER TABLE "Device" DROP CONSTRAINT "Device_pkey",
DROP COLUMN "id",
DROP COLUMN "name",
ADD COLUMN     "deviceID" TEXT NOT NULL,
ADD COLUMN     "deviceType" TEXT NOT NULL,
ADD COLUMN     "gatewayID" TEXT NOT NULL,
ADD COLUMN     "lastHearbeat" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "location" TEXT NOT NULL,
ADD COLUMN     "sensitivity" INTEGER NOT NULL,
ADD COLUMN     "stagnationTime" INTEGER NOT NULL,
ALTER COLUMN "status" DROP DEFAULT,
ADD CONSTRAINT "Device_pkey" PRIMARY KEY ("deviceID");

-- DropTable
DROP TABLE "SensorLog";

-- CreateTable
CREATE TABLE "User" (
    "userID" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userID")
);

-- CreateTable
CREATE TABLE "Gateway" (
    "gatewayID" TEXT NOT NULL,
    "lastHearbeat" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "Gateway_pkey" PRIMARY KEY ("gatewayID")
);

-- CreateTable
CREATE TABLE "UserGateway" (
    "userID" TEXT NOT NULL,
    "gatewayID" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',

    CONSTRAINT "UserGateway_pkey" PRIMARY KEY ("userID","gatewayID")
);

-- CreateTable
CREATE TABLE "HealthLog" (
    "logID" SERIAL NOT NULL,
    "logType" TEXT NOT NULL,
    "movement" INTEGER NOT NULL,
    "snapshotURL" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceID" TEXT NOT NULL,

    CONSTRAINT "HealthLog_pkey" PRIMARY KEY ("logID")
);

-- CreateTable
CREATE TABLE "Alert" (
    "alertID" SERIAL NOT NULL,
    "alertType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "snapshotURL" TEXT,
    "deviceID" TEXT,
    "gatewayID" TEXT,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("alertID")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- AddForeignKey
ALTER TABLE "UserGateway" ADD CONSTRAINT "UserGateway_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGateway" ADD CONSTRAINT "UserGateway_gatewayID_fkey" FOREIGN KEY ("gatewayID") REFERENCES "Gateway"("gatewayID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_gatewayID_fkey" FOREIGN KEY ("gatewayID") REFERENCES "Gateway"("gatewayID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthLog" ADD CONSTRAINT "HealthLog_deviceID_fkey" FOREIGN KEY ("deviceID") REFERENCES "Device"("deviceID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_deviceID_fkey" FOREIGN KEY ("deviceID") REFERENCES "Device"("deviceID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_gatewayID_fkey" FOREIGN KEY ("gatewayID") REFERENCES "Gateway"("gatewayID") ON DELETE SET NULL ON UPDATE CASCADE;
