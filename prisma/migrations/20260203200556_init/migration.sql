-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "name" TEXT,
    "accountAssociatedSince" INTEGER,
    "mainDevice" BOOLEAN NOT NULL DEFAULT false,
    "prosumer" BOOLEAN NOT NULL DEFAULT false,
    "division" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CurrentData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "outdated" BOOLEAN NOT NULL DEFAULT false,
    "watt" REAL,
    "kiloWattHour" REAL,
    "deltaKiloWattHour" REAL,
    "cubicMeterCold" REAL,
    "cubicMeterWarm" REAL,
    "cubicMeter" REAL,
    "deltaCubicMeter" REAL,
    "timestamp" INTEGER,
    "aPlus" REAL,
    "aPlusHT" REAL,
    "aPlusNT" REAL,
    "aMinus" REAL,
    "l1" REAL,
    "l2" REAL,
    "l3" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CurrentData_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("deviceId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OperatingReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "max" REAL,
    "min" REAL,
    "avg" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OperatingReport_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("deviceId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OperatingReportValue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" INTEGER,
    "value" REAL,
    "operatingReportId" TEXT,
    "operatingReportPlusId" TEXT,
    "operatingReportMinusId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperatingReportValue_operatingReportId_fkey" FOREIGN KEY ("operatingReportId") REFERENCES "OperatingReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OperatingReportValue_operatingReportPlusId_fkey" FOREIGN KEY ("operatingReportPlusId") REFERENCES "OperatingReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OperatingReportValue_operatingReportMinusId_fkey" FOREIGN KEY ("operatingReportMinusId") REFERENCES "OperatingReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Report_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("deviceId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReportSummaryPower" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "summaryType" TEXT NOT NULL,
    "sumCurrency" REAL,
    "startTime" INTEGER,
    "startTimeCurrency" REAL,
    "sum" REAL,
    "max" REAL,
    "maxCurrency" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReportSummaryPower_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReportSummaryPower_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReportSummaryPower_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReportSummaryPower_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReportSummaryHeat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "sumCurrency" REAL,
    "startTime" INTEGER,
    "startTimeCurrency" REAL,
    "sum" REAL,
    "max" REAL,
    "maxCurrency" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReportSummaryHeat_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReportSummaryGas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "sumCurrency" REAL,
    "startTime" INTEGER,
    "startTimeCurrency" REAL,
    "sum" REAL,
    "max" REAL,
    "maxCurrency" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReportSummaryGas_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReportSummaryWater" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "sumCurrency" REAL,
    "startTime" INTEGER,
    "startTimeCurrency" REAL,
    "sum" REAL,
    "max" REAL,
    "maxCurrency" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReportSummaryWater_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReportMeterReading" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" REAL,
    "type" INTEGER,
    "reportSummaryPowerId" TEXT,
    "reportSummaryHeatId" TEXT,
    "reportSummaryGasId" TEXT,
    "reportSummaryWaterId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReportMeterReading_reportSummaryPowerId_fkey" FOREIGN KEY ("reportSummaryPowerId") REFERENCES "ReportSummaryPower" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReportMeterReading_reportSummaryHeatId_fkey" FOREIGN KEY ("reportSummaryHeatId") REFERENCES "ReportSummaryHeat" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReportMeterReading_reportSummaryGasId_fkey" FOREIGN KEY ("reportSummaryGasId") REFERENCES "ReportSummaryGas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReportMeterReading_reportSummaryWaterId_fkey" FOREIGN KEY ("reportSummaryWaterId") REFERENCES "ReportSummaryWater" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReportValue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" INTEGER,
    "value" REAL,
    "type" INTEGER,
    "reportSummaryPowerId" TEXT,
    "reportSummaryHeatId" TEXT,
    "reportSummaryGasId" TEXT,
    "reportSummaryWaterId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReportValue_reportSummaryPowerId_fkey" FOREIGN KEY ("reportSummaryPowerId") REFERENCES "ReportSummaryPower" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReportValue_reportSummaryHeatId_fkey" FOREIGN KEY ("reportSummaryHeatId") REFERENCES "ReportSummaryHeat" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReportValue_reportSummaryGasId_fkey" FOREIGN KEY ("reportSummaryGasId") REFERENCES "ReportSummaryGas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReportValue_reportSummaryWaterId_fkey" FOREIGN KEY ("reportSummaryWaterId") REFERENCES "ReportSummaryWater" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Device_deviceId_key" ON "Device"("deviceId");

-- CreateIndex
CREATE INDEX "Device_deviceId_idx" ON "Device"("deviceId");

-- CreateIndex
CREATE INDEX "CurrentData_deviceId_idx" ON "CurrentData"("deviceId");

-- CreateIndex
CREATE INDEX "CurrentData_timestamp_idx" ON "CurrentData"("timestamp");

-- CreateIndex
CREATE INDEX "OperatingReport_deviceId_idx" ON "OperatingReport"("deviceId");

-- CreateIndex
CREATE INDEX "OperatingReportValue_timestamp_idx" ON "OperatingReportValue"("timestamp");

-- CreateIndex
CREATE INDEX "Report_deviceId_idx" ON "Report"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportSummaryPower_reportId_key" ON "ReportSummaryPower"("reportId");

-- CreateIndex
CREATE INDEX "ReportSummaryPower_reportId_idx" ON "ReportSummaryPower"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportSummaryHeat_reportId_key" ON "ReportSummaryHeat"("reportId");

-- CreateIndex
CREATE INDEX "ReportSummaryHeat_reportId_idx" ON "ReportSummaryHeat"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportSummaryGas_reportId_key" ON "ReportSummaryGas"("reportId");

-- CreateIndex
CREATE INDEX "ReportSummaryGas_reportId_idx" ON "ReportSummaryGas"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportSummaryWater_reportId_key" ON "ReportSummaryWater"("reportId");

-- CreateIndex
CREATE INDEX "ReportSummaryWater_reportId_idx" ON "ReportSummaryWater"("reportId");

-- CreateIndex
CREATE INDEX "ReportValue_timestamp_idx" ON "ReportValue"("timestamp");
