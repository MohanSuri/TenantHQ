import mongoose, { Document } from "mongoose";

export enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER'
}

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    userName: string;
    email: string;
    password: string;
    createdAt: Date;
    tenantId: mongoose.Types.ObjectId;
    role: UserRole;
    isTerminated: boolean;
    terminationDetails?: {
        approvedBy: mongoose.Types.ObjectId;
        terminationDate: Date;
    }
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
        isTerminated: {
            type: Boolean,
            default: false,
        },
        terminationDetails:{
            approvedBy: {
                type: mongoose.Schema.Types.ObjectId,
                required: false
            },
            terminationDate: {
                type: Date,
                required: false
            }
        }
    }
);

export const User = mongoose.model<IUser>("User", userSchema);