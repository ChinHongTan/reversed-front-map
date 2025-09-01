import mongoose from 'mongoose';
import pino from 'pino';

const logger = pino({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            logger.error("[Database] MONGODB_URI is not defined in environment variables.");
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGODB_URI);
        logger.info("[Database] MongoDB Connected...");
    } catch (err: any) {
        logger.error("[Database] MongoDB connection error:", err.message);
        process.exit(1);
    }
};

export default connectDB;