// src/routes/posts.router.js

import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

/** 캐릭터 생성 API **/
router.post("/characters", authMiddleware, async (req, res, next) => {
  const { charactername } = req.body; // 요청 본문에서 캐릭터 이름만 추출
  const { userId } = req.user; // 인증된 사용자 ID

  try {
    const character = await prisma.character.create({
      data: {
        userId,
        charactername,
      },
    });

    return res
      .status(201)
      .json({ message: "캐릭터가 생성되었습니다.", data: character });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "캐릭터 생성 중 오류가 발생했습니다." });
  }
});

// 캐릭터 삭제 AIP(캐릭터 삭제)
router.delete(
  "/characters/:characterId",
  authMiddleware,
  async (req, res, next) => {
    const { characterId } = req.params;

    try {
      // 캐릭터 삭제
      const character = await prisma.character.delete({
        where: {
          characterId: +characterId,
        },
      });

      return res.status(200).json({ message: "정상적으로 삭제되었습니다!" });
    } catch (err) {
      // 캐릭터가 존재하지 않을 때 발생하는 오류 처리
      if (err.code === "P2025") {
        return res.status(404).json({ message: "존재하지 않는 아이디입니다." });
      }
      console.error(err);
      return res
        .status(500)
        .json({ message: "캐릭터 삭제 중 오류가 발생했습니다." });
    }
  }
);

/** 캐릭터 목록 조회 API **/
router.get("/characters", authMiddleware, async (req, res, next) => {
  try {
    const characters = await prisma.character.findMany({
      select: {
        characterId: true,
        userId: true,
        charactername: true,
        stats: true,
        money: true,
      },
      orderBy: {
        characterId: "asc",
      },
    });

    return res.status(200).json({ data: characters });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "캐릭터 목록 조회 중 오류가 발생했습니다." });
  }
});

/** 캐릭터 상세 조회 API **/
router.get(
  "/characters/:characterId",
  authMiddleware,
  async (req, res, next) => {
    const { characterId } = req.params;

    try {
      const character = await prisma.character.findUnique({
        where: {
          characterId: +characterId,
        },
        select: {
          characterId: true,
          userId: true,
          charactername: true,
          stats: true,
          money: true,
        },
      });

      if (!character) {
        return res.status(404).json({ message: "캐릭터를 찾을 수 없습니다." });
      }

      return res.status(200).json({ data: character });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "캐릭터 상세 조회 중 오류가 발생했습니다." });
    }
  }
);
export default router;
