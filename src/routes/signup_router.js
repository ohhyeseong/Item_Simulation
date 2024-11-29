import express from "express";
import { prisma } from "../utils/prisma/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authMiddleware from "../middlewares/auth.middleware.js";
import { Prisma } from "@prisma/client";

const router = express.Router();

// 사용자 회원가입 api
router.post("/signup", async (req, res, next) => {
  try {
    const { username, password, name, age, gender } = req.body;

    // 아이디 검증: 영어 소문자와 숫자만 허용
    const usernameRegex = /^[a-z0-9]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        message:
          "잘못된 입력입니다. 아이디는 영어 소문자와 숫자만 포함해야 합니다.",
      });
    }

    // 비밀번호 검증: 최소 6자리 이상
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "비밀번호는 최소 6자리 이상이어야 합니다." });
    }

    // 아이디 중복 체크
    const isExistUser = await prisma.users.findFirst({
      where: {
        username,
      },
    });

    if (isExistUser) {
      return res.status(409).json({ message: "이미 존재하는 아이디입니다." });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 데이터베이스에 사용자 및 캐릭터 정보 저장
    const [user, characterInformations] = await prisma.$transaction(
      async (tx) => {
        const user = await tx.users.create({
          data: {
            username,
            password: hashedPassword,
          },
        });

        const characterInformations = await tx.characterinformations.create({
          data: {
            userId: user.userId,
            name,
            age,
            gender: gender.toUpperCase(), // 성별을 대문자로 변환합니다.
          },
        });

        return [user, characterInformations];
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      }
    );

    return res.status(201).json({ message: "회원가입이 완료되었습니다." });
  } catch (err) {
    next(err);
  }
});

router.post("/signin", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.users.findFirst({
      where: {
        username,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "존재하지 않는 아이디입니다." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    const token = jwt.sign({ userId: user.userId }, "custom-secret-key", {
      expiresIn: "1h", // 토큰 만료 시간 설정 (1시간)
    });

    res.cookie("authorization", `bearer ${token}`, {
      httpOnly: true,
      secure: true,
      maxAge: 3600000, // 1시간
    });

    res.setHeader("authorization", `Bearer ${token}`);

    return res.status(200).json({ message: "로그인에 성공하였습니다." });
  } catch (err) {
    next(err);
  }
});

// 사용자 정보 검색
router.patch("/users", authMiddleware, async (req, res, next) => {
  const updatedData = req.body;
  const { userId } = req.user;
  const characterInformation = await prisma.characterinformations.findFirst({
    where: { userId: +userId },
  });

  // 사용자 정보가 존재하지 않을 경우
  if (!characterInformation) {
    return res
      .status(404)
      .json({ message: "사용자 정보가 존재하지 않습니다." });
  }

  await prisma.$transaction(
    async (tx) => {
      const updatedUserInfo = await tx.characterinformations.update({
        data: {
          ...updatedData,
        },
        where: {
          userId: +userId,
        },
      });

      for (let key in updatedData) {
        if (String(characterInformation[key]) !== String(updatedData[key])) {
          await tx.userHistories.create({
            data: {
              userId: +userId,
              changedField: key,
              oldValue: String(characterInformation[key]),
              newValue: String(updatedData[key]),
            },
          });
        }
      }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    }
  );

  // 성공 응답 반환
  return res
    .status(200)
    .json({ message: "사용자 정보 변경에 성공하였습니다." });
});
export default router;
