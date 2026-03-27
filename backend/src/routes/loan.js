import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  applyForLoan,
  getMyLoans,
  getMyLoanById,
  acceptLoanOffer,
  declineLoanOffer,
} from "../controllers/loanController.js";

const router = express.Router();

router.use(protect);

router.post("/apply", applyForLoan);
router.get("/my-loans", getMyLoans);
router.get("/my-loans/:loanId", getMyLoanById);
router.patch("/:loanId/accept", acceptLoanOffer);
router.patch("/:loanId/decline", declineLoanOffer);

export default router;
