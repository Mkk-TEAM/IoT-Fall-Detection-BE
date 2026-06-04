-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'online',

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensorLog" (
    "id" SERIAL NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceId" TEXT NOT NULL,

    CONSTRAINT "SensorLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SensorLog" ADD CONSTRAINT "SensorLog_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
