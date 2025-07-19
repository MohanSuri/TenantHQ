import mongoose, { Document } from "mongoose";

export interface ITenant extends Document {
    name: string;
    createdAt: Date;
    domain: string;
}

const tenantSchema = new mongoose.Schema<ITenant>({
    name: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  domain: {
    type: String,
    required: true,
    unique: true,
  },
});

export const Tenant = mongoose.model<ITenant>("Tenant", tenantSchema);