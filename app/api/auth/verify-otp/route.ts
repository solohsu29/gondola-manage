import { PrismaClient } from "@/lib/generated/prisma";
import { NextRequest, NextResponse } from "next/server";


const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { email, otp } = await req.json();
  if (!email || !otp) {
    return NextResponse.json({ message: "Email and OTP are required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  // Find the latest unverified OTP for this user
  const otpRecord = await prisma.oTP.findFirst({
    where: {
      userId: user.id,
      code: otp,
      verified: false,
      expiresAt: { gt: new Date() },
      type: { in: ['SIGNUP', 'FORGOT_PASSWORD'] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    return NextResponse.json({ message: "Invalid or expired OTP" }, { status: 400 });
  }

  // Mark OTP as verified
  await prisma.oTP.update({ where: { id: otpRecord.id }, data: { verified: true } });

  return NextResponse.json({ message: "Signup OTP verified!" });
}
