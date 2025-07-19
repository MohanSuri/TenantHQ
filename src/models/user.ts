import mongoose, { Document } from "mongoose";

export enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER'
}

export interface IUser extends Document {
    userName: string;
    email: string;
    password: string;
    createdAt: Date;
    tenantId: mongoose.Types.ObjectId;
    role: UserRole;
}

const userSchema = new mongoose.Schema<IUser>(
    {
        userName: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        role: { 
            type: String, 
            enum: Object.values(UserRole),
            default: UserRole.USER,
            required: true 
        },
    }
);

export const User = mongoose.model<IUser>("User", userSchema);