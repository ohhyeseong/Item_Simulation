export default function (err, req, res, next) {
  console.error(err);

  res.status(500).json({ massage: "서버 내부에서 에러가 발생했습니다." });
}
