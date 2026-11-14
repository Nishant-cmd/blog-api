import { body, param, validationResult } from "express-validator";

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const validateCreateUser = [
  body("name").trim().notEmpty().withMessage("Name is required"),

  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isAlphanumeric()
    .withMessage("Username must contain only letters and numbers")
    .isLength({ min: 1, max: 10 })
    .withMessage("Username must be between 1 and 10 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter"),

  handleValidationErrors,
];

export const validateUpdateUser = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("User ID must be a positive integer"),

  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),

  body("username")
    .optional()
    .trim()
    .isAlphanumeric()
    .withMessage("Username must contain only letters and numbers")
    .isLength({ min: 1, max: 10 })
    .withMessage("Username must be between 1 and 10 characters"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  handleValidationErrors,
];

export const validateUserId = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("User ID must be a positive integer"),
  handleValidationErrors,
];

export const validateCreatePost = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 255 })
    .withMessage("Title must be at most 255 characters"),

  body("slug")
    .trim()
    .notEmpty()
    .withMessage("Slug is required")
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("Slug must be lowercase letters, numbers, and hyphens only"),

  body("content").trim().notEmpty().withMessage("Content is required"),

  body("authorId")
    .isInt({ min: 1 })
    .withMessage("authorId must be a positive integer"),

  handleValidationErrors,
];

export const validateUpdatePost = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Post ID must be a positive integer"),

  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty")
    .isLength({ max: 255 })
    .withMessage("Title must be at most 255 characters"),

  body("content")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Content cannot be empty"),

  body("published")
    .optional()
    .isBoolean()
    .withMessage("published must be a boolean"),

  handleValidationErrors,
];

export const validatePostId = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Post ID must be a positive integer"),
  handleValidationErrors,
];

export const validateCreateComment = [
  param("postId")
    .isInt({ min: 1 })
    .withMessage("Post ID must be a positive integer"),

  body("content").trim().notEmpty().withMessage("Comment content is required"),

  body("authorId")
    .isInt({ min: 1 })
    .withMessage("authorId must be a positive integer"),

  handleValidationErrors,
];

export const validateCommentId = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Comment ID must be a positive integer"),
  handleValidationErrors,
];
