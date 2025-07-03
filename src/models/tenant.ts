import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema({
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

export const Tenant = mongoose.model("Tenant", tenantSchema);