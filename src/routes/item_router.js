// src/routes/posts.router.js

import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

/** 아이템 생성 API **/
router.post("/items", authMiddleware, async (req, res, next) => {
  const { userId } = req.user; // 인증된 사용자 ID
  const { name, health, strength, price } = req.body; // 요청 본문에서 데이터 추출

  // 유효성 검사
  if (!name) {
    return res.status(400).json({
      message: "아이템 이름은 필수입니다.",
    });
  }

  // 체력, 공격력, 가격이 숫자인지 확인
  let validatedHealth = typeof health === "number" ? health : 0;
  let validatedStrength = typeof strength === "number" ? strength : 0;
  let validatedPrice = typeof price === "number" ? price : 0;

  try {
    // 아이템 생성
    const item = await prisma.items.create({
      data: {
        userId: +userId,
        name,
        health: validatedHealth,
        strength: validatedStrength,
        price: validatedPrice,
      },
    });

    // 성공 응답 반환
    return res.status(201).json({ data: item });
  } catch (error) {
    console.error(error); // 에러 로그
    next(error); // 에러 핸들링
  }
});

/** 아이템 목록 조회 API **/
router.get("/items", async (req, res, next) => {
  try {
    const items = await prisma.items.findMany({
      select: {
        ItemId: true,
        name: true,
        price: true,
      },
      orderBy: {
        createdAt: "desc", // 게시글을 최신순으로 정렬합니다.
      },
    });

    return res.status(200).json({ data: items });
  } catch (error) {
    console.error(error); // 에러 로그
    return res.status(500).json({ message: "서버 오류가 발생했습니다." }); // 에러 메시지 응답
  }
});

/** 아이템 상세 조회 API **/
router.get("/items/:id", async (req, res, next) => {
  try {
    const itemId = parseInt(req.params.id);

    const item = await prisma.items.findFirst({
      where: {
        ItemId: itemId,
      },
      select: {
        ItemId: true,
        userId: true,
        name: true,
        price: true,
      },
    });

    if (!item) {
      return res.status(404).json({ message: "아이템을 찾을 수 없습니다." });
    }

    return res.status(200).json({ data: item });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});
// 아이템 수정 API
router.patch("/items/:id", authMiddleware, async (req, res) => {
  const itemId = parseInt(req.params.id);
  const { item_name, item_stat } = req.body;
  const { userId } = req.user;

  // 수정할 필드가 없을 경우
  if (!item_name && !item_stat) {
    return res.status(400).json({ message: "수정할 필드가 필요합니다." });
  }

  try {
    // 아이템 조회
    const item = await prisma.items.findUnique({
      where: { ItemId: itemId },
    });

    // 아이템이 존재하지 않거나, 해당 사용자의 것이 아닐 경우
    if (!item || item.userId !== userId) {
      return res
        .status(403)
        .json({ message: "권한이 없거나 아이템이 존재하지 않습니다." });
    }

    // 아이템 수정
    const updatedItem = await prisma.items.update({
      where: { ItemId: itemId },
      data: {
        name: item_name || item.name,
        health:
          item_stat?.health !== undefined ? item_stat.health : item.health,
        strength:
          item_stat?.strength !== undefined
            ? item_stat.strength
            : item.strength,
      },
    });

    return res
      .status(200)
      .json({ message: "아이템이 수정되었습니다.", data: updatedItem });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

export default router;
