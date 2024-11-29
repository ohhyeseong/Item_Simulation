import winston from "winston";

const logger = winston.createLogger({
  letvel: "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

export default function (req, res, next) {
  const start = new Date().getTime();

  res.on("finish", () => {
    const duration = new Date().getTime() - start;
    logger.info(
      `method: ${req.method}, URL: ${req.url}, Status: ${res.statusCode}, Duration: ${duration}ms`
    );
  });

  next();
}
