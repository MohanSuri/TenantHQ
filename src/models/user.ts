import mongoose from "mongoose";

export enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER'
}

const userSchema = new mongoose.Schema(
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

export const User = mongoose.model("User", userSchema);