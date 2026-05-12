import winston from 'winston'

const { combine, timestamp, json, errors } = winston.format

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: {
        service: '@flowise/engram-api'
    },
    format: combine(timestamp(), errors({ stack: true }), json()),
    transports: [
        new winston.transports.Console({
            format:
                process.env.NODE_ENV === 'development'
                    ? winston.format.combine(winston.format.colorize(), winston.format.simple())
                    : undefined
        })
    ]
})

export default logger
