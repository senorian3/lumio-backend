-- CreateTable
CREATE TABLE "Google" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "username" VARCHAR(40) NOT NULL,
    "googleId" VARCHAR(100) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Google_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Google_googleId_key" ON "Google"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "Google_userId_key" ON "Google"("userId");

-- AddForeignKey
ALTER TABLE "Google" ADD CONSTRAINT "Google_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
