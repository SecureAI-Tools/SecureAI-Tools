import { createLogger, format, Logger, transports } from "winston";
import "winston-daily-rotate-file";

import { SERVICE_NAME } from "lib/core/constants";

let logger: Logger | undefined = undefined;

const getLogger = (fileName = SERVICE_NAME): Logger => {
  if (logger) {
    return logger;
  }

  logger = newLogger(fileName);

  return logger;
};

const newLogger = (fileName = SERVICE_NAME): Logger => {
  console.log("LOG_DIR =", process.env.LOG_DIR);

  const fileLogTransport = new transports.DailyRotateFile({
    filename: `${process.env.LOG_DIR ?? "."}/logs/${fileName}-%DATE%.log`,
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "7d",
  });

  const consoleTransport = new transports.Console({
    level: process.env.LOG_LEVEL,
    handleExceptions: false,
    format: getFormat(),
  });

  const logger = createLogger({
    level: process.env.LOG_LEVEL,
    format: getFormat(),
    defaultMeta: { service: SERVICE_NAME },
    transports: [consoleTransport, fileLogTransport],
  });

  return logger;
};

const getFormat = () => {
  return format.combine(
    format.colorize(),
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.printf(
      ({ level, message, timestamp }) => `${timestamp} [${level}]: ${message}`,
    ),
  );
};

export default getLogger;
