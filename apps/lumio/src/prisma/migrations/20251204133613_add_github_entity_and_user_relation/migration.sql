-- CreateTable
CREATE TABLE "GitHub" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "username" VARCHAR(40) NOT NULL,
    "gitId" VARCHAR(100) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "GitHub_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GitHub_gitId_key" ON "GitHub"("gitId");

-- CreateIndex
CREATE UNIQUE INDEX "GitHub_userId_key" ON "GitHub"("userId");

-- AddForeignKey
ALTER TABLE "GitHub" ADD CONSTRAINT "GitHub_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
