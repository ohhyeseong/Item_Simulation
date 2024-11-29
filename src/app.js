import express from "express";
import dotenv from "dotenv";
import goodsRouter from "./routes/signup_router.js";
import ItemRouter from "./routes/item_router.js";
import characterRouter from "./routes/character_router.js";
import LogMiddleware from "./middlewares/log.middleware.js";
import ErrorHandlingMiddleware from "./middlewares/error-handling.middleware.js";
import cookieParser from "cookie-parser";
dotenv.config();

const app = express();
const PORT = (process.env.PORT = 3000);
// router 연결

app.use(LogMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api", [goodsRouter, ItemRouter, characterRouter]);
// 서버 열기
app.use(ErrorHandlingMiddleware);
app.listen(PORT, () => {
  console.log(`서버가 ${PORT} 포털 열렸습니다.`);
});
