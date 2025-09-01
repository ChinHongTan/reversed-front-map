import mongoose, { Schema, Document } from 'mongoose';
import { City } from "./index";

// Interface for the timelapse event document
export interface ITimelapseEvent extends Document {
    timestamp: Date;
    logDate: string; // YYYY-MM-DD format
    cityId: number;
    newController: City["control_union"];
    oldController: City["control_union"];
}

// Mongoose Schema for TimelapseEvent
const TimelapseEventSchema: Schema = new Schema({
    timestamp: { type: Date, required: true, index: true },
    logDate: { type: String, required: true, index: true }, // YYYY-MM-DD format
    cityId: { type: Number, required: true },
    newController: { type: Object, required: true },
    oldController: { type: Object, required: true }
});

TimelapseEventSchema.index({
    logDate: 1,
    timestamp: 1,
});

// Schema for initial state
export interface IInitialState extends Document {
    date: string; // YYYY-MM-DD format
    cities: City[];
}

const InitialStateSchema: Schema = new Schema({
    date: { type: String, required: true, unique: true },
    cities: { type: Array, required: true },
});

export const TimelapseEvent = mongoose.model<ITimelapseEvent>('TimelapseEvent', TimelapseEventSchema);
export const InitialState = mongoose.model<IInitialState>('InitialState', InitialStateSchema);