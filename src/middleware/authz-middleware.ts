import { AuthService } from "@/services/auth-service";
import { AuthenticatedUser } from "@/types/auth";
import logger from "@/utils/logger";
import { Request, Response, NextFunction } from "express";

export function doesUserHavePermission(requiredPermission: string) {
  return async function (req:Request, res:Response, next:NextFunction) {
    logger.info(`doesUserHavePermission ${req.user!.userId} - ${requiredPermission}`)
    const user = req.user as AuthenticatedUser;
    
    try {
      await AuthService.getInstance().doesUserHavePermission(user, requiredPermission);
      next();
    } catch (error) {
      next(error); // This will pass the error to the error handling middleware
    }
  }    
}