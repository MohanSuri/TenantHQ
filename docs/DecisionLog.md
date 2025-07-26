Date: 2025-07-26
Context:
To ensure secure and auditable user termination within a multi-tenant system, especially to prevent accidental or malicious deactivation of critical roles like admins.

Decision:

Termination is a 2-step process: request → admin approval.

Only an admin from the same tenant can terminate a user (excluding self).

Prevent termination of the last active admin.

All critical read/write operations are wrapped in a MongoDB transaction to avoid race conditions and enforce role integrity.

Centralized error handling is used for consistent API responses.

Rationale:
This design provides a balance between security, data integrity, and auditability, aligning with production-grade best practices.