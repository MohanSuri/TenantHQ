import { Request, Response } from 'express';

export const createUser = async(req:Request, res: Response) =>{
    res.status(201).json({ message: "User created successfully" });
}

export const getUser = async(req: Request, res: Response) => {
    const { id } = req.params;
    res.status(200).json({ message: `Getting user with ID: ${id}` });
}

export const getUsers = async(req: Request, res: Response) => {
    res.status(200).json({ message: "Getting all users" });
}

export const updateUser = async(req: Request, res:Response) => {
    const { id } = req.params;
    res.status(200).json({ message: `Updating user with ID: ${id}` });
}

export const deleteUser = async(req: Request, res:Response) => {
    const { id } = req.params;
    res.status(200).json({ message: `Deleting user with ID: ${id}` });
}