import { Router } from "express";

const router = Router();

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "API is healthy" });
});

// Add your resource routes here
// router.use('/users', userRoutes);

export default router;
